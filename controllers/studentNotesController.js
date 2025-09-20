const Subject = require('../models/Subject');
const Note = require('../models/Note');
const User = require('../models/User');

exports.getSubjects = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        const subjects = await Subject.find({ classLevels: { $in: [user.classLevel.toString()] } });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load subjects' });
    }
};

exports.getNotes = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        const { subjectName, chapterName } = req.query;

        console.log('--- DEBUG: Fetching Notes ---');
        console.log('User Class Level:', user.classLevel.toString());
        console.log('Request Query:', req.query);

        const query = {
            classLevels: { $in: [user.classLevel.toString()] },
            subjectName: new RegExp(`^${subjectName}$`, 'i'),
            chapterName: new RegExp(`^${chapterName}$`, 'i')
        };

        console.log('Executing Note.find with query:', query);
        const notes = await Note.find(query);
        console.log('Database response (notes found):', notes);
        console.log('--- END DEBUG ---');

        res.json(notes);
    } catch (err) {
        console.error('Error in getNotes:', err); // Also log the error itself
        res.status(500).json({ message: 'Failed to load notes' });
    }
};