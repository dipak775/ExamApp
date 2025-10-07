const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { requireLogin, requireAdmin } = require('../middleware/authMiddleware');

router.get('/check-auth', apiController.checkAuth);
router.get('/profile', apiController.getProfile);
router.get('/users', requireAdmin, apiController.getUsers);
router.get('/users/:id', requireAdmin, apiController.getUserById);
router.post('/update-user', requireAdmin, apiController.updateUser);
router.delete('/users/:id', requireAdmin, apiController.deleteUser);
router.post('/admin/approve-subjects', requireAdmin, apiController.approveSubjects);

router.post('/start-exam', requireLogin, apiController.startExam);
router.post('/submit-result', requireLogin, apiController.submitResult);

router.get('/subjects', apiController.getSubjectsByClass);
router.get('/chapters', apiController.getChaptersByClassAndSubject);

const authController = require('../controllers/authController');
const studentNotes = require('./studentNotes');

// API routes for authentication
router.post('/login', authController.login);
router.post('/signup', authController.signup);

// API routes for student notes
router.use('/student', studentNotes);

module.exports = router;
