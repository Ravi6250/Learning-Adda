import mongoose from 'mongoose';
import 'dotenv/config';

const testAppConnection = async () => {
  console.log('--- FINAL APP CONNECTION TEST ---');
  
  // This is the EXACT connection logic from your connectDB.js
  const connectionString = `${process.env.MONGODB_URI}/lms`;
  console.log('Attempting to connect using the APP METHOD:', connectionString);

  try {
    await mongoose.connect(connectionString);
    console.log('✅ SUCCESS: App connection method established.');

    const User = mongoose.model('User', new mongoose.Schema({ _id: String }));
    const hardcodedId = "user_33IZ8DYNpHrL05awhpJuNmxlGhO";
    
    console.log('Searching for hardcoded user ID:', hardcodedId);
    const userData = await User.findOne({ _id: hardcodedId });

    if (userData) {
      console.log('✅✅✅ VICTORY: User was found in the database!', userData);
    } else {
      console.error('❌❌❌ FAILURE: User was NOT found, even though connection was successful. Data or DB name is wrong.');
    }

  } catch (error) {
    console.error('❌ FAILED: There was an error connecting with the app method.');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('Mongoose connection closed.');
  }
};
testAppConnection();