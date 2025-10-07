const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');
const { requireLogin, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', indexController.getIndex);
router.get('/login', indexController.getLogin);
router.get('/signup', indexController.getSignup);
router.get('/exam', requireLogin, indexController.getExam);
router.get('/profile', requireLogin, indexController.getProfile);
router.get('/admin', requireAdmin, indexController.getAdmin);
router.get('/waiting', requireLogin, indexController.getWaiting);
router.get('/notes', requireLogin, indexController.getNotes);

module.exports = router;
