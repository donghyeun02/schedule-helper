const express = require('express');
const slackService = require('../services/slackService');

const router = express.Router();

router.use('/slack/events', slackService.eventSubscriptions);

module.exports = router;
