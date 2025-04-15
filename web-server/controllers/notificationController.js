const apn = require('apn');
const UserDeviceModel = require('../models/userDeviceModel');
const UserController = require('../controllers/userController');

class NotificationController {
	constructor() {
		var options = {
				token: {
		  			key: "./config/AuthKey_8MAWLV367S.p8",
		  			keyId: "8MAWLV367S",
		  			teamId: "RJFLLLJJBL"
				},
		   production: false
		  };

	  this.apnProvider = new apn.Provider(options);
	  this.userController = new UserController();
    }

	async saveDeviceToken(req, res) {
		try {
            const accessToken = req.headers['authorization'];
            let tokenCheck = await this.userController.getAccessTokenError(accessToken)
            if (tokenCheck.error != null) {
                return res.status(401).json(tokenCheck);
            }

			const { device_id, device_token } = req.body;
			
			let userDeviceResult = await UserDeviceModel.update(
				{ device_push_token: device_token, updated_at: Date.now() },
				{ where: { device_id: device_id } }
			);
			if (userDeviceResult == null) { throw new Error("Failed to update push token."); }

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

	async sendNotification(deviceToken, title, body, category, payload) {
		var note = new apn.Notification();

		note.title = title
		note.body = body
		note.category = category
		note.payload = payload
		note.topic = "com.marites.ios.chesmes"

		this.apnProvider.send(note, deviceToken).then( (result) => {
			console.log(result)
	  	});
	}
}

module.exports = NotificationController;