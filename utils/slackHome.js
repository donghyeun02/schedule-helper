const { v4 } = require('uuid');
const { google } = require('googleapis');
const { slackDao, calendarDao } = require('../models');

const { oauth2Client } = require('../utils/oauth2');
const { sendErrorMessageToServer } = require('../utils/errorToServer');
const { saveEvents } = require('../utils/saveEvents');

const calendar = google.calendar('v3');

const beforeLoginBlock = async (slackUserId, slackTeamId) => {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '스케줄 헬퍼',
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Google Login',
            emoji: true,
          },
          value: 'google login',
          url: `https://donghyeun02.link/login?slackUserId=${slackUserId}&slackTeamId=${slackTeamId}`,
          style: 'primary',
          action_id: 'google_login',
        },
      ],
    },
  ];

  return blocks;
};

const afterLoginBlock = async (option, slackUserId) => {
  const userInfo = await calendarDao.getChannelAndCalendarNameAndReminder(
    slackUserId
  );

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '스케줄 헬퍼',
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
          text: `# ${userInfo.channelName}` || `채널 선택`,
        },
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '캘린더 선택',
      },
      accessory: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: userInfo.calendarName || '캘린더 선택',
          emoji: true,
        },
        options: option,
        action_id: 'selected_calendar',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '채널과 캘린더 선택 후 등록해주세요.',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '캘린더 구독하기',
          emoji: true,
        },
        value: 'webhook',
        style: 'primary',
        action_id: 'webhook_button',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '캘린더 구독 재등록',
            emoji: true,
          },
          value: 're-register webhook',
          action_id: 're-register_Webhook',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '구독 종료',
            emoji: true,
          },
          value: 'drop webhook',
          action_id: 'delete_webhook',
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
        initial_time: userInfo.reminderTime
          ? userInfo.reminderTime.slice(0, 5)
          : '00:00',
        placeholder: {
          type: 'plain_text',
          text: 'Select time',
          emoji: true,
        },
        action_id: 'time',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '설정된 리마인더 시간을 초기화합니다.',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '시간 초기화',
          emoji: true,
        },
        value: 'webhook',
        style: 'primary',
        action_id: 'reset_time',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '로그아웃',
            emoji: true,
          },
          value: 'google logout',
          style: 'primary',
          action_id: 'google_logout',
        },
      ],
    },
  ];

  return blocks;
};

