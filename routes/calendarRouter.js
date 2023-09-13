const express = require('express');
const calendarService = require('../services/calendarService');

const router = express.Router();

router.get('/', calendarService.homePage);
router.get('/login', calendarService.googleLogin);
router.get('/authcode', calendarService.getToken);

module.exports = router;
