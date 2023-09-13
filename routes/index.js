const express = require('express');
const router = express.Router();

const slackRouter = require('./slackRouter');
const calendarRouter = require('./calendarRouter');

router.use('/slack', slackRouter);
router.use('/', calendarRouter);

module.exports = router;
