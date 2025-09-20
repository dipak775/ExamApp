const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  classLevels: [String],
  subjectName: String,
  chapterName: String,
  content: String
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
