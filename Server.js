// =========================
// 📌 Import Dependencies
// =========================
const express = require('express');
const session = require("express-session");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 3000;

// =========================
// 📌 Middleware Setup
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// 📌 Session Setup
// =========================
app.use(
  session({
    secret: "exam-secret-key",   
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
  })
);


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// =========================
// 📌 Question Schema & Model
// =========================
const questionSchema = new mongoose.Schema({
  question: String,
  option1: String,
  option2: String,
  option3: String,
  option4: String,
  answer: String
});
const Question = mongoose.model('Question', questionSchema);

// =========================
// 📌 User Schema & Model
// =========================
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});
const User = mongoose.model('User', userSchema);

// =========================
// 📌 Result Schema & Model
// =========================
const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalScore: { type: Number, default: 0 }, // cumulative score
  TotalExamTaken: { type: Number, default: 0 }
});
const Result = mongoose.model('Result', resultSchema);

// =========================
// 📌 Routes
// =========================

// ➡️ Admin: Add Question
app.post('/submit-question', async (req, res) => {
  const { question, option1, option2, option3, option4, answer } = req.body;
  const newQuestion = new Question({ question, option1, option2, option3, option4, answer });
  await newQuestion.save();
  res.sendFile(__dirname + '/Admin.html');
});

// ➡️ Signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPass = await bcrypt.hash(password, 10); 
  const newUser = new User({ username, email, password: hashedPass });
  await newUser.save();
  res.sendFile(__dirname + '/index.html');
});

// ➡️ Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = { _id: user._id, username: user.username, email: user.email };
    res.redirect('/exam');
  } else {
    res.send(`<script>alert('Invalid credentials'); window.location.href='/'</script>`);
  }
});

// ➡️ Middleware: require login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}

// ➡️ Exam page
app.get('/exam', requireLogin, (req, res) => {
  res.sendFile(__dirname + '/Exam.html');
});

// ➡️ Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/');
  });
});

// ➡️ Check auth
app.get('/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ➡️ Get all questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find({});
    res.json(questions);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// =========================
// 📌 Submit Exam Result (current score + cumulative update)
// =========================
app.post('/submit-result', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not logged in" });

  const userId = req.session.user._id;
  const { answers } = req.body;
  let currentScore = 0;

  for (let ans of answers) {
    const question = await Question.findById(ans.questionId);
    if (question && ans.selectedOption === question.answer) {
      currentScore++;
    }
  }

  try {
    // cumulative update
    const updatedResult = await Result.findOneAndUpdate(
      { userId },
      { $inc: { totalScore: currentScore, TotalExamTaken: 1 } },
      { upsert: true, new: true }
    );

    res.json({
      message: "Result saved",
      score: currentScore,          // current exam score
      cumulativeScore: updatedResult.totalScore, // profile will use this
      attempts: updatedResult.TotalExamTaken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving result" });
  }
});

// ➡️ Profile API
app.get("/api/profile", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not logged in" });

  try {
    const userId = new mongoose.Types.ObjectId(req.session.user._id);

    const data = await User.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: "results",
          localField: "_id",
          foreignField: "userId",
          as: "resultData"
        }
      },
      { $unwind: { path: "$resultData", preserveNullAndEmptyArrays: true } }
    ]);

    if (!data.length) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        _id: data[0]._id,
        username: data[0].username,
        email: data[0].email
      },
      result: data[0].resultData
        ? { score: data[0].resultData.totalScore, totalAttempted: data[0].resultData.TotalExamTaken }
        : { score: 0, totalAttempted: 0 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =========================
// 📌 Serve HTML & Assets
// =========================
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/Admin.html'));
app.get('/signup', (req, res) => res.sendFile(__dirname + '/Signup.html'));
app.get('/profile', (req, res) => res.sendFile(__dirname + '/Profile.html'));
app.get('/style.css', (req, res) => res.sendFile(__dirname + '/style.css'));
app.get('/profile.png', (req, res) => res.sendFile(__dirname + '/profile.png'));

// =========================
// 📌 Start Server
// =========================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
