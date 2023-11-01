const { WebClient } = require('@slack/web-api');
const {
  appHomeOpened,
  selectedChannel,
  selectedCalendar,
  registerWebhook,
  deleteWebhook,
  registerReminder,
  googleLogout,
} = require('../utils/slackHome');

const web = new WebClient(process.env.SLACK_BOT_TOKEN);

const handleEvent = async (req, res) => {
  const event = req.body.event;

  if (event.type === 'app_home_opened') {
    await appHomeOpened({
      event: event,
      client: web,
    });
  }

  return res.sendStatus(200);
};

const handleButton = async (req, res) => {
  const payload = JSON.parse(req.body.payload);

  const actionId = payload.actions[0].action_id;

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
    case 'delete_webhook':
      deleteWebhook({
        ack: () => {},
        body: payload,
        client: web,
      });
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

const sendSlackMessage = async (eventOpt) => {
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

const sendReminderMessage = async (eventOpt) => {
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
  sendSlackMessage,
  sendReminderMessage,
};
