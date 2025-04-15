const RoomUserModel = require('../models/roomUserModel');
const RoomModel = require('../models/roomModel');
const UserModel = require('../models/userModel');
const UserController = require('../controllers/userController');
const ImageHelper = require('../utils/imageHelper');
const MessageModel = require('../models/messageModel');
const InvitationModel = require('../models/invitationModel');

class RoomUserController {
    constructor() {
        this.userController = new UserController();
    }

    async getRandomChatImageUrl(req) {
        const randomNumber = Math.floor(Math.random() * 21) + 1; // Random number between 1 and 20
        const imageName = `group${randomNumber}.png`;
        const imageUrl = `public/images/${imageName}`;
        return imageUrl;
    }

    async getChatRoomDetails(req, roomResult, userId){
        var memberDetails = [];
        const members = await RoomUserModel.findAll({ where: { room_id: roomResult.room_id, is_deleted: 0 }});
        
        for await (const member of members) {
            const user = await UserModel.findOne({ where: { id: member.user_id }});
            memberDetails.push({
                name: user.display_name,  
                is_admin: member.is_admin == 1,
                user_image_url: ImageHelper.getImagePath(req, user.image_url),  
                room_user_id: member.room_user_id
            });
        }    
        
        const creator = await UserModel.findOne({ where: { id: roomResult.creator_id }});
        const creatorName = creator.display_name || "Unknown";

        const currentUser = members.find(member => member.user_id === userId);
        const roomUserId = currentUser?.room_user_id || null;

        const roomUserIds = members.map((item) => item.room_user_id);
        const lastMessage = await MessageModel.findOne({ 
            where: { 
                room_user_id: roomUserIds,  
                deleted_at: null
            }, 
            order: [['created_at', 'DESC']]
        });
        
        var preview = "Say hello...";
        if (lastMessage != undefined) {
            const lastSender = memberDetails.find(x => x.room_user_id === lastMessage.room_user_id)?.name || "Unknown";
            preview = lastSender + " : " + lastMessage.content;
        }

        var isMuted = true;
        if (roomUserId != null) {
            let roomUserCurrent = await RoomUserModel.findOne({ where: { room_user_id: roomUserId, is_deleted: 0}});
            isMuted = roomUserCurrent.is_muted;
        }

        return {
            room_id: roomResult.room_id,
            author_id: roomResult.creator_id,  
            author_name: creatorName, 
            preview: preview,
            is_joined: roomUserId != null,
            is_muted: isMuted,
            current_room_user_id: roomUserId,
            has_password: roomResult.password != null,
            chat_name: roomResult.room_name,
            chat_image_url: ImageHelper.getImagePath(req, roomResult.image_url),
            member_details: memberDetails
        };
    }

    async createChatRoom(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }

            let userId = tokenCheck.result.user_id;

            const { name, password } = req.body;

            let imageUrl = await this.getRandomChatImageUrl(req);

            let createResult = await RoomModel.create({
                room_name: name,
                creator_id: userId,
                password: password,
                image_url: imageUrl
            });
            if (!createResult) { throw new Error("Failed to create room"); } 

            let roomUserResult = await RoomUserModel.create({
                room_id: createResult.room_id,
                user_id: userId,
                is_admin: 1
            });
            if (!roomUserResult) { throw new Error("Failed to create room user"); } 

            let chatRoomDetails = await this.getChatRoomDetails(req, createResult, userId);

            let response = {
                chatroom: chatRoomDetails,
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            }

