const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Subject = require('../models/Subject');

dotenv.config({ path: '../.env' });

async function fixJavaSubject() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        const javaSubject = await Subject.findOne({ name: 'Java' });

        if (javaSubject) {
            const class9Exists = javaSubject.classes.some(c => c.classLevel === '9');

            if (!class9Exists) {
                console.log('Class 9 not found for Java subject. Adding it now...');
                javaSubject.classes.push({
                    classLevel: '9',
                    chapters: [
                        "Introduction to Object-Oriented Programming",
                        "Elementary Concepts of Objects and Classes",
                        "Values and Data Types",
                        "Operators in Java",
                        "Input in Java",
                        "Mathematical Library Methods",
                        "Conditional Constructs in Java",
                        "Iterative Constructs in Java",
                        "Nested for loops"
                    ]
                });
                await javaSubject.save();
                console.log('✅ Successfully added Class 9 to Java subject.');
            } else {
                console.log('✅ Class 9 already exists for Java subject. No changes needed.');
            }
        } else {
            console.log('Could not find a subject with the name "Java".');
        }

    } catch (err) {
        console.error('❌ Operation failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 MongoDB Disconnected');
    }
}

fixJavaSubject();
