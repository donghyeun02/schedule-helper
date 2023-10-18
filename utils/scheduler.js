const schedule = require('node-schedule');
const { google } = require('googleapis');

const { oauth2Client } = require('./oauth2');
const {
  getEmailByReminderTime,
  getCalendarId,
} = require('../models/calendarDao');
const { sendSlackMessage } = require('../services/slackService');

const calendar = google.calendar('v3');

const calendarReminder = schedule.scheduleJob('0 * * * *', async () => {
  console.log('Calendar Reminder 실행');

  const currentDate = new Date();

  const currentHour = formatCurrentHour(currentDate);

  const users = await getEmailByReminderTime(currentHour);

  for (const user of users) {
    const email = user.email;

    const calendarId = await getCalendarId(email);

    const startOfDay = new Date(currentDate);
    const endOfDay = new Date(currentDate);

    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await calendar.events
      .list({
        auth: oauth2Client,
        calendarId: calendarId,
        timeMin: startOfDay,
        timeMax: endOfDay,
        singleEvents: true,
        orderBy: 'startTime',
      })
      .then((res) => {
        return res.data.itemsl;
      });

    if (events.length === 0) {
      const eventOpt = {
        slackChannel: channelId,
        color: 'good',
        title: '당일 일정 알림',
        summary: '일정이 없습니다.',
        text: `당일 일정이 없습니다 !`,
      };

      await sendSlackMessage(eventOpt);
    } else {
      const eventText = events
        .map((event) => {
          const startTime = formatDateTime(
            event.start.dateTime,
            event.start.timeZone
          );
          return `제목: ${event.summary}, 시작 시간: ${startTime}`;
        })
        .join('\n');

      const eventOpt = {
        slackChannel: channelId,
        color: 'good',
        title: '당일 일정 알림',
        summary: '당일 일정입니다.',
        text: eventText,
      };

      await sendSlackMessage(eventOpt);
    }
  }
});

const formatCurrentHour = (currentDate) => {
  const hours = currentDate.getHours();
  const formattedHours = String(hours).padStart(2, '0');

  const formatTime = `${formattedHours}:00:00`;

  return formatTime;
};

const formatDateTime = (dateTime, tz) => {
  const opts = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz,
  };

  const format = new Intl.DateTimeFormat('ko-KR', opts);

  return format.format(new Date(dateTime));
};

module.exports = { calendarReminder };
