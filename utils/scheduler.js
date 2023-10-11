const schedule = require('node-schedule');
const { google } = require('googleapis');

const { oauth2Client } = require('./oauth2');

const calendar = google.calendar('v3');

const calendarReminder = schedule.scheduleJob('0 0 * * *', async () => {});
