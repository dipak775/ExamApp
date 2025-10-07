const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  classLevel: { type: Number, default: 0 },
  approvedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
