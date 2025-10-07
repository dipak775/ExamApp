const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Note = require('../models/Note');

dotenv.config({ path: '../.env' });

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    const notes = await Note.find({});
    console.log(notes);
    mongoose.disconnect();
  })
  .catch((err) => console.error('❌ MongoDB Error:', err));
