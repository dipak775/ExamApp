const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ================= Middleware =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), 'public')));
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

// ================= Schemas ====================
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  classLevel: { type: Number, default: 0 },
});

const questionSchema = new mongoose.Schema({
  classLevel: Number,
  questionText: String,
  option1: String,
  option2: String,
  option3: String,
  option4: String,
  answer: String,
});

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const Result = mongoose.model('Result', resultSchema);

// ================= Middleware =================
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/exam');
  }
  next();
}

// ================= Page Routes =================
app.get('/', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'Signup.html')));
app.get('/exam', requireLogin, async (req, res) => {
  const user = await User.findById(req.session.user._id);
  if (!user || user.classLevel === 0) return res.redirect('/waiting');
  res.sendFile(path.join(process.cwd(), 'public', 'Exam.html'));
});
app.get('/profile', requireLogin, (req, res) =>
  res.sendFile(path.join(process.cwd(), 'public', 'Profile.html'))
);
app.get('/admin', requireAdmin, (req, res) =>
  res.sendFile(path.join(process.cwd(), 'public', 'Admin.html'))
);
app.get('/waiting', requireLogin, (req, res) =>
  res.sendFile(path.join(process.cwd(), 'public', 'Waiting.html'))
);

// ================= Auth Routes =================
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.send('⚠️ All fields required');

    const existing = await User.findOne({ email });
    if (existing) return res.send('⚠️ User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    res.status(500).send('❌ Signup failed');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.send('⚠️ User not found');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('⚠️ Invalid credentials');

    req.session.user = user;
    res.redirect(user.role === 'admin' ? '/admin' : '/profile');
  } catch (err) {
    res.status(500).send('❌ Login failed');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ================= API Routes =================
app.get('/check-auth', (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
  else res.json({ loggedIn: false });
});

app.get('/api/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
  try {
    const user = await User.findById(req.session.user._id).lean();
    const results = await Result.find({ userId: user._id }).sort({ submittedAt: -1 }).lean();
    res.json({ user, results });
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

app.get('/api/users', requireAdmin, async (req, res) => {
  try { const users = await User.find(); res.json(users); }
  catch { res.status(500).json({ message: '❌ Failed to load users' }); }
});

app.post('/api/update-user', requireAdmin, async (req, res) => {
  const { userId, classLevel, role } = req.body;
  try { await User.findByIdAndUpdate(userId, { classLevel, role }); res.json({ success: true }); }
  catch { res.status(500).json({ message: '❌ Failed to update user' }); }
});

app.post('/submit-question', requireAdmin, async (req, res) => {
  try {
    const { classLevel, questionText, option1, option2, option3, option4, answer } = req.body;
    const newQuestion = new Question({ classLevel, questionText, option1, option2, option3, option4, answer });
    await newQuestion.save();
    res.redirect('/admin');
  } catch { res.status(500).send('❌ Failed to add question'); }
});

app.get('/api/questions/:classLevel', async (req, res) => {
  try { const questions = await Question.find({ classLevel: req.params.classLevel }); res.json(questions); }
  catch { res.status(500).json({ message: '❌ Failed to load questions' }); }
});

app.get('/api/questions', requireAdmin, async (req, res) => {
  try { const questions = await Question.find(); res.json(questions); }
  catch { res.status(500).json({ message: '❌ Failed to load questions' }); }
});

// ================= Exam Timer System =================
app.post('/start-exam', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const questions = await Question.find({ classLevel: user.classLevel });
    const questionCount = questions.length;

    const timePerQuestion = 0.5 * 60 * 1000; // 0.5 minute per question
    const extraTime = 10 * 60 * 1000; // 10 minutes extra
    const totalTime = questionCount * timePerQuestion + extraTime;

    req.session.examStartTime = Date.now();
    req.session.examSubmitted = false;

    res.json({
      success: true,
      startTime: req.session.examStartTime,
      expiryTime: req.session.examStartTime + totalTime
    });
  } catch (err) {
    console.error("Start exam error:", err);
    res.status(500).json({ success: false, message: "Failed to start exam" });
  }
});

app.post('/submit-result', requireLogin, async (req, res) => {
  try {
    if (!req.session.examStartTime)
      return res.status(400).json({ success: false, message: "Exam not started" });

    if (req.session.examSubmitted)
      return res.status(400).json({ success: false, message: "Already submitted" });

    const { answers } = req.body;
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
      total: answers.length
    });
    await newResult.save();

    req.session.examStartTime = null;
    req.session.examSubmitted = true;

    res.json({ success: true, score, attempts, total: answers.length });
  } catch (err) {
    console.error("Submit result error:", err);
    res.status(500).json({ success: false, message: "Failed to submit exam" });
  }
});

// ================= Start Server =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
