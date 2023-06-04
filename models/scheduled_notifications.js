const {
    Sequelize,
    QueryTypes,
    DataTypes
} = require('sequelize');
const config = require('../config/database.json');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const Notification = require('./notification');
const ScheduledNotification = sequelize.define('scheduled_notifications', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fk_id_notifications: {
    type: DataTypes.INTEGER,
    references: {
      model: Notification,
      key: 'id',
    },
  },
  scheduled_time: {
    type: DataTypes.DATE,
  },
  name: {
    type: DataTypes.STRING,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
  }
});

ScheduledNotification.belongsTo(Notification, {
    foreignKey: 'fk_id_notifications',
  });  


module.exports = ScheduledNotification;
