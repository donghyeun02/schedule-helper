const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');

const slackEvents = createEventAdapter(process.env.SLACK_SECRET);
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

const eventSubscriptions = slackEvents.requestListener();

slackEvents.on('error', console.error);

module.exports = { eventSubscriptions };
