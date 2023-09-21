const express = require('express');
const calendarService = require('../services/calendarService');

const router = express.Router();

router.get('/', calendarService.googleLogin);
router.get('/authcode', calendarService.setUpCalendarWebhook);
router.post('/calendar-webhook', calendarService.calendarEventHandler);

module.exports = router;
