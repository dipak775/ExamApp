const Question = require('../models/Question');

exports.submitQuestion = async (req, res) => {
    try {
        const { classLevels, subjectName, chapterName, questionText, option1, option2, option3, option4, answer } = req.body;
        const newQuestion = new Question({
            classLevels,
            subjectName,
            chapterName,
            questionText,
            options: [option1, option2, option3, option4],
            answer
        });
        await newQuestion.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Failed to add question');
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const { id, classLevels, subjectName, chapterName, questionText, option1, option2, option3, option4, answer } = req.body;
        await Question.findByIdAndUpdate(id, {
            classLevels,
            subjectName,
            chapterName,
            questionText,
            options: [option1, option2, option3, option4],
            answer
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update question' });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.body;
        await Question.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete question' });
    }
};

exports.getAllQuestions = async (req, res) => {
    try {
        const { classLevel, subjectName } = req.query;
        const query = {};
        if (classLevel) {
            const classLevels = classLevel.split(',').map(item => item.trim());
            query.classLevels = { $in: classLevels };
        }
        if (subjectName) query.subjectName = subjectName;
        const questions = await Question.find(query);
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: '❌ Failed to load questions' });
    }
};
