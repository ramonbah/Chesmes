const { DataTypes, Model } = require('sequelize');
const Database = require('../config/database');
const UserModel = require('./userModel');

class RoomModel extends Model {}

RoomModel.init({
    room_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    room_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UserModel,
            key: 'id',
        },
    },
    password: {
        type: DataTypes.STRING,
    },
    image_url: {
        type: DataTypes.STRING,
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    updated_by: {
        type: DataTypes.INTEGER,
        references: {
            model: UserModel,
            key: 'id',
        },
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
    tableName: 'Room',
    sequelize: Database.getInstance().sequelize
});


module.exports = RoomModel;
