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
    WHERE user_email IN (
      SELECT email
      FROM users
      WHERE slack_user_id = ?)`,
    [slackChannel, userId]
  );
};

const updateCalendarId = async (calendar, userId) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET calendar = ?
    WHERE user_email IN (
      SELECT email
      FROM users
      WHERE slack_user_id = ?)`,
    [calendar, userId]
  );
};

const getSlackChannelByuserId = async (userId) => {
  const [slackChannel] = await appDataSource.query(
    `
    SELECT w.slack_channel slackChannel
    FROM webhooks w
    JOIN users u ON u.email = w.user_email
    WHERE u.slack_user_id = ?`,
    [userId]
  );

  return slackChannel.slackChannel;
};

const getCalendarByuserId = async (userId) => {
  const [calendar] = await appDataSource.query(
    `
    SELECT w.calendar calendar
    FROM webhooks w
    JOIN users u ON u.email = w.user_email
    WHERE u.slack_user_id = ?`,
    [userId]
  );

  return calendar.calendar;
};

const getResourceIdByuserId = async (userId) => {
  const [webhook] = await appDataSource.query(
    `
    SELECT w.resource_id resourceId
    FROM webhooks w
    JOIN users u ON u.email = w.user_email
    WHERE u.slack_user_id = ?`,
    [userId]
  );

  return webhook.resourceId;
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
  updateReminderTime,
  updateSlackChannel,
  updateCalendarId,
  getSlackChannelByuserId,
  getCalendarByuserId,
  getResourceIdByuserId,
  getSlackChannel,
};