            res.status(200).json(response);
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }

    async muteChatRoom(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken);
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const { room_user_id } = req.body;

            let roomUserResult = await RoomUserModel.findOne({ where: { room_user_id: room_user_id } });
            if (!roomUserResult) { throw new Error("Failed to fetch roomUser"); }

            let updateResult = await RoomUserModel.update(
                { is_muted: !roomUserResult.is_muted },
                { where: { room_user_id: room_user_id }}
            );
            if (!updateResult) { throw new Error("Failed to update roomUser"); }

            let response = {
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            }

            res.status(200).json(response);
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }

    async updateChatRoom(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken);
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const { room_user_id, name } = req.body;

            let roomUserResult = await RoomUserModel.findOne({ where: { room_user_id: room_user_id } });
            if (!roomUserResult) { throw new Error("Failed to fetch room"); }

            let updateResult = await RoomModel.update(
                { room_name: name, updated_at: Date.now() },
                { where: { room_id: roomUserResult.room_id }}
            );
            if (!updateResult) { throw new Error("Failed to update room"); }

            let roomResult = await RoomModel.findOne({ where: { room_id: roomUserResult.room_id } });
            let chatRoomDetails = await this.getChatRoomDetails(req, roomResult, userId);

            let response = {
                chatroom : chatRoomDetails,
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            }

            res.status(200).json(response);
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }

    async deleteChatRoom(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken);
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }

            const { room_user_id } = req.body;

            let roomUserResult = await RoomUserModel.findOne({ where: { room_user_id: room_user_id } });
            if (!roomUserResult) { throw new Error("Failed to fetch room"); }

            let updateResult = await RoomModel.update(
                { is_deleted: 1, updated_at: Date.now() },
                { where: { room_id: roomUserResult.room_id }}
            );
            if (!updateResult) { throw new Error("Failed to delete room"); }

            let response = {
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            }

            res.status(200).json(response);
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }

    async getChatRooms(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken);
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const allRooms = await RoomModel.findAll({ where: { is_deleted: 0 } });
            const chatRooms = [];
    
            for (const room of allRooms) {
                let chatRoomDetails = await this.getChatRoomDetails(req, room, userId);
                chatRooms.push(chatRoomDetails);
            }
            
            let createdAt = null;
            let lastInvitationResult = await InvitationModel.findOne({ 
                where: { user_id: userId, is_invalid: 0 },
                order: [['created_at', 'DESC']]
            });
            if (lastInvitationResult) { createdAt = lastInvitationResult.created_at }

            let response = {
                chat_rooms: chatRooms,
                last_invitation_date: createdAt || null, 
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            }
            res.status(200).json(response);
        } catch (err) {
            res.status(500).json({
                error: {
                    code: '002',
                    message: err.message || 'An error occurred while fetching chat rooms'
                }
            });
        }
    }

    async joinRoom(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const { room_id, password } = req.body;
            
            const roomResult = await RoomModel.findOne({ where: {
                room_id: room_id
            }});
            if (!roomResult) { throw new Error("Room not found."); }
            if (roomResult.password != null && roomResult.password != password) { throw new Error("Incorrect password");}

            let roomUserResult = await RoomUserModel.create({
                room_id: room_id,
                user_id: userId
            });
            if (!roomUserResult) { throw new Error("Failed to create room"); } 
        
            let chatRoomDetails = await this.getChatRoomDetails(req, roomResult, userId);

            let response = {
                chat_room: chatRoomDetails,
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            }

            res.status(200).json(response);
        } catch (err) {
            res.status(500).json({
                error: {
                    code: '002',
                    message: err.message || 'An error occurred while fetching chat rooms'
                }
            });
        }
    }

    async updateAdminStatus(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            
            const { room_user_id, is_admin } = req.body;
            
            let result = await RoomUserModel.update(
                { is_admin: is_admin },
                { where: { room_user_id: room_user_id } }
            );
            if (!result) { throw new Error("Failed to update user status"); }

            res.status(200).json({
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            });
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "500",
                    message: err.message
                }
            });
        }
    }

    async deleteRoomUser(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            
            const { room_user_id } = req.body;
            
            let result = await RoomUserModel.update(
                { is_deleted: 1 },
                { where: { room_user_id: room_user_id } }
            );
            if (!result) { throw new Error("Failed to update user status"); }
            
            res.status(200).json({
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            });
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "500",
                    message: err.message
                }
            });
        }
    }
    async isTypingInRoom(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            
            const { room_user_id, is_typing } = req.body;
            
            let result = await RoomUserModel.update(
                { is_typing: is_typing ? 1 : 0 },
                { where: { room_user_id: room_user_id } }
            );
            if (!result) { throw new Error("Failed to update user typing status"); }
            
            const roomUserRoom = await RoomUserModel.findOne({ where: { room_user_id: room_user_id }});
            const roomUsers = await RoomUserModel.findAll({ where: { room_id: roomUserRoom.room_id, is_typing: 1 } });
            const userIds = roomUsers.map((item) => item.user_id);
            const userResult = await UserModel.findAll({ where: { id: userIds }});
            const userDisplayNames = userResult.map((item) => item.display_name);

            res.status(200).json({
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            });
            
            return { roomId: roomUserRoom.room_id, displayNames: userDisplayNames }
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "500",
                    message: err.message
                }
            });
        }
    }
}

module.exports = RoomUserController;
