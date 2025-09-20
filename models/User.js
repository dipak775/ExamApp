const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  classLevel: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
