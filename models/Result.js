const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  subjectName: String,
  chapterName: String,
  submittedAt: { type: Date, default: Date.now },
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;