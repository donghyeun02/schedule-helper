const { appDataSource } = require('./dataSource');

const createUser = async (email, refreshToken, slackUserId) => {
  await appDataSource.query(
    `
    INSERT INTO users(email, refresh_token, is_deleted, slack_user_id)
    VALUES (?, ?, 0, ?);
    `,
    [email, refreshToken, slackUserId]
  );

  await appDataSource.query(
    `
    INSERT INTO webhooks(user_email)
    VALUES (?)`,
    [email]
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

const getCalendarId = async (email) => {
  const [calendarId] = await appDataSource.query(
    `
    SELECT calendar calendar
    FROM webhooks
    WHERE user_email = ?`,
    [email]
  );

  return calendarId.calendar;
};
const updateWebHook = async (resourceId, calendarId) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET resource_id = ?
    WHERE calendar = ?;`,
    [resourceId, calendarId]
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
    WHERE email = ?`,
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
  const isDeleted = await appDataSource.query(
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
};
