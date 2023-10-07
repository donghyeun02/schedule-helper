const { App, ExpressReceiver } = require('@slack/bolt');
const {
  getUserWebhook,
  createWebhook,
  updateWebhook,
} = require('../models/slackDao');

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
  ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'channel_selection',
        title: {
          type: 'plain_text',
          text: '알림받을 채널 및 캘린더 설정',
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
              response_url_enabled: true,
              placeholder: {
                type: 'plain_text',
                text: '채널 선택',
              },
            },
          },
          {
            type: 'input',
            block_id: 'calendar_id',
            element: {
              type: 'plain_text_input',
              action_id: 'calendar_input',
              placeholder: {
                type: 'plain_text',
                text: '캘린더 ID 입력 (개인 캘린더일 시 : primary)',
              },
            },
            label: {
              type: 'plain_text',
              text: '캘린더 ID',
            },
          },
          {
            type: 'input',
            block_id: 'email_id',
            element: {
              type: 'plain_text_input',
              action_id: 'email_input',
              placeholder: {
                type: 'plain_text',
                text: '웹훅 등록한 이메일 입력',
              },
            },
            label: {
              type: 'plain_text',
              text: '이메일',
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
    console.error('채널 및 캘린더 설정 모달창 에러:', error);
  }
};

const registerSelectedChannel = async ({ ack, body, client }) => {
  const selectedChannel =
    body.view.state.values.channel_select.selected_channel;

  const channelId = selectedChannel.selected_channel;

  if (!channelId) {
    await ack();
  } else {
    const calendarId = body.view.state.values.calendar_id.calendar_input.value;
    const email = body.view.state.values.email_id.email_input.value;

    const existWebhook = await getUserWebhook(email);

    if (existWebhook) {
      await updateWebhook(email, channelId, calendarId);
    } else {
      await createWebhook(email, channelId, calendarId);
    }

    await client.views.update({
      view_id: body.view.id,
      view: {
        type: 'modal',
        callback_id: 'channel_selection',
        title: {
          type: 'plain_text',
          text: '채널 등록',
        },
        blocks: [
          {
            type: 'section',
            block_id: 'channel_select',
            text: {
              type: 'mrkdwn',
              text: `알림받을 채널(${channelId})이 성공적으로 등록되었습니다.`,
            },
          },
        ],
      },
    });
  }
};

module.exports = {
  slackReceiver,
  slackApp,
  googleLogin,
  channelRegistration,
  registerSelectedChannel,
};
