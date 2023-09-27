require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const router = require('./routes');
const { slackReceiver, slackApp } = require('./utils/slackHome');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(logger('combined'));
app.use(router);

const port = process.env.PORT;
const slackPort = process.env.SLACK_PORT;

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.use('/slack/events', slackReceiver.router);

slackApp.start(slackPort).then(() => {
  console.log(`Slack app is running on port ${slackPort}`);
});

app.listen(port, () => {
  console.log(`Express app is running on port ${port}`);
});
