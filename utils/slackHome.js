const { App, ExpressReceiver } = require('@slack/bolt');

const slackReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SECRET,
  processBeforeResponse: true,
});

const slackApp = new App({
  signingSecret: process.env.SLACK_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  receiver: slackReceiver,
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
  await ack();

  try {
    const triggerId = body.trigger_id;

    await client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'channel_selection',
        title: {
          type: 'plain_text',
          text: '알림받을 채널 등록',
        },
        blocks: [
          {
            type: 'section',
            block_id: 'channel_select',
            text: {
              type: 'mrkdwn',
              text: '알림받을 채널을 선택해주세요.',
            },
            accessory: {
              type: 'channels_select',
              action_id: 'selected_channel',
              placeholder: {
                type: 'plain_text',
                text: '채널 선택',
              },
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: '등록하기',
        },
      },
    });
  } catch (error) {
    console.error('채널 선택 모달창 에러 :', error);
  }
};

const registerSelectedChannel = async ({ ack, body, client }) => {
  await ack();

  const selectedChannel =
    body.view.state.values.channel_select.selected_channel;

  const channelId = selectedChannel.selected_channel;

  console.log(channelId);

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: '알림받을 채널 등록',
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '등록이 완료되었습니다.',
          },
        },
      ],
    },
  });
};

module.exports = {
  slackReceiver,
  slackApp,
  googleLogin,
  channelRegistration,
  registerSelectedChannel,
};
