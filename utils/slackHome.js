const { App } = require('@slack/bolt');

const slackApp = new App({
  signingSecret: process.env.SLACK_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

// slackApp.event('app_home_opened', async ({ event, client }) => {
//   try {
//     const blocks = [
//       {
//         type: 'header',
//         text: {
//           type: 'plain_text',
//           text: '구글 캘린더 알리미',
//         },
//       },
//       {
//         type: 'actions',
//         elements: [
//           {
//             type: 'button',
//             text: {
//               type: 'plain_text',
//               text: 'Google Login',
//               emoji: true,
//             },
//             style: 'primary',
//             action_id: 'google_login',
//           },
//           {
//             type: 'button',
//             text: {
//               type: 'plain_text',
//               text: '알림받을 채널 등록',
//               emoji: true,
//             },
//             action_id: 'channel_registration',
//           },
//         ],
//       },
//     ];

//     await client.views.update({
//       user_id: event.user,
//       view: {
//         type: 'home',
//         blocks: blocks,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//   }
// });

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
