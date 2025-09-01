// =========================
// 📌 Import Dependencies
// =========================
const dotenv = require('dotenv').config(); // Load .env
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// =========================
// 📌 Middleware
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'exam-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);
app.use(express.static(path.join(__dirname, 'public')));

// =========================
// 📌 MongoDB Connection
// =========================
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ MONGODB_URI is missing in .env');
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Error:', err));

// =========================
// 📌 Schemas & Models
// =========================
const questionSchema = new mongoose.Schema({
  question: String,
  option1: String,
  option2: String,
  option3: String,
  option4: String,
  answer: String,
});
const Question = mongoose.model('Question', questionSchema);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' }
});
const User = mongoose.model('User', userSchema);

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalScore: { type: Number, default: 0 },
  TotalExamTaken: { type: Number, default: 0 },
});
const Result = mongoose.model('Result', resultSchema);

// =========================
// 📌 Routes
// =========================

// ➡️ Signup
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPass });
    await newUser.save();
    res.redirect('/'); // redirect to login page
  } catch (err) {
    console.error(err);
    res.status(500).send('Signup failed');
  }
});

// ➡️ Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = { 
        _id: user._id, 
        username: user.username, 
        email: user.email,
        role: user.role   // ✅ এখানে role add হলো
      };
      res.redirect('/exam');
    } else {
      res.send(`<script>alert('Invalid credentials'); window.location.href='/'</script>`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Login failed');
  }
});

// ➡️ Require Login Middleware
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

// ➡️ Require Admin Middleware
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/exam'); // সাধারণ ইউজার exam পেজে যাবে
  }
  next();
}

// ➡️ Exam Page
app.get('/exam', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Exam.html'));
});

// ➡️ Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect('/');
  });
});

app.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ➡️ Add Question (Admin only)
app.post('/submit-question', requireAdmin, async (req, res) => {
  try {
    const { question, option1, option2, option3, option4, answer } = req.body;
    const newQuestion = new Question({ question, option1, option2, option3, option4, answer });
    await newQuestion.save();
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add question');
  }
});

// ➡️ Get All Questions
app.get('/api/questions', async (req, res) => {
  const questions = await Question.find({});
  res.json(questions);
});

// ➡️ Submit Exam Result
app.post('/submit-result', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { answers } = req.body;
    let currentScore = 0;

    for (let ans of answers) {
      const question = await Question.findById(ans.questionId);
      if (question && ans.selectedOption === question.answer) currentScore++;
    }

    const updatedResult = await Result.findOneAndUpdate(
      { userId },
      { $inc: { totalScore: currentScore, TotalExamTaken: 1 } },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Result saved',
      score: currentScore,
      cumulativeScore: updatedResult.totalScore,
      attempts: updatedResult.TotalExamTaken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to submit result');
  }
});

// ➡️ Profile API
app.get('/api/profile', requireLogin, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.user._id);
    const data = await User.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: 'results',
          localField: '_id',
          foreignField: 'userId',
          as: 'resultData',
        },
      },
      { $unwind: { path: '$resultData', preserveNullAndEmptyArrays: true } },
    ]);

    if (!data.length) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: { _id: data[0]._id, username: data[0].username, email: data[0].email },
      result: data[0].resultData
        ? { score: data[0].resultData.totalScore, totalAttempted: data[0].resultData.TotalExamTaken }
        : { score: 0, totalAttempted: 0 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch profile');
  }
});

// =========================
// 📌 Serve HTML
// =========================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'Admin.html'))); // ✅ এখন শুধুই admin ঢুকতে পারবে
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Signup.html')));
app.get('/profile', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'Profile.html')));

// =========================
// 📌 Start Server
// =========================
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
