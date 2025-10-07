const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();

// Read partials
const layout = fs.readFileSync(path.join(__dirname, 'views', 'layout.html'), 'utf8');
const header = fs.readFileSync(path.join(__dirname, 'views', 'partials', 'header.html'), 'utf8');
const footer = fs.readFileSync(path.join(__dirname, 'views', 'partials', 'footer.html'), 'utf8');

app.locals.layout = layout.replace('<!--HEADER_PLACEHOLDER-->', header).replace('<!--FOOTER_PLACEHOLDER-->', footer);

// ================= Middleware =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), 'public')));
app.set('views', path.join(process.cwd(), 'views'));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
  })
);

// ================= MongoDB ====================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// ================= Models ====================
const User = require('./models/User');
const Question = require('./models/Question');
const Result = require('./models/Result');

// ================= Routes =================
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');
const adminSubjectsRoutes = require('./routes/adminSubjects');
const adminNotesRoutes = require('./routes/adminNotes');
const studentNotesRoutes = require('./routes/studentNotes');
const adminQuestionsRoutes = require('./routes/adminQuestions');

app.use(authRoutes);
app.use(indexRoutes);
app.use('/api/admin', adminSubjectsRoutes);
app.use('/api/admin', adminNotesRoutes);
app.use('/api/admin', adminQuestionsRoutes);
app.use('/api/student', studentNotesRoutes);
app.use('/api', apiRoutes);

// ================= 404 Handler =================
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// ================= Error Handler =================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
});


// ================= Start Server =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
