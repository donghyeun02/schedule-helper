const schedule = require('node-schedule');
const { google } = require('googleapis');

const { oauth2Client } = require('./oauth2');

const calendar = google.calendar('v3');

const calendarReminder = schedule.scheduleJob('*/30 * * * *', async () => {
  // users 테이블내 reminder_time

  const currentDate = new Date();

  const startOfDay = new Date(currentDate);
  const endOfDay = new Date(currentDate);

  startOfDay.setHours(0, 0, 0, 0);
  endOfDay.setHours(23, 59, 59, 999);

  await calendar.events.list(
    {
      auth: oauth2Client,
      calendarId: calendarId,
      timeMin: startOfDay,
      timeMax: endOfDay,
      singleEvents: true,
      orderBy: 'startTime',
    },
    (err, res) => {
      if (err) {
        console.log('Google Calendar events list 오류 :', err);
        return;
      }
      const events = res.data.items;
      if (events.length === 0) {
        console.log('당일 일정이 없습니다.');
        // 일정 없음, 슬랙 보내기
      } else {
        console.log('일정 슬랙 있음. 슬랙 보내기');
        // 일정 있음, 슬랙 보내기
      }
    }
  );
});
