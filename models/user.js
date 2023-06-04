const {
    Sequelize,
    QueryTypes,
    DataTypes
} = require('sequelize');
const config = require('../config/database.json');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
// const ScheduledNotificationUsers = require('./schedule_notification_users')
const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: DataTypes.STRING,
  },
  last_name: {
    type: DataTypes.STRING,
  },
  phone_number: {
    type: DataTypes.STRING,
  },
});

// User.hasMany(ScheduledNotificationUsers);
module.exports = User;
