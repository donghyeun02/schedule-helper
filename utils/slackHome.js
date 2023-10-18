const { App, ExpressReceiver } = require('@slack/bolt');
const { settingReminderTime } = require('../models/calendarDao');
const {
  updateCalendarId,
  updateEmailAndTeamId,
  getEmailByTeamId,
  updateReminderTime,
  updateSlackChannel,
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

const saveCalendarId = async ({ ack, body }) => {
  try {
    ack();

    const teamId = body.user.team_id;
    const calendar = body.actions[0].value;

    await updateCalendarId(calendar, teamId);
  } catch (error) {
    console.error('캘린더 ID 등록 에러:', error);
  }
};

const saveEmailAndTeamId = async ({ ack, body }) => {
  try {
    ack();

    const teamId = body.user.team_id;
    const email = body.actions[0].value;

    await updateEmailAndTeamId(email, teamId);
  } catch (error) {
    console.error('Email 등록 에러:', error);
  }
};

const saveReminderTime = async ({ ack, body }) => {
  try {
    ack();

    const teamId = body.user.team_id;
    const time = body.actions[0].selected_time;

    const email = await getEmailByTeamId(teamId);

    await updateReminderTime(email, time);
  } catch (error) {
    console.error('Reminder Time 등록 에러:', error);
  }
};

const saveSlackChannel = async ({ ack, body }) => {
  try {
    ack();

    const teamId = body.user.team_id;
    const slackChannel = body.actions[0].selected_channel;

    await updateSlackChannel(teamId, slackChannel);
  } catch (error) {
    console.error('Slack Channel 등록 에러:', error);
  }
};

// const startReminder = async ({ ack, body, client }) => {
//   ack();

//   const time = body.view.state.values.select_time.time.selected_time;
//   const userEmail = body.view.state.values.setting_email.reminder_email.value;

//   await settingReminderTime(time, userEmail);

//   await client.views.update({
//     view_id: body.view.id,
//     response_action: 'clear',
//   });
// };

module.exports = {
  slackReceiver,
  slackApp,
  saveCalendarId,
  saveEmailAndTeamId,
  saveReminderTime,
  saveSlackChannel,
  // startReminder,
};
