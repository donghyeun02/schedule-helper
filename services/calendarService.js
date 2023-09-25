const { v4 } = require('uuid');
const { google } = require('googleapis');

const calendarId = process.env.CALENDAR_ID;

const { oauth2Client } = require('../utils/oauth2');
const { sendSlackMessage } = require('./slackService');

const calendar = google.calendar('v3');

let savedAccessToken = null;

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
    const webhookId = v4();

    const webhook = await calendar.events.watch({
      resource: {
        id: webhookId,
        type: 'web_hook',
        address: 'https://donghyeun02.link/calendar-webhook',
        params: {
          ttl: 300,
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
    throw error;
  }
};

// 이벤트 발생 시 실행되는 로직
const calendarEventHandler = async (req, res) => {
  try {
    const accessToken = getAuthCode();

    const eventData = req.headers;

    const resourceId = eventData['x-goog-resource-id'];
    const resourceState = eventData['x-goog-resource-state'];

    // 여기쯤에 웹훅이 두 개일 시 방금 생성된 걸 삭제하는 로직 추가

    if (resourceState === 'sync') {
      const eventOpt = {
        color: 'FFFF00',
        title: '웹훅 등록 알림',
        summary: '웹훅 등록',
        text: `웹훅이 등록되었습니다. / 웹훅 아이디 : ${resourceId}`,
      };

      await sendSlackMessage(eventOpt);
    } else if (resourceState === 'exists') {
      const event = await getCalendarEvent(accessToken);

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
              color: '00FF00',
              title: '일정 등록 알림',
              summary: eventSummary,
              text: `일정 시작 : ${startDateTime} \n일정 종료 : ${endDateTime}`,
            };

            await sendSlackMessage(eventOpt);
          } else {
            const eventOpt = {
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
  setUpCalendarWebhook,
  calendarEventHandler,
};
