const express = require('express');
const { calendarService } = require('../services');

const router = express.Router();

router.get('/login', calendarService.googleLogin);
router.get('/authcode', calendarService.googleOAuth);
router.post('/calendar-webhook', calendarService.webhookEventHandler);

module.exports = router;
