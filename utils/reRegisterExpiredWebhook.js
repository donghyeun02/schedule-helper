const schedule = require('node-schedule');
const { v4 } = require('uuid');
const { google } = require('googleapis');

const { oauth2Client } = require('./oauth2');
const { slackDao, calendarDao } = require('../models');

const calendar = google.calendar('v3');

const reRegisterExpiredWebhooks = schedule.scheduleJob(
  '0 0 * * *',
  async () => {
    try {
      const currentTime = Date.now();

      const users = await calendarDao.checkExpiredWebhook(currentTime);

      for (const user of users) {
        const slackUserId = user.slackUserId;

        const webhookId = v4();
        const calendarId = await slackDao.getCalendarByuserId(slackUserId);
        const refreshToken = await calendarDao.getRefreshTokenByUserID(
          slackUserId
        );

        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const getAccessToken = await oauth2Client.getAccessToken();
        const accessToken = getAccessToken.token;

        const webhookData = await calendarDao.getWebhookIdAndResourceId(
          slackUserId
        );

        await calendar.channels.stop({
          resource: {
            id: webhookData.webhookId,
            resourceId: webhookData.resourceId,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: `application/json`,
          },
        });

        const webhook = await calendar.events.watch({
          resource: {
            id: webhookId,
            type: 'web_hook',
            address: 'https://donghyeun02.link/calendar-webhook',
            params: {
              ttl: 2592000,
            },
          },
          calendarId: calendarId,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: `application/json`,
          },
        });

        const { data } = webhook;

        const resourceId = data.resourceId;
        const expiration = data.expiration;

        await calendarDao.updateWebHook(
          webhookId,
          resourceId,
          expiration,
          slackUserId
        );
      }
    } catch (err) {
      const web = new WebClient(process.env.ERROR_TOKEN);
      const errorChannel = process.env.ERROR_CHANNEL;

      const option = {
        channel: errorChannel,
        attachments: [
          {
            color: 'DB2525',
            fallback: 'Slack attachment-level `fallback`',
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: 'Error',
                  emoji: true,
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `:office: *만료된 웹훅 재등록 에러*`,
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `:warning: *Error Message:* ${errorMessage}`,
                },
              },
            ],
          },
        ],
      };

      await web.chat.postMessage(option);

      console.log('Slack에 에러 메시지가 전송되었습니다.');
    }
  }
);

module.exports = { reRegisterExpiredWebhooks };
