const express = require('express');
const router = express.Router();
const adminQuestionsController = require('../controllers/adminQuestionsController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.post('/add-question', requireAdmin, adminQuestionsController.submitQuestion);
router.post('/update-question', requireAdmin, adminQuestionsController.updateQuestion);
router.post('/delete-question', requireAdmin, adminQuestionsController.deleteQuestion);
router.get('/questions', requireAdmin, adminQuestionsController.getAllQuestions);

module.exports = router;
