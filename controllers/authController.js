const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.send('⚠️ All fields required');

    // ✅ Added for data validation
    if (!validator.isEmail(email)) {
      return res.status(400).send('❌ Invalid email format.');
    }

    if (password.length < 6) {
      return res.status(400).send('❌ Password must be at least 6 characters long.');
    }
    // ✅ End of data validation

    const existing = await User.findOne({ email });
    if (existing) return res.send('⚠️ User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    // ✅ Added for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = verificationToken;
    newUser.verificationTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    // ✅ End of email verification code

    await newUser.save();

    // ✅ Added for email verification
    const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    const message = `Please verify your email by clicking on the following link: ${verificationURL}`;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Email Verification',
        message,
      });
      const fs = require('fs');
      const path = require('path');
      const signupSuccessContent = fs.readFileSync(path.join(__dirname, '..', 'views', 'SignupSuccess.html'), 'utf8');
      const finalHtml = req.app.locals.layout.replace('<!--CONTENT_PLACEHOLDER-->', signupSuccessContent);
      res.send(finalHtml);
    } catch (err) {
      console.error('❌ Error sending verification email:', err);
      newUser.verificationToken = undefined;
      newUser.verificationTokenExpires = undefined;
      await newUser.save();
      return res.status(500).send('❌ Error sending verification email.');
    }
    // ✅ End of email verification code

  } catch (err) {
    res.status(500).send('❌ Signup failed');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.send('⚠️ User not found');

    // ✅ Added for email verification
    if (!user.isVerified) {
      return res.status(401).send('❌ Please verify your email before logging in.');
    }
    // ✅ End of email verification code

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('⚠️ Invalid credentials');

    req.session.user = user;
    req.session.save((err) => {
        if (err) {
            return res.status(500).send('❌ Failed to save session');
        }
        res.redirect(user.role === 'admin' ? '/admin' : '/profile');
    });
  } catch (err) {
    res.status(500).send('❌ Login failed');
  }
};

// ✅ Added for email verification
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ 
      verificationToken: token, 
      verificationTokenExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).send('❌ Invalid or expired verification token.');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.redirect('/login?message=✅ Email verification successful. You can now log in.');
  } catch (err) {
    res.status(500).send('❌ Email verification failed.');
  }
};
// ✅ End of email verification code

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.send('⚠️ User not found');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process: ${resetURL}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      });
      res.send('✅ Password reset token sent to email.');
    } catch (err) {
      console.error('❌ Error sending password reset email:', err);
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save();
      return res.status(500).send('❌ Error sending password reset email.');
    }
  } catch (err) {
    res.status(500).send('❌ Error in forgot password.');
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ 
      passwordResetToken: token, 
      passwordResetTokenExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).send('❌ Invalid or expired password reset token.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    res.redirect('/login?message=✅ Password has been reset successfully. You can now log in.');
  } catch (err) {
    res.status(500).send('❌ Error in reset password.');
  }
};
