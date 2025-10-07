const express = require('express');
const router = express.Router();
const studentNotesController = require('../controllers/studentNotesController');
const { requireLogin } = require('../middleware/authMiddleware');

router.get('/subjects', requireLogin, studentNotesController.getSubjects);
router.get('/notes', requireLogin, studentNotesController.getNotes);

module.exports = router;
