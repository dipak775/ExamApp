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
    try {
        const { name, classes } = req.body;
        if (!name || !classes) {
            return res.status(400).send('Missing required fields');
        }

        const processedClasses = classes.map(c => ({
            classLevel: c.classLevel,
            chapters: c.chapters.split(',').map(chap => chap.trim())
        }));

        const newSubject = new Subject({ 
            name, 
            classes: processedClasses
        });

        await newSubject.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error adding subject:', err);
        res.status(500).json({ message: 'Failed to add subject', error: err.message });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const { id, name, classes } = req.body;

        const processedClasses = classes.map(c => ({
            classLevel: c.classLevel,
            chapters: c.chapters.split(',').map(chap => chap.trim())
        }));

        await Subject.findByIdAndUpdate(id, { 
            name, 
            classes: processedClasses
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
