const { v4 } = require('uuid');
const { google } = require('googleapis');

const calendarId = process.env.CALENDAR_ID;

const { oauth2Client } = require('../utils/oauth2');
const { sendSlackMessage } = require('./slackService');

const calendar = google.calendar('v3');

let savedAccessToken = null;
const webhookId = v4();

//auth code를 얻기 위한 구글 로그인 과정
const googleLogin = async (req, res) => {
  const oauth2Url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
    response_type: 'code',
  });

  res.redirect(oauth2Url);
};

// 웹훅 설정하는 로직
const setUpCalendarWebhook = async (req, res) => {
  try {
    const authCode = req.query.code;

    const getAccessToken = await oauth2Client.getToken(authCode);

    const accessToken = getAccessToken.tokens.access_token;

    saveAccessToken(accessToken);
    await calendarWebhook(accessToken);
    res.status(200).json({ message: 'WEB_HOOK' });
  } catch (error) {
    res.status(500).json({ message: error.stack });
  }
};

// 웹훅
const calendarWebhook = async (accessToken) => {
  try {
    const webhook = await calendar.events.watch({
      resource: {
        id: webhookId,
        type: 'web_hook',
        address: 'https://donghyeun02.link/calendar-webhook',
        params: {
          ttl: 600,
        },
      },
      calendarId: calendarId,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: `application/json`,
      },
    });

    const { data } = webhook;
    console.log('Google Calendar Webhook이 설정되었습니다. : ', data);
  } catch (error) {
    console.error('Google Calendar Webhook 설정 에러 :', error);
    res.status(500).send('webhook err');
  }
};

// 이벤트 발생 시 실행되는 로직
const calendarEventHandler = async (req, res) => {
  try {
    const accessToken = getAuthCode();

    const eventData = req.headers;

    const resourceState = eventData['x-goog-resource-state'];

    // 여기쯤에 웹훅이 두 개일 시 방금 생성된 걸 삭제하는 로직 추가

    if (resourceState === 'sync') {
      const slackMessage = `웹훅이 등록되었습니다.`;

      await sendSlackMessage(slackMessage);
    } else if (resourceState === 'exists') {
      const event = await getCalendarEvent(accessToken);

      const eventStatus = event.status;

      const createdTime = await getParseTime(event.created);
      const updatedTime = await getParseTime(event.updated);

      switch (eventStatus) {
        case 'confirmed':
          if (createdTime === updatedTime) {
            const slackMessage = '일정이 등록되었습니다.';
            const eventOpt = {
              color: 'green',
              text: '등록된 이벤트 내용',
            };

            await sendSlackMessage(slackMessage, eventOpt);
          } else {
            const slackMessage = '일정이 변경되었습니다.';
            const eventOpt = {
              color: 'blue',
              text: '변경된 이벤트 내용',
            };

            await sendSlackMessage(slackMessage, eventOpt);
          }
          break;
        case 'cancelled':
          const slackMessage = '일정이 삭제되었습니다.';
          const eventOpt = {
            color: 'red',
            text: '삭제된 이벤트 내용',
          };

          await sendSlackMessage(slackMessage, eventOpt);
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
const getCalendarEvent = async (accessToken) => {
  const now = new Date(Date.now() - 10 * 1000);
  const updatedTime = now.toISOString();

  oauth2Client.setCredentials({ access_token: accessToken });

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

// accessToken 저장하기
const saveAccessToken = (accessToken) => {
  savedAccessToken = accessToken;
};

// accessToken 가져오기
const getAuthCode = () => {
  return savedAccessToken;
};

// 받아온 시간(RFC3339) -> Date로 바꾸기
const getParseTime = (time) => {
  const sliceTime = time.slice(0, -5);

  return Date.parse(sliceTime);
};

module.exports = {
  googleLogin,
  setUpCalendarWebhook,
  calendarEventHandler,
};
