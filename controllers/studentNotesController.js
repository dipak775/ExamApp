const Subject = require('../models/Subject');
const Note = require('../models/Note');
const User = require('../models/User');

exports.getSubjects = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id).populate('approvedSubjects');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let query = { "classes.classLevel": user.classLevel.toString() };

        if (user.role !== 'admin' && user.approvedSubjects && user.approvedSubjects.length === 0) {
            return res.json([]);
        }

        if (user.approvedSubjects && user.approvedSubjects.length > 0) {
            const approvedSubjectIds = user.approvedSubjects.map(s => s._id);
            query._id = { $in: approvedSubjectIds };
        }

        const subjects = await Subject.find(query);
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load subjects' });
    }
};

exports.getNotes = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        const { subjectName, chapterName } = req.query;

        const query = {
            classLevels: { $in: [user.classLevel.toString()] },
            subjectName: new RegExp(`^${subjectName}$`, 'i'),
        };

        if (chapterName) {
            query.chapterName = new RegExp(`^${chapterName}$`, 'i');
        }

        const notes = await Note.find(query);

        res.json(notes);
    } catch (err) {
        console.error('Error in getNotes:', err); // Also log the error itself
        res.status(500).json({ message: 'Failed to load notes' });
    }
};