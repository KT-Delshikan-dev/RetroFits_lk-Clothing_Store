const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Product = require('../backend/models/Product');

async function migrateData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Women -> Female
    const womenUpdate = await Product.updateMany(
      { category: { $regex: /^women$/i } },
      { $set: { category: 'Female' } }
    );
    console.log(`Updated ${womenUpdate.modifiedCount} products from Women to Female`);

    // 2. Streetwear -> Men (or other)
    const streetwearUpdate = await Product.updateMany(
      { category: { $regex: /^streetwear$/i } },
      { $set: { category: 'Men', subCategory: 'Other' } }
    );
    console.log(`Updated ${streetwearUpdate.modifiedCount} products from Streetwear to Men`);

    // 3. Sale -> Men
    const saleUpdate = await Product.updateMany(
      { category: { $regex: /^sale$/i } },
      { $set: { category: 'Men', subCategory: 'Other' } }
    );
    console.log(`Updated ${saleUpdate.modifiedCount} products from Sale to Men`);

    // 4. Update sneakers/casual to Formals/Casuals
    const sneakersUpdate = await Product.updateMany(
      { subCategory: 'Sneakers' },
      { $set: { subCategory: 'Casuals' } }
    );
    console.log(`Updated ${sneakersUpdate.modifiedCount} subcategories from Sneakers to Casuals`);

    const formalUpdate = await Product.updateMany(
      { subCategory: 'Formal' },
      { $set: { subCategory: 'Formals' } }
    );
    console.log(`Updated ${formalUpdate.modifiedCount} subcategories from Formal to Formals`);

    const casualUpdate = await Product.updateMany(
      { subCategory: 'Casual' },
      { $set: { subCategory: 'Casuals' } }
    );
    console.log(`Updated ${casualUpdate.modifiedCount} subcategories from Casual to Casuals`);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
