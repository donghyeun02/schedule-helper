const express = require('express');
const { calendarService } = require('../services');

const router = express.Router();

router.get('/', calendarService.googleLogin);
router.get('/authcode', calendarService.googleOAuth);
router.post('/calendar-webhook', calendarService.webhookEventHandler);
router.get('/login-success', (req, res) => {
  res.render('loginSuccessView', {
    title: '로그인 성공',
    message: '로그인 여부가 확인되었습니다 !',
  });
});

module.exports = router;
