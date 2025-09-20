const Result = require('../models/Result');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Question = require('../models/Question');

exports.getSubjectsByClass = async (req, res) => {
    try {
        const subjects = await Subject.find({ classLevels: req.params.classLevel });
        res.json(subjects.map(s => s.name));
    } catch (err) {
        res.status(500).json({ message: '❌ Failed to load subjects' });
    }
};

exports.getChaptersByClassAndSubject = async (req, res) => {
    try {
        const subject = await Subject.findOne({ classLevels: req.params.classLevel, name: req.params.subjectName });
        res.json(subject ? subject.chapters : []);
    } catch (err) {
        res.status(500).json({ message: '❌ Failed to load chapters' });
    }
};

exports.checkAuth = (req, res) => {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
};

exports.getProfile = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
    try {
        const user = await User.findById(req.session.user._id).lean();
        const results = await Result.find({ userId: user._id }).sort({ submittedAt: -1 }).lean();
        res.json({ user, results });
    } catch (err) {
        res.status(500).json({ message: "Failed to load profile" });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch {
        res.status(500).json({ message: '❌ Failed to load users' });
    }
};

exports.updateUser = async (req, res) => {
    const { userId, classLevel, role } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { classLevel, role }, { new: true });
        res.json({ success: true, user: updatedUser });
    } catch {
        res.status(500).json({ message: '❌ Failed to update user' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: '❌ Failed to delete user' });
    }
};



exports.startExam = async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const { subjectName, chapterName } = req.body;
        const query = { classLevels: { $in: [user.classLevel.toString()] } };
        if (subjectName) query.subjectName = subjectName;
        if (chapterName) query.chapterName = chapterName;

        const questions = await Question.find(query);
        const questionCount = questions.length;

        const timePerQuestion = 0.5 * 60 * 1000; // 0.5 minute per question
        const extraTime = 10 * 60 * 1000; // 10 minutes extra
        const totalTime = questionCount * timePerQuestion + extraTime;

        req.session.examStartTime = Date.now();
        req.session.examSubmitted = false;

        res.json({
            success: true,
            startTime: req.session.examStartTime,
            expiryTime: req.session.examStartTime + totalTime,
            questions: questions
        });
    } catch (err) {
        console.error("Start exam error:", err);
        res.status(500).json({ success: false, message: "Failed to start exam" });
    }
};

exports.submitResult = async (req, res) => {
    try {
        if (!req.session.examStartTime)
            return res.status(400).json({ success: false, message: "Exam not started" });

        if (req.session.examSubmitted)
            return res.status(400).json({ success: false, message: "Already submitted" });

        const { answers, subjectName, chapterName } = req.body;
        let score = 0, attempts = 0;

        for (const ans of answers) {
            if (!ans.selectedOption) continue;
            attempts++;
            const q = await Question.findById(ans.questionId);
            if (q && q.answer === ans.selectedOption) score++;
        }

        const newResult = new Result({
            userId: req.session.user._id,
            score,
            attempts,
            total: answers.length,
            subjectName,
            chapterName
        });
        await newResult.save();

        req.session.examStartTime = null;
        req.session.examSubmitted = true;

        res.json({ success: true, score, attempts, total: answers.length });
    } catch (err) {
        console.error("Submit result error:", err);
        res.status(500).json({ success: false, message: "Failed to submit exam" });
    }
};
