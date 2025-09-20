const Subject = require('../models/Subject');

exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load subjects' });
    }
};

exports.addSubject = async (req, res) => {
    console.log('Add subject request body:', req.body);
    try {
        const { name, classLevels, chapters } = req.body;
        if (!name || !classLevels || !chapters) {
            return res.status(400).send('Missing required fields');
        }
        const newSubject = new Subject({ 
            name, 
            classLevels: classLevels.split(',').map(item => item.trim()),
            chapters: chapters.split(',').map(item => item.trim())
        });
        await newSubject.save();
        console.log('Subject saved successfully');
        res.json({ success: true });
    } catch (err) {
        console.error('Error adding subject:', err);
        res.status(500).send('Failed to add subject');
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const { id, name, classLevels, chapters } = req.body;
        await Subject.findByIdAndUpdate(id, { 
            name, 
            classLevels: classLevels.split(',').map(item => item.trim()),
            chapters: chapters.split(',').map(item => item.trim())
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update subject' });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.body;
        await Subject.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete subject' });
    }
};
