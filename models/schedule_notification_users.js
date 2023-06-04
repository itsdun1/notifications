const {
    Sequelize,
    QueryTypes,
    DataTypes
} = require('sequelize');
const config = require('../config/database.json');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const ScheduleNotification = require('./scheduled_notifications');
const User = require('./user');

const ScheduleNotificationUser = sequelize.define('schedule_notification_users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fk_id_schedule_notification: {
    type: DataTypes.INTEGER,
    references: {
      model: ScheduleNotification,
      key: 'id',
    },
  },
  fk_id_user: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

ScheduleNotificationUser.belongsTo(User, {
    foreignKey: 'fk_id_user',
  });
  
ScheduleNotificationUser.belongsTo(ScheduleNotification, {
    foreignKey: 'fk_id_schedule_notification',
  });  

module.exports = ScheduleNotificationUser;
