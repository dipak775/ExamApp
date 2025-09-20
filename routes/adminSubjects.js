const express = require('express');
const router = express.Router();
const adminSubjectsController = require('../controllers/adminSubjectsController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/subjects', requireAdmin, adminSubjectsController.getSubjects);
router.post('/add-subject', requireAdmin, adminSubjectsController.addSubject);
router.post('/update-subject', requireAdmin, adminSubjectsController.updateSubject);
router.post('/delete-subject', requireAdmin, adminSubjectsController.deleteSubject);

module.exports = router;
