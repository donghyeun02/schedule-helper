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

const updateWebHook = async (webhookId, resourceId, slackUserId) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET webhook_id = ?, resource_id = ?
    WHERE slack_user_id = ?;`,
    [webhookId, resourceId, slackUserId]
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

const getEmailByReminderTime = async (time) => {
  const user = await appDataSource.query(
    `
    SELECT email
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
    SET is_deleted = 1
    WHERE slack_user_id = ?`,
    [slackUserId]
  );
};

const insertUser = async (slackUserId) => {
  await appDataSource.query(
    `
    UPDATE users
    SET is_deleted = 0
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
    SET resource_id = NULL, webhook_id = NULL
    WHERE slack_user_id = ?;
    `,
    [slackUserId]
  );
};

module.exports = {
  createUser,
  userExist,
  getCalendarId,
  updateWebHook,
  getUserEmailByResourceId,
  getRefreshTokenByEmail,
  getRefreshTokenByUserID,
  getEmailByReminderTime,
  getUserDeleted,
  deleteUser,
  insertUser,
  getWebhookIdAndResourceId,
  deleteWebhook,
};