const appHomeOpened = async ({ body, client }) => {
  try {
    const slackUserId = body.event.user;
    const slackTeamId = body.team_id;

    const ExistingUser = parseInt(await calendarDao.userExist(slackUserId));

    if (!!ExistingUser) {
      const isDeleted = parseInt(await calendarDao.getUserDeleted(slackUserId));

      if (!isDeleted) {
        const option = await getCalendarList(slackUserId);

        const blocks = await afterLoginBlock(option, slackUserId);

        return await client.views.publish({
          user_id: slackUserId,
          view: {
            type: 'home',
            callback_id: 'home_view',
            blocks: blocks,
          },
        });
      }
    }

    const blocks = await beforeLoginBlock(slackUserId, slackTeamId);

    return await client.views.publish({
      user_id: slackUserId,
      view: {
        type: 'home',
        callback_id: 'home_view',
        blocks: blocks,
      },
    });
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const selectedChannel = async ({ ack, body, client }) => {
  ack();
  try {
    const userId = body.user.id;
    const slackChannel = body.actions[0].selected_channel;
    const slackChannelInfo = await client.conversations.info({
      channel: slackChannel,
    });
    const slackChannelName = slackChannelInfo.channel.name;

    await slackDao.updateSlackChannel(userId, slackChannel, slackChannelName);
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const selectedCalendar = async ({ ack, body }) => {
  ack();
  try {
    const userId = body.user.id;
    const calendar = body.actions[0].selected_option.value;
    const calendarName = body.actions[0].selected_option.text.text;
    await slackDao.updateCalendarId(calendar, calendarName, userId);
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const registerWebhook = async ({ ack, body, client }) => {
  ack();

  const userId = body.user.id;

  const calendarId = await slackDao.getCalendarByuserId(userId);
  const channelId = await slackDao.getSlackChannelByuserId(userId);
  const webhook = await slackDao.getResourceIdByuserId(userId);

  if (!calendarId || !channelId) {
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'error_modal',
          title: {
            type: 'plain_text',
            text: '오류',
          },
          blocks: [
            {
              type: 'section',
              block_id: 'error_message',
              text: {
                type: 'mrkdwn',
                text: '채널 및 캘린더를 선택해주세요.',
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('조건에 맞지않는 모달창 오류 :', error);
    }
  } else if (!!webhook) {
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'error_modal',
          title: {
            type: 'plain_text',
            text: '오류',
          },
          blocks: [
            {
              type: 'section',
              block_id: 'error_message',
              text: {
                type: 'mrkdwn',
                text: '캘린더 구독이 이미 되어있습니다.',
              },
            },
          ],
        },
      });
    } catch (error) {
      const teamId = body.user.team_id;
      await sendErrorMessageToServer(teamId, error.stack);
    }
  } else {
    try {
      await calendarWebhook(userId, calendarId);
      await saveEvents(userId);

      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'success_modal',
          title: {
            type: 'plain_text',
            text: '캘린더 구독',
          },
          blocks: [
            {
              type: 'section',
              block_id: 'error_message',
              text: {
                type: 'mrkdwn',
                text: '캘린더 구독이 완료되었습니다.',
              },
            },
          ],
        },
      });
    } catch (error) {
      const teamId = body.user.team_id;
      await sendErrorMessageToServer(teamId, error.stack);
    }
  }
};

const reRegisterWebhook = async ({ ack, body, client }) => {
  ack();

  const userId = body.user.id;

  const webhookData = await calendarDao.getWebhookIdAndResourceId(userId);

  if (!webhookData.resourceId) {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'success_modal',
        title: {
          type: 'plain_text',
          text: '웹훅 종료 오류',
        },
        blocks: [
          {
            type: 'section',
            block_id: 'error_message',
            text: {
              type: 'mrkdwn',
              text: '구독된 캘린더가 없습니다.',
            },
          },
        ],
      },
    });
  } else if (!!webhookData.resourceId) {
    const calendarId = await slackDao.getCalendarByuserId(userId);
    const refreshToken = await calendarDao.getRefreshTokenByUserID(userId);

    await oauth2Client.setCredentials({ refresh_token: refreshToken });

    const getAccessToken = await oauth2Client.getAccessToken();
    const accessToken = getAccessToken.token;

    try {
      await calendar.channels.stop({
        resource: {
          id: webhookData.webhookId,
          resourceId: webhookData.resourceId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: `application/json`,
        },
      });

      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'success_modal',
          title: {
            type: 'plain_text',
            text: '캘린더 구독 재등록',
          },
          blocks: [
            {
              type: 'section',
              block_id: 'error_message',
              text: {
                type: 'mrkdwn',
                text: '캘린더 구독이 재시작되었습니다.',
              },
            },
          ],
        },
      });
    } catch (error) {
      const teamId = body.user.team_id;
      await sendErrorMessageToServer(teamId, error.stack);
    }
    await calendarWebhook(userId, calendarId);
    await saveEvents(userId);
  }
};

