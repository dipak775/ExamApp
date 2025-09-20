const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: String,
  classLevels: [String],  // e.g. ["9","10"]
  chapters: [String]      // list of chapters
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
