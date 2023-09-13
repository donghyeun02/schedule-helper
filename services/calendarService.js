const axios = require('axios');

const clientId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_SECRET;
// const calendarId = process.env.CALENDAR_ID;

const oauthRedirectUri = process.env.OAUTH_REDIRECT_URI;
// const tokenRedirectUri = 'process.env.TOKEN_REDIRECT_URI';

const homePage = async (req, res) => {
  res.status(200).send(`
  <h1>Calendar Bot Home page</h1>
  <a href="/login">login</a>
`);
};

const googleLogin = async (req, res) => {
  let url = 'https://accounts.google.com/o/oauth2/v2/auth';
  url += `?client_id=${clientId}`;
  url += `&redirect_uri=${oauthRedirectUri}`;
  url += '&scope=https://www.googleapis.com/auth/calendar.readonly';
  url += '&response_type=code';
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

  const accessToken = `Bearer ${getAccessToken.data.access_token}`;

  res.json(accessToken);
};

const test = test;

module.exports = { homePage, googleLogin, getToken };
