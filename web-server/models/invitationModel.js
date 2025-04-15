const { DataTypes, Model } = require('sequelize');
const Database = require('../config/database');
const UserModel = require('./userModel');
const RoomModel = require('./roomModel');

class InvitationModel extends Model {}

InvitationModel.init({
    invitation_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UserModel,
            key: 'id',
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
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: RoomModel,
            key: 'room_id',
        },
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    is_invalid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
}, {
    timestamps: false,
    tableName: 'UserInvitation',
    sequelize: Database.getInstance().sequelize
});

module.exports = InvitationModel;
