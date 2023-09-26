const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const { googleLogin, channelRegistration } = require('../utils/slackHome');

const slackEvents = createEventAdapter(process.env.SLACK_SECRET);
const web = new WebClient(process.env.SLACK_BOT_TOKEN);
const slackChannel = process.env.CONVERSATION_ID;

const eventSubscriptions = slackEvents.requestListener();

slackEvents.on('error : ', console.error);

const sendSlackMessage = async (eventOpt) => {
  try {
    const option = {
      channel: slackChannel,
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

const handleButton = async (req, res) => {
  const payload = JSON.parse(req.body.payload);

  const actionType = payload.type;

  if (actionType === 'block_actions') {
    const actionId = payload.actions[0].action_id;

    if (actionId === 'sqHGX') {
      googleLogin({
        ack: () => {},
        body: payload,
        client: web,
      });
    } else if (actionId === '5U0Ou') {
      channelRegistration({
        ack: () => {},
        body: payload,
        client: web,
      });
    }
  }

  res.sendStatus(200);
};

module.exports = {
  eventSubscriptions,
  sendSlackMessage,
  handleButton,
};
