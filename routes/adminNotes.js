const express = require('express');
const router = express.Router();
const adminNotesController = require('../controllers/adminNotesController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/notes', requireAdmin, adminNotesController.getNotes);
router.post('/add-note', requireAdmin, adminNotesController.addNote);
router.post('/update-note', requireAdmin, adminNotesController.updateNote);
router.post('/delete-note', requireAdmin, adminNotesController.deleteNote);

module.exports = router;
