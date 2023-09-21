const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');

const slackEvents = createEventAdapter(process.env.SLACK_SECRET);
const web = new WebClient(process.env.SLACK_BOT_TOKEN);
const slackChannel = process.env.CONVERSATION_ID;

const eventSubscriptions = slackEvents.requestListener();

slackEvents.on('error : ', console.error);

const sendSlackMessage = async (message, eventOpt) => {
  try {
    const option = {
      channel: slackChannel,
      text: message,
      attachment: [eventOpt],
    };

    await web.chat.postMessage(option);
  } catch (error) {
    console.error('Slack 메시지 전송 에러 :', error);
  }
};

module.exports = { eventSubscriptions, sendSlackMessage };
