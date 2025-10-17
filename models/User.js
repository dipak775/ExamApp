const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: { type: String, required: true },
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  role: { type: String, default: 'user' },
  classLevel: { type: Number, default: 0 },
  approvedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  // ✅ Added for email verification
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  // ✅ End of email verification code
});

const User = mongoose.model('User', userSchema);

module.exports = User;
