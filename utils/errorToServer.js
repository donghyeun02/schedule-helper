const { WebClient } = require('@slack/web-api');

const { slackDao } = require('../models');

const sendErrorMessageToServer = async (teamId, errorMessage) => {
  const web = new WebClient(process.env.ERROR_TOKEN);

  const errorChannel = process.env.ERROR_CHANNEL;
  const workSpace = await slackDao.getWorkSpace(teamId);

  try {
    const result = await web.chat.postMessage({
      channel: errorChannel,
      text: `*에러 발생*\n워크스페이스: ${workSpace}\n에러 메시지: ${errorMessage}`,
      mrkdwn: true,
    });

    console.log('Slack에 에러 메시지가 전송되었습니다.', result);
  } catch (error) {
    console.error('Slack에 에러 메시지를 전송하는 도중 오류 발생:', error);
  }
};

module.exports = { sendErrorMessageToServer };
