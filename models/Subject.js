const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: String,
  classes: [
    {
      classLevel: String,
      chapters: [String]
    }
  ]
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
