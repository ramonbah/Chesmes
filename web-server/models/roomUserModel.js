const { DataTypes, Model } = require('sequelize');
const Database = require('../config/database');
const UserModel = require('./userModel');
const RoomModel = require('./roomModel');

class RoomUserModel extends Model {}

RoomUserModel.init({
    room_user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: RoomModel,
            key: 'room_id',
        },
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UserModel,
            key: 'id',
        },
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_muted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_typing: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: false,
    tableName: 'RoomUser',
    sequelize: Database.getInstance().sequelize
});

module.exports = RoomUserModel;
