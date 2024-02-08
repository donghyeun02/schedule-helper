const { eventarc } = require('googleapis/build/src/apis/eventarc');
const { appDataSource } = require('./dataSource');

const createUser = async (email, refreshToken, slackUserId, slackTeamId) => {
  await appDataSource.query(
    `
    INSERT INTO users(email, refresh_token, is_deleted, slack_user_id, slack_team_id)
    VALUES (?, ?, 0, ?, ?);
    `,
    [email, refreshToken, slackUserId, slackTeamId]
  );

  await appDataSource.query(
    `
    INSERT INTO webhooks(user_email, slack_user_id)
    VALUES (?, ?)`,
    [email, slackUserId]
  );
};

const updateUser = async (email, refreshToken, slackUserId) => {
  await appDataSource.query(
    `
    UPDATE users
    SET email = ?, refresh_token = ?, is_deleted = 0
    WHERE slack_user_id = ?`,
    [email, refreshToken, slackUserId]
  );

  await appDataSource.query(
    `
    UPDATE webhooks
    SET user_email = ?
    WHERE slack_user_id = ?`,
    [email, slackUserId]
  );
};

const userExist = async (slackUserId) => {
  const user = await appDataSource.query(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE slack_user_id = ?;`,
    [slackUserId]
  );

  return user[0].count;
};

const getCalendarId = async (webhookId) => {
  const [calendarId] = await appDataSource.query(
    `
    SELECT calendar calendar
    FROM webhooks
    WHERE webhook_id = ?`,
    [webhookId]
  );

  return calendarId.calendar;
};

const updateWebHook = async (
  webhookId,
  resourceId,
  expiration,
  slackUserId
) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET webhook_id = ?, resource_id = ?, expiration = ?
    WHERE slack_user_id = ?;`,
    [webhookId, resourceId, expiration, slackUserId]
  );
};

const getUserEmailByResourceId = async (resourceId) => {
  const [userEmail] = await appDataSource.query(
    `
    SELECT user_email email
    FROM webhooks
    WHERE resource_id = ?;`,
    [resourceId]
  );

  return userEmail.email;
};

const getRefreshTokenByEmail = async (email) => {
  const [token] = await appDataSource.query(
    `
    SELECT refresh_token refreshToken
    FROM users
    WHERE email = ? AND refresh_token IS NOT NULL;`,
    [email]
  );

  return token.refreshToken;
};

const getRefreshTokenByUserID = async (slackUserId) => {
  const [token] = await appDataSource.query(
    `
    SELECT refresh_token refreshToken
    FROM users
    WHERE slack_user_id = ?`,
    [slackUserId]
  );

  return token.refreshToken;
};

const getUserByReminderTime = async (time) => {
  const user = await appDataSource.query(
    `
    SELECT slack_user_id slackUserId
    FROM users
    WHERE reminder_time = ?`,
    [time]
  );

  return user;
};

const getUserDeleted = async (slackUserId) => {
  const [isDeleted] = await appDataSource.query(
    `
    SELECT is_deleted isDeleted
    FROM users
    WHERE slack_user_id = ?;`,
    [slackUserId]
  );

  return isDeleted.isDeleted;
};

const deleteUser = async (slackUserId) => {
  await appDataSource.query(
    `
    UPDATE users
    SET is_deleted = 1, reminder_time = NULL
    WHERE slack_user_id = ?`,
    [slackUserId]
  );
};

const getWebhookIdAndResourceId = async (slackUserId) => {
  const [{ webhookId, resourceId }] = await appDataSource.query(
    `
    SELECT webhook_id webhookId, resource_id resourceId
    FROM webhooks
    WHERE slack_user_id = ?`,
    [slackUserId]
  );

  return { webhookId, resourceId };
};

const deleteWebhook = async (slackUserId) => {
  await appDataSource.query(
    `
    UPDATE webhooks
    SET resource_id = NULL, webhook_id = NULL, expiration = NULL
    WHERE slack_user_id = ?;
    `,
    [slackUserId]
  );

  await appDataSource.query(
    `
    DELETE FROM events
    WHERE slack_user_id = ?;
    `,
    [slackUserId]
  );
};

const getChannelAndCalendarNameAndReminder = async (slackUserId) => {
  const [{ channelName, calendarName, reminderTime }] =
    await appDataSource.query(
      `
    SELECT w.slack_channel_name channelName,
    w.calendar_name calendarName,
    u.reminder_time reminderTime
    FROM webhooks w
    JOIN users u ON w.slack_user_id = u.slack_user_id
    WHERE w.slack_user_id = ?`,
      [slackUserId]
    );

  return { channelName, calendarName, reminderTime };
};

const resetReminderTime = async (slackUserId) => {
  await appDataSource.query(
    `
    UPDATE users
    SET reminder_time = NULL
    WHERE slack_user_id = ?;
    `,
    [slackUserId]
  );
};

const saveEvents = async (summary, link, startTime, endTime, slackUserId) => {
  await appDataSource.query(
    `INSERT INTO events (summary, link, start_time, end_time, slack_user_id) VALUES (?, ?, ?, ?, ?)`,
    [summary, link || '', startTime, endTime, slackUserId]
  );
};

const getUserIdByWebhookId = async (webhookId) => {
  const [slackUserId] = await appDataSource.query(
    `SELECT slack_user_id slackUserId
    FROM webhooks
    WHERE webhook_id = ?`,
    [webhookId]
  );

  return slackUserId.slackUserId;
};

const insertEvent = async (
  summary,
  htmlLink,
  eventStartTime,
  eventEndTime,
  slackUserId
) => {
  await appDataSource.query(
    `INSERT INTO events (summary, link, start_time, end_time, slack_user_id) VALUES (?, ?, ?, ?, ?)`,
    [summary, htmlLink, eventStartTime, eventEndTime, slackUserId]
  );
};

const modifyEvent = async (summary, htmlLink, eventStartTime, eventEndTime) => {
  await appDataSource.query(
    `UPDATE events
    SET summary = ?, start_time = ?, end_time = ?
    WHERE link = ?`,
    [summary, eventStartTime, eventEndTime, htmlLink]
  );
};

const deleteEvent = async (htmlLink) => {
  await appDataSource.query(
    `DELETE FROM events
    WHERE link = ?`,
    [htmlLink]
  );
};

const checkExpiredWebhook = async (currentTime) => {
  const expiredWebhooks = await appDataSource.query(
    `SELECT slack_user_id slackUserId 
    FROM webhooks
    WHERE expiration < ?;
    `,
    [currentTime]
  );

  return expiredWebhooks;
};

module.exports = {
  createUser,
  updateUser,
  userExist,
  getCalendarId,
  updateWebHook,
  getUserEmailByResourceId,
  getRefreshTokenByEmail,
  getRefreshTokenByUserID,
  getUserByReminderTime,
  getUserDeleted,
  deleteUser,
  getWebhookIdAndResourceId,
  deleteWebhook,
  getChannelAndCalendarNameAndReminder,
  resetReminderTime,
  saveEvents,
  getUserIdByWebhookId,
  insertEvent,
  modifyEvent,
  deleteEvent,
  checkExpiredWebhook,
};
