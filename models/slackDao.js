const { appDataSource } = require('./dataSource');

const updateCalendarId = async (calendar, teamId) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET calendar = ?
    WHERE slack_team_id = ?`,
    [calendar, teamId]
  );
};

const updateEmailAndTeamId = async (email, teamId) => {
  return await appDataSource.query(
    `
    INSERT INTO webhooks(user_email, slack_team_id)
    VALUES (?, ?)`,
    [email, teamId]
  );
};

const getEmailByTeamId = async (teamId) => {
  const [email] = await appDataSource.query(
    `
    SELECT user_email email
    FROM webhooks
    WHERE slack_team_id = ?`,
    [teamId]
  );

  return email.email;
};

const updateReminderTime = async (email, time) => {
  return await appDataSource.query(
    `
    UPDATE users
    SET reminder_time = ?
    WHERE email = ?`,
    [time, email]
  );
};

const updateSlackChannel = async (teamId, slackChannel) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET slack_channel = ?
    WHERE slack_team_id = ?`,
    [slackChannel, teamId]
  );
};

const getSlackChannel = async (email) => {
  const [slackChannel] = await appDataSource.query(
    `
    SELECT slack_channel slackChannel
    FROM webhooks
    WHERE user_email = ?`,
    [email]
  );

  return slackChannel.slackChannel;
};

module.exports = {
  updateCalendarId,
  updateEmailAndTeamId,
  getEmailByTeamId,
  updateReminderTime,
  updateSlackChannel,
  getSlackChannel,
};
