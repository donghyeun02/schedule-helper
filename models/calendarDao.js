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
    SELECT calendar
    FROM webhooks
    WHERE user_email = ?`,
    [email]
  );

  return calendarId;
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

module.exports = {
  createUser,
  emailExist,
  getCalendarId,
  createWebHook,
  webHookExistByEmail,
};
