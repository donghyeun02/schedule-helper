const { google } = require('googleapis');
const { WebClient } = require('@slack/web-api');
const { oauth2Client } = require('../utils/oauth2');
const { sendSlackMessage } = require('./slackService');
const {
  createUser,
  getUserEmailByResourceId,
  getRefreshTokenByEmail,
  getCalendarId,
  userExist,
  insertUser,
} = require('../models/calendarDao');
const {
  getSlackChannel,
  getTokenInSlacks,
  updateToken,
} = require('../models/slackDao');
const { getCalendarList, afterLoginBlock } = require('../utils/slackHome');

const calendar = google.calendar('v3');

// auth code를 얻기 위한 구글 로그인 과정
const googleLogin = async (req, res) => {
  const slackUserId = JSON.stringify(req.query.slackUserId);

  const oauth2Url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    response_type: 'code',
    state: slackUserId,
  });

  res.redirect(oauth2Url);
};

// 구글 로그인 후 로직
const googleOAuth = async (req, res) => {
  try {
    const authCode = req.query.code;
    const slackUserId = JSON.parse(req.query.state);

    const botToken = await getTokenInSlacks(slackUserId);
    const web = new WebClient(botToken);

    const ExistingUser = await userExist(slackUserId);

    if (ExistingUser === '0') {
      const getToken = await oauth2Client.getToken({
        code: authCode,
        scope: [
          'https://www.googleapis.com/auth/calendar.events.readonly',
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
        access_type: 'offline',
        prompt: 'consent',
      });

      const accessToken = getToken.tokens.access_token;
      const refreshToken = getToken.tokens.refresh_token;

      oauth2Client.credentials = {
        access_token: accessToken,
        refresh_token: refreshToken,
      };

      const oauth2 = google.oauth2('v2');
      const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });

      const userEmail = userInfo.data.email;

      await createUser(userEmail, refreshToken, slackUserId);

      if (!refreshToken) {
        const token = await getRefreshTokenByEmail(userEmail);
        await updateToken(token, slackUserId);
      }

      res.status(200).json({ message: '로그인이 완료되었습니다.' });
    } else if (ExistingUser === '1') {
      await insertUser(slackUserId);

      res.status(200).json({ message: '로그인이 완료되었습니다.' });
    }
    const option = await getCalendarList(slackUserId);
    const blocks = await afterLoginBlock(option);

    return await web.views.publish({
      user_id: slackUserId,
      view: {
        type: 'home',
        callback_id: 'home_view',
        blocks: blocks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.stack });
  }
};

// 이벤트 발생 시 실행되는 로직
const webhookEventHandler = async (req, res) => {
  try {
    const eventData = req.headers;

    const resourceId = eventData['x-goog-resource-id'];
    const resourceState = eventData['x-goog-resource-state'];

    const userEmail = await getUserEmailByResourceId(resourceId);

    const refreshToken = await getRefreshTokenByEmail(userEmail);
    const channelId = await getSlackChannel(userEmail);
    const calendarId = await getCalendarId(userEmail);

    if (resourceState === 'sync') {
      const eventOpt = {
        slackChannel: channelId,
        color: 'FFFF00',
        title: '캘린더 구독 알림',
        summary: '캘린더 구독',
        text: `캘린더 구독이 시작되었습니다. / 구독 아이디 : ${resourceId}`,
      };

      await sendSlackMessage(eventOpt);
    } else if (resourceState === 'exists') {
      const event = await getCalendarEvent(refreshToken, calendarId);

      const eventStatus = event.status;
      const eventSummary = event.summary;

      const createdTime = await getParseTime(event.created);
      const updatedTime = await getParseTime(event.updated);
      const startDateTime = await formatDateTime(
        event.start.dateTime,
        event.start.timeZone
      );
      const endDateTime = await formatDateTime(
        event.end.dateTime,
        event.end.timeZone
      );

      switch (eventStatus) {
        case 'confirmed':
          if (createdTime === updatedTime) {
            const eventOpt = {
              slackChannel: channelId,
              color: '00FF00',
              title: '일정 등록 알림',
              summary: eventSummary,
              text: `일정 시작 : ${startDateTime} \n일정 종료 : ${endDateTime}`,
            };

            await sendSlackMessage(eventOpt);
          } else {
            const eventOpt = {
              slackChannel: channelId,
              color: '0000FF',
              title: '일정 변경 알림',
              summary: eventSummary,
              text: `일정 시작 : ${startDateTime} \n일정 종료 : ${endDateTime}`,
            };

            await sendSlackMessage(eventOpt);
          }
          break;
        case 'cancelled':
          const eventOpt = {
            slackChannel: channelId,
            color: 'FF0000',
            title: '일정 삭제 알림',
            summary: eventSummary,
            text: `일정 시작 : ${startDateTime} \n일정 종료 : ${endDateTime}`,
          };

          await sendSlackMessage(eventOpt);
          break;
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Google Calendar 이벤트 처리 에러:', error);
    res.status(500).send('에러 발생');
  }
};

// 발생한 이벤트가 어떤 것인지 파악하는 로직
const getCalendarEvent = async (refreshToken, calendarId) => {
  const now = new Date(Date.now() - 10 * 1000);
  const updatedTime = now.toISOString();

  await oauth2Client.setCredentials({ refresh_token: refreshToken });

  const getEvent = await calendar.events.list({
    calendarId: calendarId,
    auth: oauth2Client,
    orderBy: 'updated',
    maxResults: 1,
    showDeleted: true,
    updatedMin: updatedTime,
  });

  const event = getEvent.data.items[0];

  return event;
};

// 받아온 시간(RFC3339) -> Date로 바꾸기
const getParseTime = (time) => {
  const sliceTime = time.slice(0, -5);

  return Date.parse(sliceTime);
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

module.exports = {
  googleLogin,
  googleOAuth,
  webhookEventHandler,
};
