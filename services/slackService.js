const { WebClient } = require('@slack/web-api');
const {
  googleLogin,
  channelRegistration,
  registerSelectedChannel,
} = require('../utils/slackHome');

const web = new WebClient(process.env.SLACK_BOT_TOKEN);

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

const handleButton = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);

    console.log('패이로드 : ', payload);
    const actionType = payload.type;

    switch (actionType) {
      case 'block_actions':
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
        break;
      case 'view_submission':
        const callbackId = payload.view.callback_id;

        if (callbackId === 'channel_selection') {
          registerSelectedChannel({
            ack: () => {},
            body: payload,
            client: web,
          });
        }
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('버튼 핸들러 에러 :', error);
  }
};

module.exports = {
  sendSlackMessage,
  handleButton,
};
