const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Note = require('../models/Note');

const addJavaNote = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for adding note.');

    const newNote = new Note({
      classLevels: ['10'],
      subjectName: 'Java',
      chapterName: 'Introduction to Java',
      content: `
        <h2>Introduction to Java</h2>
        <p>Java is a high-level, class-based, object-oriented programming language that is designed to have as few implementation dependencies as possible.</p>
        <p>It is a general-purpose programming language intended to let application developers write once, run anywhere (WORA), meaning that compiled Java code can run on all platforms that support Java without the need for recompilation.</p>
        <h3>Key Concepts:</h3>
        <ul>
          <li><b>Platform Independent:</b> Achieved through the Java Virtual Machine (JVM).</li>
          <li><b>Object-Oriented:</b> Everything in Java is an object (almost).</li>
          <li><b>Simple:</b> Easy to learn if you understand OOP concepts.</li>
          <li><b>Secure:</b> Features for secure application development.</li>
          <li><b>Robust:</b> Strong memory management and exception handling.</li>
        </ul>
        <p>This note covers the very basics. For more details, refer to official Java documentation.</p>
      `,
    });

    await newNote.save();
    console.log('Java Introduction note added successfully!');
  } catch (err) {
    console.error('Error adding Java note:', err);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

addJavaNote();
