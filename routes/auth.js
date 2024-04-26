const express = require('express');

const { register, login, getMe, logout, resetPassword, resetPasswordVerify } = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);

router.post('/login', login);

router.get('/me', protect, getMe);

router.get('/logout', logout);

router.post('/reset-password', resetPassword);

router.post('/reset-password/verify', resetPasswordVerify);

module.exports = router;
