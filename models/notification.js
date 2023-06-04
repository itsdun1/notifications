const {
    Sequelize,
    QueryTypes,
    DataTypes
} = require('sequelize');
const config = require('../config/database.json');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const Notification = sequelize.define('notifications', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  template_id: {
    type: DataTypes.STRING,
  },
  content: {
    type: DataTypes.TEXT,
  },
  approved: {
    type: DataTypes.BOOLEAN,
  },
});

module.exports = Notification;
