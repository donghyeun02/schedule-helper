const { WebClient } = require('@slack/web-api');
const {
  appHomeOpened,
  selectedChannel,
  selectedCalendar,
  registerWebhook,
  reRegisterWebhook,
  dropWebhook,
  registerReminder,
  resetReminderTime,
  googleLogout,
} = require('../utils/slackHome');
const { client } = require('../utils/webClient');
const { slackDao } = require('../models');
const {
  sendErrorMessageToServer,
  sendAppInstallError,
} = require('../utils/errorToServer');

const webClient = new WebClient();

const handleEvent = async (req, res) => {
  const body = req.body;
  try {
    const teamId = body.team_id;

    const web = await client(teamId);

    if (body.event.type === 'app_home_opened') {
      return await appHomeOpened({
        body: body,
        client: web,
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    const teamId = body.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
    return res.status(500).json({ error: '이벤트 핸들러 에러' });
  }
};

const handleButton = async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const teamId = payload.user.team_id;

  try {
    const actionId = payload.actions[0].action_id;

    const web = await client(teamId);

    switch (actionId) {
      case 'selected_channel':
        selectedChannel({
          ack: () => {},
          body: payload,
          client: web,
        });
        break;
      case 'selected_calendar':
        selectedCalendar({
          ack: () => {},
          body: payload,
        });
        break;
      case 'webhook_button':
        registerWebhook({
          ack: () => {},
          body: payload,
          client: web,
        });
        break;
      case 're-register_Webhook':
        reRegisterWebhook({
          ack: () => {},
          body: payload,
          client: web,
        });
        break;
      case 'delete_webhook':
        dropWebhook({
          ack: () => {},
          body: payload,
          client: web,
        });
        break;
      case 'time':
        registerReminder({
          ack: () => {},
          body: payload,
        });
        break;
      case 'reset_time':
        resetReminderTime({
          ack: () => {},
          body: payload,
          client: web,
        });
        break;
      case 'google_logout':
        googleLogout({
          ack: () => {},
          body: payload,
          client: web,
        });
        break;
    }

    return res.sendStatus(200);
  } catch (error) {
    await sendErrorMessageToServer(teamId, error.stack);
    return res.status(500).json({ error: '버튼 핸들러 에러' });
  }
};

const appInstall = async (req, res) => {
  try {
    const code = req.query.code;
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;

    const response = await webClient.oauth.v2.access({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    });

    const { access_token, team } = response;
    console.log(response);

    await slackDao.saveSlackUser(
      access_token,
      team.id,
      team.name,
      response.authed_user.id
    );

    console.log('워크스페이스:', team);

    const message = '앱이 추가되었습니다.';
    res.render('appInstallView', { message });
  } catch (error) {
    await sendAppInstallError(error.stack);
    res.status(500).send('에러 발생');
  }
};

const sendSlackMessage = async (eventOpt, web) => {
  try {
    const option = {
      channel: eventOpt.slackChannel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: eventOpt.title,
            emoji: true,
          },
        },
      ],
      attachments: [
        {
          color: eventOpt.color,
          fallback: 'Slack attachment-level `fallback`',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: eventOpt.summary,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: eventOpt.text,
              },
            },
          ],
        },
      ],
    };

    await web.chat.postMessage(option);
  } catch (error) {
    console.error('Slack 메시지 전송 에러 :', error);
  }
};

const sendReminderMessage = async (eventOpt, web) => {
  try {
    const option = {
      channel: eventOpt.slackChannel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: eventOpt.title,
            emoji: true,
          },
        },
        { type: 'divider' },
      ],
      attachments: eventOpt.attachments,
    };

    await web.chat.postMessage(option);
  } catch (error) {
    console.error('Slack 메시지 전송 에러 :', error);
  }
};

module.exports = {
  handleButton,
  handleEvent,
  appInstall,
  sendSlackMessage,
  sendReminderMessage,
};
