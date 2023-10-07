const { appDataSource } = require('./dataSource');

const getUserWebhook = async (email) => {
  const [result] = await appDataSource.query(
    `
  SELECT id
  FROM webhooks
  WHERE user_email = ?`,
    [email]
  );

  return result;
};

const createWebhook = async (email, slackChannel, calendar) => {
  return await appDataSource.query(
    `
    INSERT INTO webhooks(user_email, slack_channel, calendar)
    VALUES (?, ? ,?)`,
    [email, slackChannel, calendar]
  );
};

const updateWebhook = async (email, slackChannel, calendar) => {
  return await appDataSource.query(
    `
    UPDATE webhooks
    SET slack_channel = ?, calendar = ?
    WHERE user_email = ?`,
    [slackChannel, calendar, email]
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

  return slackChannel;
};

module.exports = {
  getUserWebhook,
  createWebhook,
  updateWebhook,
  getSlackChannel,
};
