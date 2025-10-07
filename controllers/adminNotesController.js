const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
    try {
        const { classLevel, subjectName } = req.query;
        const query = {};
        if (classLevel) {
            const classLevels = classLevel.split(',').map(item => item.trim());
            query.classLevels = { $in: classLevels };
        }
        if (subjectName) query.subjectName = subjectName;
        const notes = await Note.find(query);
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load notes' });
    }
};

exports.addNote = async (req, res) => {
    try {
        const { classLevels, subjectName, chapterName, content } = req.body;
        const newNote = new Note({ 
            classLevels,
            subjectName, 
            chapterName, 
            content 
        });
        await newNote.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).send('Failed to add note');
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { id, classLevels, subjectName, chapterName, content } = req.body;
        await Note.findByIdAndUpdate(id, { 
            classLevels,
            subjectName, 
            chapterName, 
            content 
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update note' });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.body;
        await Note.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete note' });
    }
};
