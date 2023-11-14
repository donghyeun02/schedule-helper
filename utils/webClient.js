const { WebClient } = require('@slack/web-api');
const { slackDao } = require('../models');

const client = async (slackTeamId) => {
  const botToken = await slackDao.getTokenInSlacks(slackTeamId);

  return new WebClient(botToken);
};

module.exports = { client };
