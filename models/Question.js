const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  classLevels: [String],   // multi-class
  subjectName: String,
  chapterName: String,
  questionText: String,
  options: [String],
  answer: String,
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;