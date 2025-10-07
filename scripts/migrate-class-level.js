const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected for migration');

    const users = await User.find({ classLevel: { $exists: true, $ne: null } });

    for (const user of users) {
      if (typeof user.classLevel === 'number') {
        user.classLevels = [user.classLevel.toString()];
        user.classLevel = undefined; // Remove the old field
        await user.save();
        console.log(`Migrated user ${user.email}: classLevel ${user.classLevel} -> classLevels ${user.classLevels}`);
      }
    }

    console.log('Migration complete!');
    mongoose.disconnect();
  })
  .catch(err => console.error('MongoDB connection error for migration:', err));
