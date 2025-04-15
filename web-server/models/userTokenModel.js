const { DataTypes, Model } = require('sequelize');
const Database = require('../config/database');
const UserModel = require('./userModel');

class UserTokenModel extends Model {}

UserTokenModel.init({
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
    device_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    access_expiry: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    refresh_expiry: {
        type: DataTypes.DATE,
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
    is_invalid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    access_token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    refresh_token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false,
    tableName: 'UserToken',
    sequelize: Database.getInstance().sequelize
});

module.exports = UserTokenModel;
