const { WebClient } = require('@slack/web-api');
const { getTokenInSlacks } = require('../models/slackDao');

const client = async (slackTeamId) => {
  const botToken = await getTokenInSlacks(slackTeamId);

  return new WebClient(botToken);
};

module.exports = { client };
