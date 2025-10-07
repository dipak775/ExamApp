const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Subject = require('../models/Subject');

dotenv.config({ path: '../.env' });

async function migrateSubjects() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // We need to use a temporary schema to read the old data,
        // because the main Subject model has already been updated.
        const OldSubjectSchema = new mongoose.Schema({
            name: String,
            classLevels: [String],
            chapters: [String]
        });
        const OldSubject = mongoose.model('OldSubject', OldSubjectSchema, 'subjects');

        const oldSubjects = await OldSubject.find();
        console.log(`Found ${oldSubjects.length} old subject documents to migrate.`);

        const groupedSubjects = oldSubjects.reduce((acc, subject) => {
            if (!acc[subject.name]) {
                acc[subject.name] = [];
            }
            acc[subject.name].push(subject);
            return acc;
        }, {});

        const newSubjects = [];
        for (const name in groupedSubjects) {
            const classes = groupedSubjects[name].map(subject => {
                return {
                    classLevel: subject.classLevels[0], // Assuming one classLevel per old document
                    chapters: subject.chapters
                };
            });

            newSubjects.push({
                name: name,
                classes: classes
            });
        }

        await Subject.collection.drop();
        console.log('✅ Dropped old subjects collection');

        await Subject.insertMany(newSubjects);
        console.log(`✅ Inserted ${newSubjects.length} new subject documents.`);

        console.log('\n🎉 Migration completed successfully!\n');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 MongoDB Disconnected');
    }
}

migrateSubjects();
