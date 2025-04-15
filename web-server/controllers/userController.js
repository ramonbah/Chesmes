// userController.js
const crypto = require("crypto");
const { Op } = require('sequelize');
const UserModel = require('../models/userModel');
const UserDeviceModel = require('../models/userDeviceModel');
const UserTokenModel = require('../models/userTokenModel');
const RoomUserModel = require('../models/roomUserModel');
const CryptHelper = require('../utils/cryptHelper');
const ImageHelper = require('../utils/imageHelper');

class UserController {
    constructor() {
        this.cryptHelper = CryptHelper.getInstance();
    }

    async login(req, res) {
        try {
            const { username, password, device_id, device_name } = req.body;
            
            var result = await UserModel.findOne({ where: { username: username, password: password }});
            if (result == null) { throw new Error("User not found"); }

            var fetchTokenResult = await UserTokenModel.findOne({ where: { 
                user_id: result.id, 
                device_Id: device_id,
                access_expiry: { 
                    [Op.gte]: Date.now()
                },
                is_invalid: 0 
            } });

            let signedAccessToken
            let signedRefreshToken

            if (fetchTokenResult == null) {
                const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
                const accessToken = crypto.randomUUID();
                const refreshToken = crypto.randomUUID();
                signedAccessToken = this.cryptHelper.signToken(accessToken);
                signedRefreshToken = this.cryptHelper.signToken(refreshToken);

                var tokenResult = await UserTokenModel.create({
                    access_token: signedAccessToken,
                    refresh_token: signedRefreshToken,
                    user_id: result.id,
                    device_id: device_id,
                    access_expiry: accessTokenExpiresAt,
                    refresh_expiry: refreshTokenExpiresAt
                });
                if (tokenResult == null) { throw new Error("Failed to create token."); }
                
            } else {
                signedAccessToken = fetchTokenResult.access_token;
                signedRefreshToken = fetchTokenResult.refresh_token;
            }
            
            let findResult = await UserDeviceModel.findOne({ where: { device_id : device_id, user_id: result.id, is_invalid: 0 }});

            if (findResult) {
                let userDeviceResult = await UserDeviceModel.update(
                    { device_name: device_name, updated_at: Date.now() }, 
                    { where: { device_id: device_id }}
                );
			    if (userDeviceResult == null) { throw new Error("Failed to update user device."); }
            } else {
                let existingResult = await UserDeviceModel.findOne({ where: { device_id : device_id, is_invalid: 0 }});
                if (existingResult) {
                    await UserDeviceModel.update(
                        { is_invalid: 1, updated_at: Date.now() }, 
                        { where: { device_id: device_id } }
                    );
                }

                var userDeviceResult = await UserDeviceModel.create({
                    user_id: result.id,
                    device_name: device_name,
                    device_id: device_id
                });
                if (userDeviceResult == null) { throw new Error("Failed to create user device."); }
            }

            res.status(200).json({
                info: {
                    display_name: result.display_name,
                    username: result.username,
                    image_url: ImageHelper.getImagePath(req, result.image_url)
                },
                access_token: signedAccessToken, 
                refresh_token: signedRefreshToken,
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
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }

    async token(req, res) {
        try {
            const { refresh_token } = req.body;

            if (!this.cryptHelper.verifyToken(refresh_token)) {
                return res.status(401).json({ 
                    error: { 
                        code: "401", 
                        message: "Invalid token signature" 
                    } 
                });
            }

            var fetchTokenResult = await UserTokenModel.findOne({ where: { 
                refresh_token: refresh_token, 
                refresh_expiry: { 
                    [Op.gte]: Date.now()
                },
                is_invalid: 0
            } });


            if (fetchTokenResult != null) {
                UserTokenModel.update(
                    { is_invalid: 1, updated_at: Date.now() }, 
                    { where: { id: fetchTokenResult.id }}
                );

                const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
                const accessToken = crypto.randomUUID();
                const refreshToken = crypto.randomUUID();
                let signedAccessToken = this.cryptHelper.signToken(accessToken);
                let signedRefreshToken = this.cryptHelper.signToken(refreshToken);

                var tokenResult = await UserTokenModel.create({
                    access_token: signedAccessToken,
                    refresh_token: signedRefreshToken,
                    user_id: fetchTokenResult.user_id,
                    access_expiry: accessTokenExpiresAt,
                    refresh_expiry: refreshTokenExpiresAt
                });
                if (tokenResult == null) { throw new Error("Failed to create token."); }

                res.status(200).json({
                    access_token: signedAccessToken, 
                    refresh_token: signedRefreshToken,
                    success: 1,
                    error: {
                        code: "000",
                        message: ""
                    }
                });
                
            } else {
                throw new Error("Refresh token not found.");
            }
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

    async register(req, res) {
        try {
            const { username, display_name, password, device_id } = req.body;

            var result = await UserModel.findOne({ where: { username: username }});
            let imageUrl = ImageHelper.getRandomProfileImageUrl(req);
            
            if (result == null) {
                result = await UserModel.create({ username: username, display_name: display_name, password: password, image_url: imageUrl });
            } else {
                throw new Error("User already exists.");
            }

            const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            const accessToken = crypto.randomUUID();
            const refreshToken = crypto.randomUUID();
            let signedAccessToken = this.cryptHelper.signToken(accessToken);
            let signedRefreshToken = this.cryptHelper.signToken(refreshToken);

            var tokenResult = await UserTokenModel.create({
                access_token: signedAccessToken,
                refresh_token: signedRefreshToken,
                user_id: result.id,
                device_id: device_id,
                access_expiry: accessTokenExpiresAt,
                refresh_expiry: refreshTokenExpiresAt
            });
            if (tokenResult == null) { throw new Error("Failed to create token."); }
 
            res.status(200).json({
                info: {
                    display_name: result.display_name,
                    username: result.username,
                    image_url: ImageHelper.getImagePath(req, imageUrl)
                },
                access_token: signedAccessToken, 
                refresh_token: signedRefreshToken,
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
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }

    async setUser(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const { name } = req.body;
            

            var result = await UserModel.update( 
                { display_name: name, updated_at: Date.now() }, 
                { where: { id: userId } }
            );
            if (result == null) {  throw new Error("Failed to update user."); } 
 
            var fetchUserResult = await UserModel.findOne({ where: {id: userId } });

            res.status(200).json({
                info: {
                    display_name: fetchUserResult.display_name,
                    username: fetchUserResult.username,
                    image_url: ImageHelper.getImagePath(req, fetchUserResult.image_url)
                },
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
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }


    async setPassword(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }
            let userId = tokenCheck.result.user_id;

            const { old_password, new_password } = req.body;
            
            var result = await UserModel.findOne( 
                { where: { id: userId, password: old_password } }
            );
            if (result == null) {  throw new Error("Old password is incorrect"); } 
 
            var fetchUserResult = await UserModel.update( 
                { password: new_password, updated_at: Date.now() },
                { where: {id: userId } }
            );
            if (fetchUserResult == null) {  throw new Error("Failed to update password"); } 

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
                    code: "002",
                    message: err.message || "An error occurred while processing the request"
                }
            });    
        }
    }


    async getUsers(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }

            const { room_id } = req.query;
            
            let roomUserResult = await RoomUserModel.findAll({ where: {room_id: room_id } });
            let roomUserIds = roomUserResult.map((item) => item.user_id);
            let usersResult = await UserModel.findAll({ where: { id: { [Op.not]: roomUserIds }}});

            const formattedResponse = usersResult.map(member => ({
                name: member.display_name,  
                user_image_url: ImageHelper.getImagePath(req, member.image_url), 
                user_id: member.id
            }));

            if (formattedResponse) {
                res.status(200).json({
                    users: formattedResponse,
                    success: 1,
                    error: {
                        code: "000",
                        message: ""
                    }
                });
            } else {
                throw new Error("No result.")
            }
            
        } catch (err) {
            res.status(500).json({ 
                error: {
                    code: "500",
                    message: err.message
                } 
            });
        }
    }

    async getDevices(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }

            let userId = tokenCheck.result.user_id;

            let deviceResult = await UserDeviceModel.findAll({ where: { user_id: userId, is_invalid: 0 } });
            if (!deviceResult) { throw new Error("No result.") }
            
            
            const formattedResponse = deviceResult.map(userDevice => ({
                id: userDevice.id,
                device_id: userDevice.device_id,
                device_name: userDevice.device_name
            }));

            if (formattedResponse) {
                res.status(200).json({
                    devices: formattedResponse,
                    success: 1,
                    error: {
                        code: "000",
                        message: ""
                    }
                });
            } else {
                throw new Error("No result.")
            }
            
        } catch (err) {
            res.status(500).json({ 
                error: {
                    code: "500",
                    message: err.message
                } 
            });
        }
    }

    async deleteDevice(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }

            const { user_device_id } = req.body;
            
            var result = await UserDeviceModel.update(
                { is_invalid: 1, updated_at: Date.now() }, 
                { where: { id: user_device_id } }
            );
            if (result == null) {  throw new Error("Failed to remove device"); } 

            var fetchResult = await UserDeviceModel.findOne({ where: { id: user_device_id }});
            if (fetchResult) {
                await UserTokenModel.update(
                    { is_invalid: 1, updated_at: Date.now() },
                    { where: { device_id: fetchResult.device_id } }
                );
            }
 
            res.status(200).json({
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            });
        } catch (err) {
            res.status(500).json({ 
                error: {
                    code: "500",
                    message: err.message
                } 
            });
        }
    }

    async extendToken(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }

            res.status(200).json({
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            });
        } catch (err) {
            res.status(500).json({ 
                error: {
                    code: "500",
                    message: err.message
                } 
            });
        }
    }

    async logout(req, res) {
        try {
            const accessToken = req.headers['authorization'];
            
            await UserTokenModel.update(
                { is_invalid: 1, updated_at: Date.now() },
                { where: { access_token: accessToken } }
            );
            
            const { device_id } = req.body;

            await UserDeviceModel.update(
                { is_invalid: 1, updated_at: Date.now() }, 
                { where: { device_id: device_id } }
            );
        

            res.status(200).json({
                success: 1,
                error: {
                    code: "000",
                    message: ""
                }
            });
        } catch (err) {
            res.status(500).json({ 
                error: {
                    code: "500",
                    message: err.message
                } 
            });
        }
    }

    async extend(accessToken) { 
        const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await UserTokenModel.update(
            { access_expiry: accessTokenExpiresAt, updated_at: Date.now() },
            { where: { access_token: accessToken} 
        });
    }

    async getAccessTokenError(accessToken) {
        if (!accessToken) { return { 
                error: {
                    code: "401",
                    message: "Access token required"
                } 
            }
        }

        if (!CryptHelper.getInstance().verifyToken(accessToken)) {
            return { error: {
                code: "401",
                message: "Invalid token signature"
            } };
        }

        var fetchTokenResult = await UserTokenModel.findOne({ where: { 
            access_token: accessToken, 
            access_expiry: { 
                [Op.gte]: Date.now()
            },
            is_invalid: 0
        } });
        
        if (fetchTokenResult == null) {
            return { error:{
                code: "401",
                message: "Token not found"
            } };
        }

        await this.extend(accessToken);

        return { result : fetchTokenResult };
    }
}

module.exports = UserController;
