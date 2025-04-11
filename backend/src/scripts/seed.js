const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUserEmail = 'intern@dacoid.com';
const seedUserPassword = 'Test123'; // Plain password

async function seed() {
  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user by email
    let user = await User.findOne({ email: seedUserEmail });

    if (user) {
      console.log('Test user found. Updating password...');
      user.password = seedUserPassword; // Set plain password
    } else {
      console.log('Test user not found. Creating new user...');
      // Create test user with plain password
      user = new User({
        email: seedUserEmail,
        password: seedUserPassword // Set plain password
      });
    }

    // Save the user (new or updated) - pre-save hook will hash the password
    await user.save();
    console.log('Test user created/updated successfully (password hashed by model)');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1; // Indicate error
  } finally {
    // Ensure disconnection
    if (mongoose.connection.readyState === 1) { // 1 === connected
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        } catch (e) {
            console.error('Error disconnecting from MongoDB:', e);
        }
    }
    process.exit(process.exitCode || 0);
  }
}

seed(); 