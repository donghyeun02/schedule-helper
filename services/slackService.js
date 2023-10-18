const { WebClient } = require('@slack/web-api');
const {
  saveCalendarId,
  saveEmailAndTeamId,
  saveReminderTime,
  saveSlackChannel,
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

    if (actionType === 'block_actions') {
      const actionId = payload.actions[0].action_id;

      switch (actionId) {
        case 'input_calendar_id':
          saveCalendarId({
            ack: () => {},
            body: payload,
          });
          break;
        case 'input_email':
          saveEmailAndTeamId({
            ack: () => {},
            body: payload,
          });
          break;
        case 'time':
          saveReminderTime({
            ack: () => {},
            body: payload,
          });
          break;
        case 'selected_channel':
          saveSlackChannel({
            ack: () => {},
            body: payload,
          });
          break;
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error('버튼 핸들러 에러 :', error);
  }
};

const handleEvent = async (req, res) => {
  try {
    const event = req.body.event;

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '구글 캘린더 알리미',
        },
      },
      {
        dispatch_action: true,
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: 'input_email',
          placeholder: {
            type: 'plain_text',
            text: '웹훅 등록할 이메일 입력',
          },
        },
        label: {
          type: 'plain_text',
          text: '이메일',
          emoji: true,
        },
      },
      {
        dispatch_action: true,
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: 'input_calendar_id',
          placeholder: {
            type: 'plain_text',
            text: '캘린더 ID 입력 (개인 캘린더일 시 : primary)',
          },
        },
        label: {
          type: 'plain_text',
          text: '캘린더 ID',
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
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
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Google Login 및 웹훅 등록',
              emoji: true,
            },
            value: 'google login',
            url: 'https://donghyeun02.link/',
            style: 'primary',
            action_id: 'google_login',
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '구글 캘린더 리마인더',
        },
      },
      {
        type: 'section',
        block_id: 'select_time',
        text: {
          type: 'mrkdwn',
          text: '캘린더 리마인더 시간대를 설정해주세요',
        },
        accessory: {
          type: 'timepicker',
          initial_time: '00:00',
          placeholder: {
            type: 'plain_text',
            text: 'Select time',
            emoji: true,
          },
          action_id: 'time',
        },
      },
    ];

    await web.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        callback_id: 'home_view',
        blocks: blocks,
      },
    });

    return res.status(200).end();
  } catch (error) {
    console.error('Error updating home tab:', error);
  }
};

module.exports = {
  sendSlackMessage,
  handleButton,
  handleEvent,
};
