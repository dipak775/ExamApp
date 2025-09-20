const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.send('⚠️ All fields required');

    const existing = await User.findOne({ email });
    if (existing) return res.send('⚠️ User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    res.status(500).send('❌ Signup failed');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.send('⚠️ User not found');

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

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};
