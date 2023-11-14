const { WebClient } = require('@slack/web-api');
const {
  appHomeOpened,
  selectedChannel,
  selectedCalendar,
  registerWebhook,
  reRegisterWebhook,
  dropWebhook,
  registerReminder,
  googleLogout,
} = require('../utils/slackHome');
const { client } = require('../utils/webClient');
const { slackDao } = require('../models');

const webClient = new WebClient();

const handleEvent = async (req, res) => {
  const body = req.body;
  const teamId = body.team_id;

  const web = await client(teamId);

  if (body.event.type === 'app_home_opened') {
    return await appHomeOpened({
      body: body,
      client: web,
    });
  }

  return res.sendStatus(200);
};

const handleButton = async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const teamId = payload.user.team_id;
  const actionId = payload.actions[0].action_id;

  const web = await client(teamId);

  switch (actionId) {
    case 'selected_channel':
      selectedChannel({
        ack: () => {},
        body: payload,
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
    case 'google_logout':
      googleLogout({
        ack: () => {},
        body: payload,
        client: web,
      });
      break;
  }

  return res.sendStatus(200);
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
    res.sendStatus(200);
  } catch (error) {
    console.error('토큰 요청 및 처리 에러:', error);
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
              type: 'header',
              text: {
                type: 'plain_text',
                text: eventOpt.summary,
                emoji: true,
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
