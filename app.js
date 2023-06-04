// const schedule = require('node-schedule');
const express = require('express');
const app = express();
const _ = require('underscore');
const RandExp = require('randexp');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
app.use(bodyParser.json());
const config = require('./config/database.json');
const {Sequelize, Op} = require('sequelize');
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const Notification = require('./models/notification.js');
const ScheduleNotificationUsers = require('./models/schedule_notification_users');
const ScheduleNotification = require('./models/scheduled_notifications');
const User = require('./models/user');
const schedule = require('node-schedule');
const sendMessage = require('./lib/rabbitmq')

const createJob = async (jobName, date, notificationId) => {
    await schedule.scheduleJob(jobName, date, async function(){
        console.log('The answer to life, the universe, and everything!');

        const users = await ScheduleNotificationUsers.findAll({
            where: {
                fk_id_schedule_notification: notificationId
            },
            include: [User, {
                model: ScheduleNotification,
                include: Notification
            }]       
        })

        console.log(JSON.stringify(users, null,2));
        
        const promises = [];
        _.each(users, u => {
            promises.push(sendMessage({
                userId: u.fk_id_user,
                phoneNumber: u.user.phone_number,
                templateId: u.scheduled_notification.notification.template_id,
                content: u.scheduled_notification.notification.content
            }))
        })

        await ScheduleNotification.update({deleted: true}, {where: {id: notificationId}});

        await Promise.all(promises);

    });
}

// async function test(){
//     const users = await ScheduleNotificationUsers.findAll({
//         // where: {
//         //     fk_id_schedule_notification: notificationId
//         // },
        // include: [User, {
        //     model: ScheduleNotification,
        //     include: Notification
        //     }]
//     })

//     console.log(JSON.stringify(users, null, 2));
// }

// test()

async function scheduleJob(date, templateId, phoneNumbers, jobName) {
    if(!Array.isArray(phoneNumbers) || phoneNumbers.length == 0) {
        return 'Invalid Phone Numbers';
    }

    const notification = await Notification.findOne({template_id: templateId});
    if(!notification) {
        return 'Invalid Template Id';
    }
    
    if(await ScheduleNotification.findOne({where: { name: jobName}})) {
        return 'Job with name already exist';
    }

    const users = await User.findAll({
        phone_number: phoneNumbers
    });

    const scheduleNotification = await ScheduleNotification.create({
        fk_id_notifications: notification.id,
        scheduled_time: date.toUTCString(),
        name: jobName
    })

    const notificationUsers = [];

    _.each(users, u => {
        notificationUsers.push({
            fk_id_user: u.id,
            fk_id_schedule_notification: scheduleNotification.id
        })
    })

    await ScheduleNotificationUsers.bulkCreate(notificationUsers);

    // const job = await schedule.scheduleJob(jobName, date, function(){
    //     console.log('The answer to life, the universe, and everything!');
    // });
    await createJob(jobName, date, scheduleNotification.id);
    // console.log(job.callback);
    return 'Job Created';
}

function checkIfExist(value) {
    if (value === undefined || value === null) {
        return false;
    } else {
        return true;
      }
}

app.post('/createScheduledJob', async (req, res) => {
    console.log(req.body);

    const {year, month, day, hour, minute, second, templateId, phoneNumbers, jobName} = req.body;

    if(!checkIfExist(year) || !checkIfExist(month) || !checkIfExist(day) || !checkIfExist(hour) || !checkIfExist(minute) || !checkIfExist(second) || !checkIfExist(phoneNumbers) || !checkIfExist(jobName)) {
        return res.status(400).send({success: false, message: 'Invalid date details'});
    }

    const remarks = await scheduleJob(new Date(year, month-1, day, hour, minute, second), templateId, phoneNumbers, jobName);
    // scheduleJob(new Date(2023, 5, 05, 0, 20, 0)
    // )
    return res.status(200).send({success: true, message: remarks});

})

app.get('/getScheduleJobs', (req, res) => {
    var scheduledJobs = schedule.scheduledJobs;
    const readableFormat = Object.entries(scheduledJobs).map(([jobName, job]) => (
        {
        jobName,
        cronPattern: job.cron,
        nextScheduleTime: job.nextInvocation() && job.nextInvocation()._date,
        callback: job.callback
    }));

    // for(let key in readableFormat) {
    //     scheduleJob(new Date(2023, 5, 05, 0, 20, 0))
    // }
    return res.status(200).send( {readableFormat})
})

app.delete('/deleteJob', async (req, res) => {
    // console.log(req.body);
    if(!req.body.jobName) {
        return res.status(400).send({message: 'Invalid jobName'});
    }
    const job = await ScheduleNotification.findOne({
        where: {
            name: req.body.jobName,
            deleted: false
        }
    })

    if(!job) {
        return res.status(400).send({message: 'Invalid jobName'});
    }

    await ScheduleNotification.update({deleted: true}, {where: {name: req.body.jobName}});
    const deletedJob = schedule.scheduledJobs[req.body.jobName];
    console.log(deletedJob);
    deletedJob.cancel();
    res.status(200).send({body: deletedJob})
}) 

async function updateJobsFromDB() {
    var scheduledJobs = schedule.scheduledJobs;
    const readableFormat = Object.entries(scheduledJobs).map(([jobName, job]) => (
        {
        jobName,
        cronPattern: job.cron,
        nextScheduleTime: new Date(job.nextInvocation() && job.nextInvocation()._date).toUTCString(),
        callback: job.callback
    }));

    const jobs = await ScheduleNotification.findAll({
        where: {
            scheduled_time: {
                [Op.gte]: moment()
              },
            deleted: false
        }
    })
    // console.log(jobs);
    // console.log(readableFormat);
    const groupedJobs = _.groupBy(readableFormat, obj => {
        return obj.name;
    })

    const promises = [];
    _.each(jobs, j => {
        if(!groupedJobs[j.name]) {
            promises.push(createJob(j.name, j.scheduled_time, j.fk_id_notifications));
        }
    })
    await Promise.all(promises);
}

app.listen(3000, async () => {
    console.log('Server Started');
    console.log('creating jobs');
    await updateJobsFromDB();
})