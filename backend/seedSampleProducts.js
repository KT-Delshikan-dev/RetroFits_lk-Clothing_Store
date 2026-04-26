const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const sampleProducts = [
  {
    name: "Premium Black Cotton T-Shirt",
    description: "A premium quality black cotton t-shirt for men. Perfect for any casual occasion. Features a comfortable fit and durable material.",
    price: 3500,
    originalPrice: 4500,
    images: [{ url: "/uploads/sample-tshirt.png", alt: "Premium Black Cotton T-Shirt" }],
    category: "Men",
    sizes: [
      { name: "S", available: true },
      { name: "M", available: true },
      { name: "L", available: true },
      { name: "XL", available: true }
    ],
    colors: [
      { name: "Black", hex: "#000000" }
    ],
    stock: 50,
    sku: "TSH-BLK-001",
    tags: ["tshirt", "casual", "cotton", "black"],
    featured: true,
    isActive: true
  },
  {
    name: "Classic Blue Denim Jacket",
    description: "A stylish blue denim jacket for streetwear. Timeless design that never goes out of fashion. High-quality denim built to last.",
    price: 8500,
    originalPrice: 10000,
    images: [{ url: "/uploads/sample-jacket.png", alt: "Classic Blue Denim Jacket" }],
    category: "Streetwear",
    sizes: [
      { name: "M", available: true },
      { name: "L", available: true },
      { name: "XL", available: true }
    ],
    colors: [
      { name: "Blue", hex: "#1e3a8a" }
    ],
    stock: 25,
    sku: "JKT-DNM-001",
    tags: ["jacket", "denim", "streetwear", "blue"],
    featured: true,
    isActive: true
  },
  {
    name: "Elegant White Sneakers",
    description: "Elegant white sneakers footwear. Perfect for everyday use and pairs well with any outfit. Comfortable sole for all-day wear.",
    price: 6500,
    originalPrice: 8000,
    images: [{ url: "/uploads/sample-sneakers.png", alt: "Elegant White Sneakers" }],
    category: "Footwear",
    sizes: [
      { name: "8", available: true },
      { name: "9", available: true },
      { name: "10", available: true },
      { name: "11", available: true }
    ],
    colors: [
      { name: "White", hex: "#ffffff" }
    ],
    stock: 40,
    sku: "SNK-WHT-001",
    tags: ["sneakers", "footwear", "white", "casual"],
    featured: true,
    isActive: true
  }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clothing_store');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();
    
    console.log('Adding sample products...');
    await Product.insertMany(sampleProducts);
    
    console.log('Sample products imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error importing sample products: ${error.message}`);
    process.exit(1);
  }
};

importData();
