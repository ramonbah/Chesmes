const UserModel = require('../models/userModel');
const UserDeviceModel = require('../models/userDeviceModel');
const RoomUserModel = require('../models/roomUserModel');
const RoomModel = require('../models/roomModel');
const InvitationModel = require('../models/invitationModel');
const UserController = require('../controllers/userController');
const RoomUserController = require('../controllers/roomUserController');
const ImageHelper = require('../utils/imageHelper');
const NotificationController = require('../controllers/notificationController');

class InvitationController {
    constructor() {
        this.userController = new UserController();
        this.roomUserController = new RoomUserController();
        this.notificationController = new NotificationController();
    }

    async getAll(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const invitations = await InvitationModel.findAll({ where: {
                user_id: userId,
                is_invalid: 0
            }});

            var formattedInvitations = [];
                
            for await (const invitation of invitations) {
                const user = await UserModel.findOne({ where: { id: invitation.created_by }});
                const room = await RoomModel.findOne({ where: { room_id: invitation.room_id }});
                formattedInvitations.push({
                    chat_name: room.room_name, // Room name as chat_name
                    chat_image_url: ImageHelper.getImagePath(req, user.image_url),
                    inviter_name: user.display_name, // Inviter's display name
                    room_id: invitation.room_id, // Room ID
                    invitation_id: invitation.invitation_id
                }); 
            }    
           
            res.status(200).json({
                success: 1,
                invitations: formattedInvitations
            });
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "500",
                    message: "Failed to fetch invitations"
                }
            });
        }
    }

    // Send a new invitation
    async send(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const { invitee_user_id, room_id } = req.body;

            let existingInvitation = await InvitationModel.findAll({ where: {
                user_id: invitee_user_id,
                room_id: room_id
            } });

            if (existingInvitation.length > 0) {
                return res.status(409).json({
                    success: 0,
                    error: {
                        code: "409",
                        message: "Invitation already exists."
                    }
                });
            }
            
            const result = await InvitationModel.create({
                user_id: invitee_user_id,
                room_id: room_id,
                created_by: userId
            });
            
            if (result) {
                const userDeviceResult = await UserDeviceModel.findOne({ where: { user_id: invitee_user_id }});
                let senderResult = await UserModel.findOne({ where: { id: userId }});
                let roomResult = await RoomModel.findOne({ where: { room_id: room_id }});
                await this.notificationController.sendNotification(userDeviceResult.device_push_token,
                    senderResult.display_name,
                    "invited you to join " + roomResult.room_name,
                    "ROOM_INVITATION",
                    {
                        "roomId" : room_id,
                        "invitationId": result.invitation_id
                    }
                );

                res.json({
                    success: 1,
                    error: {
                        code: "000",
                        message: ""
                    }
                });
            } else {
                res.status(500).json({
                    success: 0,
                    error: {
                        code: "500",
                        message: "Failed to send invitation"
                    }
                });
            }
        } catch (err) {
            res.status(500).json({
                success: 0,
                error: {
                    code: "500",
                    message: "Failed to send invitation"
                }
            });
        }
    }

    async accept(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const { invitation_id, room_id } = req.body;

            // Check if the user has an invitation for the room
            const invitation = await InvitationModel.findOne({
                where: { room_id: room_id, user_id: userId }
            });
            if (invitation) {
                // If invitation exists, set it to invalid

                const result = await InvitationModel.update(
                    { is_invalid: 1, updated_at: Date.now() },
                    { where: { invitation_id: invitation_id } } 
                );
                if (!result) {
                    return res.status(500).json({
                        success: 0,
                        error: {
                            code: "500",
                            message: "Failed to set the invitation as invalid.",
                        },
                    });
                }
                let roomUserResult = await RoomUserModel.create({
                    room_id: room_id,
                    user_id: userId
                });
                if (!roomUserResult) { throw new Error("Failed to create room"); } 

                const roomResult = await RoomModel.findOne({ where: {
                    room_id: room_id
                }});
            
                const chatRoom = await this.roomUserController.getChatRoomDetails(req, roomResult, userId);
        
                let response = {
                    chat_room: chatRoom,
                    success: 1,
                    error: {
                        code: "000",
                        message: ""
                    }
                }
                return res.status(200).json(response);
            } else {
                // If no invitation exists
                return res.status(404).json({
                    success: 0,
                    error: {
                        code: "404",
                        message: "No invitation found for the user and room.",
                    },
                });
            }
        } catch (err) {
            return res.status(500).json({
                success: 0,
                error: {
                    code: "500",
                    message: "An error occurred while invalidating the invitation.",
                },
            });
        }
    }

}

module.exports = InvitationController;
