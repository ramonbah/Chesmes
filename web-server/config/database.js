// database.js
require('dotenv').config();
const Sequelize = require('sequelize');

class Database {
    constructor() {
        this.sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
            host: process.env.DB_HOST,
            dialect: 'mysql',
            logging: false
        });

        this.connect();
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async connect() {
        try {
            await this.sequelize.authenticate();
            console.log('Connection has been established successfully.');
          } catch (error) {
            console.error('Unable to connect to the database:', error);
          }
    }

    close() {
        return this.sequelize.close();
    }
}

module.exports = Database;
