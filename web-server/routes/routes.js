const Express = require('express');

const UserController = require('../controllers/userController');
const RoomUserController = require('../controllers/roomUserController');
const MessageController = require('../controllers/messageController');
const InvitationController = require('../controllers/invitationController');
const NotificationController = require('../controllers/notificationController');
const UserTokenModel = require('../models/userTokenModel');
const { Op } = require('sequelize');

const router = Express.Router();
const userController = new UserController();
const roomUserController = new RoomUserController();
const messageController = new MessageController();
const invitationController = new InvitationController();
const notificationController = new NotificationController();

const TIME_LIMIT = 60 * 1000;
var chatRoomClients = [];
var homeClients = [];

router.get('/version', (req, res) => res.status(200).json({success: 1, version: "2"}));
router.post('/login', (req, res) => userController.login(req, res));
router.post('/logout', (req, res) => userController.logout(req, res));
router.post('/register', (req, res) => userController.register(req, res));

router.post('/users', (req, res) => userController.setUser(req, res));
router.get('/users', (req, res) => userController.getUsers(req, res));
router.post('/users/password', (req, res) => userController.setPassword(req, res)); 

router.get('/devices', (req, res) => userController.getDevices(req, res)); 
router.delete('/devices', async (req, res) => {
  await userController.deleteDevice(req, res);
  notifyHomeClients();
}); 

router.post('/token', (req, res) => userController.token(req, res));
router.post('/token/extend', (req, res) => userController.extendToken(req, res));

router.get('/rooms', (req, res) => roomUserController.getChatRooms(req, res));   
router.post('/rooms', async (req, res) => {
  await roomUserController.createChatRoom(req, res);
  notifyHomeClients();
});  
router.put('/rooms', async (req, res) => {
  roomUserController.updateChatRoom(req, res);
  notifyHomeClients();
});
router.delete('/rooms', async (req, res) => {
  roomUserController.deleteChatRoom(req, res);
  notifyHomeClients();
}); 

router.post('/rooms/join', (req, res) => roomUserController.joinRoom(req, res)); 

router.put('/rooms/mute', (req, res) => roomUserController.muteChatRoom(req, res));

router.delete('/rooms/detail', (req, res) => roomUserController.deleteRoomUser(req, res));  
router.patch('/rooms/detail', (req, res) => roomUserController.updateAdminStatus(req, res)); 

router.get('/invites', (req, res) => invitationController.getAll(req, res));  
router.post('/invites/accept', (req, res) => invitationController.accept(req, res)); 
router.post('/invites', async (req, res) => {
  await invitationController.send(req, res);
  notifyHomeClients();
});  

router.post('/notification', (req, res) => notificationController.saveDeviceToken(req, res));

router.get('/messages', (req, res) => messageController.getMessagesByRoom(req, res));  

router.delete('/messages', async (req, res) => { 
  let targetRoomId = await messageController.deleteMessage(req, res);
  notifyChatClients(targetRoomId);
});
router.put('/messages', async (req, res) => { 
  let targetRoomId = await messageController.updateMessage(req, res);
  notifyChatClients(targetRoomId);
});

router.post('/send', async (req, res) => {
  let targetRoomId = await messageController.createMessage(req, res);
  notifyChatClients(targetRoomId);
  notifyHomeClients();
});

router.post('/messages/typing', async (req, res) => {
  removeTimedOutClients();
  let result = await roomUserController.isTypingInRoom(req, res);
  notifyChatClients(result.roomId, result.displayNames);
});

router.get('/listen', async (req, res) => {
  const { room_id } = req.query;
  const accessToken = req.headers['authorization'];
  
  var user_id = null;
  var fetchTokenResult = await UserTokenModel.findOne({ where: { 
      access_token: accessToken, 
      access_expiry: { 
          [Op.gte]: Date.now()
      },
      is_invalid: 0
  } });
  if (fetchTokenResult != null) { user_id = fetchTokenResult.user_id; }
  
  chatRoomClients.push({ room_id: room_id, clientRes: res, timestamp: Date.now(), user_id: user_id});
});

router.get('/updates', (req, res) => {
  homeClients.push({ clientRes: res, timestamp: Date.now() });
});

function removeTimedOutClients() {
    homeClients = homeClients.filter(client => (Date.now() - client.timestamp) <= TIME_LIMIT);
    chatRoomClients = chatRoomClients.filter(client => (Date.now() - client.timestamp) <= TIME_LIMIT);
}
  
function notifyChatClients(roomId, displayNames = null) {
    removeTimedOutClients();

    if (!roomId) { return }
    
    var uniqueIds = new Set();

    const clientsToNotify = chatRoomClients.filter((client, index) =>  client.room_id == roomId);

    const activeUsers = clientsToNotify.filter((client) => {
      if (!uniqueIds.has(client.user_id)) {
        uniqueIds.add(client.user_id)
        return true
      }
      return false
    }) ;

    clientsToNotify.forEach(client => {
        client.clientRes.status(200).json({ success: 1, display_names: displayNames, number_in_room: activeUsers.length});
    });

    chatRoomClients = clientsToNotify.filter((client, index) =>  client.room_id != roomId);
}  

function notifyHomeClients() {
  removeTimedOutClients();

  homeClients.forEach(client => client.clientRes.status(200).json({ success: 1 }));
  homeClients.length = 0;
}  

module.exports = router;