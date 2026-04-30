const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Product.updateMany(
      { subCategory: 'International Jerseys' },
      { $set: { subCategory: 'National' } }
    );
    console.log(`Updated ${result.modifiedCount} products from "International Jerseys" to "National"`);

    // Also update "National Team" if it exists, to be consistent with user's request for "National"
    const result2 = await Product.updateMany(
      { subCategory: 'National Team' },
      { $set: { subCategory: 'National' } }
    );
    console.log(`Updated ${result2.modifiedCount} products from "National Team" to "National"`);

    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

fix();
