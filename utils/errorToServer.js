const { WebClient } = require('@slack/web-api');

const { slackDao } = require('../models');

const sendErrorMessageToServer = async (teamId, errorMessage) => {
  const web = new WebClient(process.env.ERROR_TOKEN);

  const errorChannel = process.env.ERROR_CHANNEL;

  try {
    const errorWorkSpace = await slackDao.getWorkSpace(teamId);

    const sendErrorMessage = await web.chat.postMessage({
      channel: errorChannel,
      text: `*에러 발생*\n워크스페이스: ${errorWorkSpace}\n에러 메시지: ${errorMessage}`,
      mrkdwn: true,
    });

    console.log('Slack에 에러 메시지가 전송되었습니다.', sendErrorMessage);
  } catch (error) {
    console.error('Slack에 에러 메시지를 전송하는 도중 오류 발생:', error);
  }
};

module.exports = { sendErrorMessageToServer };
