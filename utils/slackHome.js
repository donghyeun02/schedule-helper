const { App } = require('@slack/bolt');

const slackApp = new App({
  signingSecret: process.env.SLACK_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

const googleLogin = async ({ ack, body, client }) => {
  ack();

  const redirectURL = 'https://donghyeun02.link/';

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'webview-1',
      title: {
        type: 'plain_text',
        text: 'Google Login',
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `구글 로그인 링크 : (${redirectURL})`,
          },
        },
      ],
    },
  });
};

const channelRegistration = async ({ ack, body, client }) => {
  ack();
};

module.exports = { slackApp, googleLogin, channelRegistration };