const dropWebhook = async ({ ack, body, client }) => {
  ack();
  try {
    const userId = body.user.id;

    const webhookData = await calendarDao.getWebhookIdAndResourceId(userId);
    const refreshToken = await calendarDao.getRefreshTokenByUserID(userId);

    if (!webhookData.resourceId) {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'success_modal',
          title: {
            type: 'plain_text',
            text: '웹훅 종료 오류',
          },
          blocks: [
            {
              type: 'section',
              block_id: 'error_message',
              text: {
                type: 'mrkdwn',
                text: '구독된 캘린더가 없습니다.',
              },
            },
          ],
        },
      });
    } else if (!!webhookData.resourceId) {
      await oauth2Client.setCredentials({ refresh_token: refreshToken });

      const getAccessToken = await oauth2Client.getAccessToken();
      const accessToken = getAccessToken.token;

      await calendar.channels.stop({
        resource: {
          id: webhookData.webhookId,
          resourceId: webhookData.resourceId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: `application/json`,
        },
      });

      await calendarDao.deleteWebhook(userId);

      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'success_modal',
          title: {
            type: 'plain_text',
            text: '웹훅 종료',
          },
          blocks: [
            {
              type: 'section',
              block_id: 'error_message',
              text: {
                type: 'mrkdwn',
                text: '구독된 캘린더가 종료되었습니다.',
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const registerReminder = async ({ ack, body }) => {
  ack();
  try {
    const userId = body.user.id;
    const time = body.actions[0].selected_time;

    await slackDao.updateReminderTime(time, userId);
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const resetReminderTime = async ({ ack, body, client }) => {
  ack();

  try {
    const userId = body.user.id;

    await calendarDao.resetReminderTime(userId);

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'success_modal',
        title: {
          type: 'plain_text',
          text: '리마인더 시간 초기화',
        },
        blocks: [
          {
            type: 'section',
            block_id: 'error_message',
            text: {
              type: 'mrkdwn',
              text: '리마인더 시간이 초기화되었습니다.',
            },
          },
        ],
      },
    });
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const googleLogout = async ({ ack, body, client }) => {
  ack();
  try {
    const userId = body.user.id;
    const teamId = body.user.team_id;

    const webhookData = await calendarDao.getWebhookIdAndResourceId(userId);

    if (!!webhookData.resourceId) {
      const refreshToken = await calendarDao.getRefreshTokenByUserID(userId);

      await oauth2Client.setCredentials({ refresh_token: refreshToken });

      const getAccessToken = await oauth2Client.getAccessToken();
      const accessToken = getAccessToken.token;

      await calendar.channels.stop({
        resource: {
          id: webhookData.webhookId,
          resourceId: webhookData.resourceId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: `application/json`,
        },
      });

      await calendarDao.deleteWebhook(userId);
    }

    await calendarDao.deleteUser(userId);

    const blocks = await beforeLoginBlock(userId, teamId);

    return await client.views.publish({
      user_id: userId,
      view: {
        type: 'home',
        callback_id: 'home_view',
        blocks: blocks,
      },
    });
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const calendarWebhook = async (userId, calendarId) => {
  try {
    const webhookId = v4();

    const refreshToken = await calendarDao.getRefreshTokenByUserID(userId);

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const getAccessToken = await oauth2Client.getAccessToken();
    const accessToken = getAccessToken.token;

    const webhook = await calendar.events.watch({
      resource: {
        id: webhookId,
        type: 'web_hook',
        address: 'https://donghyeun02.link/calendar-webhook',
        params: {
          ttl: 2592000,
        },
      },
      calendarId: calendarId,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: `application/json`,
      },
    });

    const { data } = webhook;

    const resourceId = data.resourceId;
    const expiration = data.expiration;

    await calendarDao.updateWebHook(webhookId, resourceId, expiration, userId);

    console.log('Google Calendar Webhook이 설정되었습니다. : ', data);
  } catch (error) {
    const teamId = body.user.team_id;
    await sendErrorMessageToServer(teamId, error.stack);
  }
};

const getCalendarList = async (slackUserId) => {
  const refreshToken = await calendarDao.getRefreshTokenByUserID(slackUserId);

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendars = await calendar.calendarList.list({
    auth: oauth2Client,
  });

  const calendarList = calendars.data.items;

  const calendarOptions = [];

  if (calendarList.length) {
    calendarList.forEach((calendar) => {
      const option = {
        text: {
          type: 'plain_text',
          text: calendar.summary,
          emoji: true,
        },
        value: calendar.id,
      };
      calendarOptions.push(option);
    });

    return calendarOptions;
  } else {
    const option = {
      text: {
        type: 'plain_text',
        text: '캘린더 없음.',
        emoji: true,
      },
      value: 'no calendar list',
    };
    calendarOptions.push(option);
  }

  return calendarOptions;
};

module.exports = {
  afterLoginBlock,
  appHomeOpened,
  selectedChannel,
  selectedCalendar,
  registerWebhook,
  reRegisterWebhook,
  dropWebhook,
  registerReminder,
  resetReminderTime,
  googleLogout,
  getCalendarList,
};
