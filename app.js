require('dotenv').config();

const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT;

const app = express();

app.use(cors());
app.use(logger('combined'));

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

const slackEvents = createEventAdapter(process.env.SLACK_SECRET);
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

app.use('/slack/events', slackEvents.requestListener());

slackEvents.on('error', console.error);

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
