const express = require('express');
const { slackService } = require('../services');

const router = express.Router();

router.use('/button', (req, res) => {
  slackService.handleButton(req, res);
});

router.post('/events', (req, res) => {
  slackService.handleEvent(req, res);
});

router.get('/redirect', (req, res) => {
  slackService.appInstall(req, res);
});

module.exports = router;
