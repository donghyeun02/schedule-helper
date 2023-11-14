const { appDataSource } = require('./dataSource');

const updateReminderTime = async (time, userId) => {
  return await appDataSource.query(
    `
    UPDATE users
    SET reminder_time = ?
    WHERE slack_user_id = ?`,
    [time, userId]
  );
};

const updateSlackChannel = async (userId, slackChannel) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET slack_channel = ?
    WHERE slack_user_id = ?`,
    [slackChannel, userId]
  );
};

const updateCalendarId = async (calendar, userId) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET calendar = ?
    WHERE slack_user_id = ?`,
    [calendar, userId]
  );
};

const getSlackChannelByuserId = async (userId) => {
  const [slackChannel] = await appDataSource.query(
    `
    SELECT slack_channel slackChannel
    FROM webhooks
    WHERE slack_user_id = ?`,
    [userId]
  );

  return slackChannel.slackChannel;
};

const getCalendarByuserId = async (userId) => {
  const [calendar] = await appDataSource.query(
    `
    SELECT calendar calendar
    FROM webhooks
    WHERE slack_user_id = ?`,
    [userId]
  );

  return calendar.calendar;
};

const getResourceIdByuserId = async (userId) => {
  const [webhook] = await appDataSource.query(
    `
    SELECT resource_id resourceId
    FROM webhooks
    WHERE slack_user_id = ?`,
    [userId]
  );

  return webhook.resourceId;
};

const getSlackChannel = async (webhookId) => {
  const [slackChannel] = await appDataSource.query(
    `
    SELECT slack_channel slackChannel
    FROM webhooks
    WHERE webhook_id = ?`,
    [webhookId]
  );

  return slackChannel.slackChannel;
};

const saveSlackUser = async (token, teamId, workSpace, userId) => {
  return await appDataSource.query(
    `
    INSERT INTO slacks(bot_token, team_id, work_space, user_id)
    VALUES (?, ?, ?, ?)`,
    [token, teamId, workSpace, userId]
  );
};

const getTokenInSlacks = async (teamId) => {
  const [botToken] = await appDataSource.query(
    `
    SELECT bot_token botToken
    FROM slacks
    WHERE team_id = ?`,
    [teamId]
  );

  return botToken.botToken;
};

const updateToken = async (token, userId) => {
  return await appDataSource.query(
    `
    UPDATE users
    SET refresh_token = ?
    WHERE slack_user_id = ?`,
    [token, userId]
  );
};

const getTeamIdByWebhookId = async (webhookId) => {
  const [teamId] = await appDataSource.query(
    `
    SELECT u.slack_team_id teamId
    FROM webhooks w
    JOIN users u ON w.slack_user_id = u.slack_user_id
    WHERE w.webhook_id = ?`,
    [webhookId]
  );

  return teamId.teamId;
};

const getTeamIdByUserId = async (userId) => {
  const [teamId] = await appDataSource.query(
    `
    SELECT slack_team_id teamId
    FROM users
    WHERE slack_user_id = ?`,
    [userId]
  );

  return teamId.teamId;
};

module.exports = {
  updateReminderTime,
  updateSlackChannel,
  updateCalendarId,
  getSlackChannelByuserId,
  getCalendarByuserId,
  getResourceIdByuserId,
  getSlackChannel,
  saveSlackUser,
  getTokenInSlacks,
  updateToken,
  getTeamIdByWebhookId,
  getTeamIdByUserId,
};
