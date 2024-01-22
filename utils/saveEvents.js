const { google } = require('googleapis');

const calendar = google.calendar('v3');

const { oauth2Client } = require('../utils/oauth2');
const { calendarDao } = require('../models');
const { slackDao } = require('../models');

const removeTimeZoneOffset = (timeWithOffset) => {
  return timeWithOffset.replace(/\+[\d:]+$/, '');
};

const saveEvents = async (slackUserId) => {
  const refreshToken = await calendarDao.getRefreshTokenByUserID(slackUserId);
  const calendarId = await slackDao.getCalendarByuserId(slackUserId);

  await oauth2Client.setCredentials({ refresh_token: refreshToken });

  const startOfDay = new Date();
  const endOfDay = new Date();

  startOfDay.setHours(-9, 0, 0, 0);
  endOfDay.setHours(14, 59, 59, 999);

  const eventList = await calendar.events
    .list({
      auth: oauth2Client,
      calendarId: calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'Asia/Seoul',
    })
    .then((res) => {
      return res.data.items;
    });

  for (const event of eventList) {
    const eventStartTime = event.start.dateTime
      ? removeTimeZoneOffset(event.start.dateTime)
      : event.start.date;
    const eventEndTime = event.end.dateTime
      ? removeTimeZoneOffset(event.end.dateTime)
      : event.end.date;

    await calendarDao.saveEvents(
      event.summary,
      event.htmlLink,
      eventStartTime,
      eventEndTime,
      slackUserId
    );
  }
};

module.exports = { saveEvents };
