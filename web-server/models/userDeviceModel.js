const { DataTypes, Model } = require('sequelize');
const UserModel = require('./userModel');
const Database = require('../config/database');

class UserDeviceModel extends Model {}
  
UserDeviceModel.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UserModel,
            key: 'id',
        },
    },
    device_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    device_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    device_push_token: {
        type: DataTypes.STRING,
        allowNull: true,
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
    tableName: 'UserDevice',
    sequelize: Database.getInstance().sequelize
});

module.exports = UserDeviceModel;
