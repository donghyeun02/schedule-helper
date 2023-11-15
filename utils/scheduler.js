const schedule = require('node-schedule');
const { google } = require('googleapis');
const { client } = require('../utils/webClient');

const { oauth2Client } = require('./oauth2');
const { slackDao, calendarDao } = require('../models');

const { slackService } = require('../services');

const calendar = google.calendar('v3');

const calendarReminder = schedule.scheduleJob('0 * * * *', async () => {
  console.log('Calendar Reminder 실행');

  const currentDate = new Date();

  const utcNow =
    currentDate.getTime() + currentDate.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaDate = new Date(utcNow + koreaTimeDiff);

  const currentHour = formatCurrentHour(koreaDate);

  const users = await calendarDao.getUserByReminderTime(currentHour);

  for (const user of users) {
    const slackUserId = user.slackUserId;

    const refreshToken = await calendarDao.getRefreshTokenByUserID(slackUserId);

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const channelId = await slackDao.getSlackChannelByuserId(slackUserId);
    const calendarId = await slackDao.getCalendarByuserId(slackUserId);
    const slackTeamId = await slackDao.getTeamIdByUserId(slackUserId);

    const web = await client(slackTeamId);

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
        return res.data.items;
      });

    if (events === undefined) {
      console.error('이벤트 리스트 오류');
    } else if (events.length === 0) {
      const eventOpt = {
        slackChannel: channelId,
        color: '000000',
        title: '🔔  당일 일정 ',
        summary: '리마인더 알림',
        text: `당일 일정이 없습니다 !`,
      };

      await slackService.sendSlackMessage(eventOpt, web);
    } else {
      const eventAttachments = events.map((event) => {
        const startDateTime = event.start.dateTime
          ? formatDateTime(event.start.dateTime, event.start.timeZone)
          : undefined;
        const endDateTime = event.end.dateTime
          ? formatDateTime(event.end.dateTime, event.end.timeZone)
          : undefined;
        const startDate = event.start.date || undefined;

        const eventText =
          startDateTime && endDateTime
            ? `일정 : ${startDateTime} - ${endDateTime}`
            : `종일 : ${startDate}`;

        return {
          color: '000000',
          fallback: 'Slack attachment-level `fallback`',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `* 🗓️ <${event.htmlLink}|${event.summary}>*\n ${eventText}`,
              },
            },
          ],
        };
      });

      const eventOpt = {
        slackChannel: channelId,
        title: '🔔  당일 일정',
        attachments: [...eventAttachments],
      };

      await slackService.sendReminderMessage(eventOpt, web);
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
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz,
  };

  const format = new Intl.DateTimeFormat('ko-KR', opts);

  return format.format(new Date(dateTime));
};

module.exports = { calendarReminder };
