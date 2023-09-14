const axios = require('axios');
const { v4 } = require('uuid');

const clientId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_SECRET;
const calendarId = process.env.CALENDAR_ID;

const oauthRedirectUri = process.env.OAUTH_REDIRECT_URI;
const webhookRedirectUri = process.env.WEBHOOK_REDIRECT_URI;

const googleLogin = async (req, res) => {
  const scope = 'https://www.googleapis.com/auth/calendar.readonly';
  const responseType = 'code';

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${oauthRedirectUri}&scope=${scope}&response_type=${responseType}`;
  res.redirect(url);
};

const getToken = async (req, res) => {
  const authCode = req.query.code;

  const getAccessToken = await axios.post(
    'https://oauth2.googleapis.com/token',
    {
      code: authCode,
      client_id: clientId,
      client_secret: googleSecret,
      grant_type: 'authorization_code',
      redirect_uri: oauthRedirectUri,
    }
  );

  const accessToken = getAccessToken.data.access_token;

  await axios({
    url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/watch`,
    method: 'post',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: `application/json`,
    },
    data: {
      id: v4(),
      type: 'web_hook',
      address: webhookRedirectUri,
    },
  });

  res.json('OK');
};

module.exports = { googleLogin, getToken };
