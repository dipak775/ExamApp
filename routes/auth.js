const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/forgot-password', (req, res) => {
    res.sendFile('ForgotPassword.html', { root: 'views' });
});

router.post('/forgot-password', authController.forgotPassword);

router.get('/reset-password/:token', (req, res) => {
    res.sendFile('ResetPassword.html', { root: 'views' });
});

router.post('/reset-password', authController.resetPassword);

module.exports = router;
