const { appDataSource } = require('./dataSource');

const createUser = async (email) => {
  await appDataSource.query(
    `
    INSERT INTO users(email)
    VALUES (?);
    `,
    [email]
  );
};

const emailExist = async (email) => {
  const [emailExist] = await appDataSource.query(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE email = ?;
    `,
    [email]
  );

  return emailExist;
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
const createWebHook = async (resourceId, email) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET resource_id = ?
    WHERE user_email = ?;`,
    [resourceId, email]
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

const saveRefreshToken = async (refreshToken, email) => {
  return await appDataSource.query(
    `
    UPDATE users
    SET refresh_token = ?
    WHERE email = ?;`,
    [refreshToken, email]
  );
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

const webHookExistByEmail = async (email) => {
  const [webHookExist] = await appDataSource.query(
    `
    SELECT 
    CASE WHEN resource_id IS NULL THEN 0 
    ELSE 1 END AS webhook_exists
    FROM webhooks
    WHERE user_email = ?;
  `,
    [email]
  );
  return webHookExist;
};

const settingReminderTime = async (time, userEmail) => {
  return await appDataSource.query(
    `
    UPDATE users
    SET reminder_time = ?
    WHERE email = ?`,
    [time, userEmail]
  );
};

const getEmailByReminderTime = async (time) => {
  return await appDataSource.query(
    `
    SELECT email
    FROM users
    WHERE reminder_time = ?`,
    [time]
  );
};
module.exports = {
  createUser,
  emailExist,
  getCalendarId,
  createWebHook,
  getUserEmailByResourceId,
  saveRefreshToken,
  getRefreshTokenByEmail,
  webHookExistByEmail,
  settingReminderTime,
  getEmailByReminderTime,
};
