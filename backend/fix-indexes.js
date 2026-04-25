const mongoose = require('mongoose');
require('dotenv').config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop all indexes on users collection
    const db = mongoose.connection.db;
    
    console.log('Dropping indexes on users collection...');
    await db.collection('users').dropIndexes().catch(() => {
      console.log('No indexes to drop or collection does not exist');
    });
    
    console.log('Dropping indexes on products collection...');
    await db.collection('products').dropIndexes().catch(() => {
      console.log('No indexes to drop or collection does not exist');
    });

    console.log('Indexes fixed! You can now run the seed script.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
