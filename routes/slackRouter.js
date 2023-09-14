const express = require('express');
const slackService = require('../services/slackService');

const router = express.Router();

router.use('/events', slackService.eventSubscriptions);
router.post('/message', slackService.sendMessage);

module.exports = router;
