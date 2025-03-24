const express = require('express');
const { testNotification, listUsersWithFCM } = require('../controllers/testController');
const router = express.Router();

router.get('/users-with-fcm', listUsersWithFCM);
router.post('/send-notification', testNotification);

module.exports = router;
