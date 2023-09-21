const { google } = require('googleapis');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_SECRET;
const oauthRedirectUri = process.env.OAUTH_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  oauthRedirectUri
);

module.exports = { oauth2Client };
