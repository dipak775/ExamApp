const path = require('path');
const fs = require('fs');
const User = require('../models/User');

function renderWithPartials(res, viewName, { bodyClass = '', stylesheet = '' } = {}) {
    const viewPath = path.join(process.cwd(), 'views', viewName);
    fs.readFile(viewPath, 'utf8', (err, content) => {
        if (err) {
            return res.status(500).send('Error reading view file');
        }
        let layout = res.app.locals.layout;
        if (stylesheet) {
            layout = layout.replace('<!--STYLESHEET_PLACEHOLDER-->', `<link rel="stylesheet" href="${stylesheet}">`);
        }
        layout = layout.replace('<body>', `<body class="${bodyClass}">`);
        layout = layout.replace('<!--CONTENT_PLACEHOLDER-->', content);
        res.send(layout);
    });
}

exports.getIndex = (req, res) => {
    renderWithPartials(res, 'Index.html');
};

exports.getLogin = (req, res) => {
    renderWithPartials(res, 'Login.html');
};

exports.getSignup = (req, res) => {
    renderWithPartials(res, 'Signup.html');
};

exports.getExam = async (req, res) => {
    const user = await User.findById(req.session.user._id);
    if (!user || user.classLevel === 0) return res.redirect('/waiting');
    renderWithPartials(res, 'Exam.html');
};

exports.getProfile = (req, res) => {
    res.sendFile(path.join(process.cwd(), 'views', 'Profile.html'));
};

exports.getAdmin = (req, res) => {
    res.sendFile(path.join(process.cwd(), 'views', 'Admin.html'));
};

exports.getWaiting = (req, res) => {
    renderWithPartials(res, 'Waiting.html');
};

exports.getNotes = (req, res) => {
    renderWithPartials(res, 'Notes.html', { stylesheet: '/css/notes.css' });
};
