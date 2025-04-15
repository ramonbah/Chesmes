const { DataTypes, Model } = require('sequelize');
const Database = require('../config/database');
const RoomUserModel = require('./roomUserModel');

class MessageModel extends Model {}

MessageModel.init({
    message_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    reply_to_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    room_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: RoomUserModel,
            key: 'room_user_id',
        },
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: false,
    tableName: 'Message',
    sequelize: Database.getInstance().sequelize
});

// MessageModel.hasMany(RoomUserModel);
// RoomUserModel.belongsTo(MessageModel);

// RoomUserModel.hasMany(MessageModel);
// MessageModel.belongsTo(RoomUserModel);

module.exports = MessageModel;
