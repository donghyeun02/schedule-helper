const { WebClient } = require('@slack/web-api');

const { slackDao } = require('../models');

const sendErrorMessageToServer = async (teamId, errorMessage) => {
  const web = new WebClient(process.env.ERROR_TOKEN);

  const errorChannel = process.env.ERROR_CHANNEL;

  try {
    const errorWorkSpace = await slackDao.getWorkSpace(teamId);

    const option = {
      channel: errorChannel,
      attachments: [
        {
          color: 'DB2525',
          fallback: 'Slack attachment-level `fallback`',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'Error',
                emoji: true,
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:office: *Workspace:* ${errorWorkSpace}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:warning: *Error Message:* ${errorMessage}`,
              },
            },
          ],
        },
      ],
    };

    await web.chat.postMessage(option);

    console.log('Slack에 에러 메시지가 전송되었습니다.');
  } catch (error) {
    console.error('Slack에 에러 메시지를 전송하는 도중 오류 발생:', error);
  }
};

const sendAppInstallError = async (errorMessage) => {
  const web = new WebClient(process.env.ERROR_CHANNEL);

  const errorChannel = process.env.ERROR_CHANNEL;

  try {
    await web.chat.postMessage({
      channel: errorChannel,
      text: `*에러 발생* 앱 설치 과정에서 오류가 떴습니다. \n 에러 메시지 : ${errorMessage}`,
    });

    console.log('Slack에 에러 메시지가 전송되었습니다.');
  } catch (error) {
    console.error('Slack에 에러 메시지를 전송하는 도중 오류 발생:', error);
  }
};

module.exports = { sendErrorMessageToServer, sendAppInstallError };
