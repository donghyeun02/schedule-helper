const express = require('express');
const slackService = require('../services/slackService');

const router = express.Router();

router.use('/button', (req, res) => {
  slackService.handleButton(req, res);
});

router.post('/events', (req, res) => {
  slackService.handleEvent(req, res);
});

module.exports = router;
