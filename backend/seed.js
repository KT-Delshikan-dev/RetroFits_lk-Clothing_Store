const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@retrofits.lk',
      password: 'admin123',
      phone: '+94 77 123 4567',
      role: 'admin',
      addresses: [{
        label: 'Home',
        street: '123 Admin Street',
        city: 'Colombo',
        state: 'Western',
        zipCode: '00100',
        country: 'Sri Lanka',
        isDefault: true
      }]
    });

    // Create regular user
    const user = await User.create({
      name: 'John Doe',
      email: 'user@retrofits.lk',
      password: 'user123',
      phone: '+94 77 765 4321',
      role: 'user',
      addresses: [{
        label: 'Home',
        street: '456 User Avenue',
        city: 'Kandy',
        state: 'Central',
        zipCode: '20000',
        country: 'Sri Lanka',
        isDefault: true
      }]
    });

    console.log('Created users');

    // Create sample products
    const products = [
      {
        name: 'Vintage Denim Jacket',
        description: 'Classic vintage-style denim jacket with a modern fit. Features button closure, chest pockets, and side pockets. Perfect for layering over any outfit.',
        price: 8500,
        originalPrice: 12000,
        category: 'Men',
        sizes: [
          { name: 'S', available: true },
          { name: 'M', available: true },
          { name: 'L', available: true },
          { name: 'XL', available: true }
        ],
        colors: [
          { name: 'Blue', hex: '#4A90D9' },
          { name: 'Black', hex: '#000000' }
        ],
        stock: 25,
        tags: ['vintage', 'denim', 'jacket', 'casual'],
        featured: true,
        images: [{ url: '/uploads/sample-denim-jacket.jpg', alt: 'Vintage Denim Jacket' }]
      },
      {
        name: 'Retro Floral Dress',
        description: 'Beautiful floral print dress inspired by 1960s fashion. Features a flattering A-line silhouette with a fitted bodice and flowing skirt.',
        price: 6500,
        originalPrice: 9000,
        category: 'Women',
        sizes: [
          { name: 'XS', available: true },
          { name: 'S', available: true },
          { name: 'M', available: true },
          { name: 'L', available: false }
        ],
        colors: [
          { name: 'Floral Pink', hex: '#FFB6C1' },
          { name: 'Floral Blue', hex: '#87CEEB' }
        ],
        stock: 18,
        tags: ['vintage', 'dress', 'floral', 'summer'],
        featured: true,
        images: [{ url: '/uploads/sample-floral-dress.jpg', alt: 'Retro Floral Dress' }]
      },
      {
        name: 'Streetwear Hoodie',
        description: 'Oversized hoodie with bold graphic print. Made from premium cotton blend for ultimate comfort. Perfect for casual streetwear looks.',
        price: 5500,
        originalPrice: null,
        category: 'Streetwear',
        sizes: [
          { name: 'M', available: true },
          { name: 'L', available: true },
          { name: 'XL', available: true },
          { name: 'XXL', available: true }
        ],
        colors: [
          { name: 'Black', hex: '#000000' },
          { name: 'Gray', hex: '#808080' },
          { name: 'White', hex: '#FFFFFF' }
        ],
        stock: 30,
        tags: ['streetwear', 'hoodie', 'casual', 'graphic'],
        featured: true,
        images: [{ url: '/uploads/sample-hoodie.jpg', alt: 'Streetwear Hoodie' }]
      },
      {
        name: 'Classic Leather Belt',
        description: 'Handcrafted genuine leather belt with vintage brass buckle. A timeless accessory that complements any outfit.',
        price: 3500,
        originalPrice: null,
        category: 'Accessories',
        sizes: [
          { name: 'One Size', available: true }
        ],
        colors: [
          { name: 'Brown', hex: '#8B4513' },
          { name: 'Black', hex: '#000000' }
        ],
        stock: 50,
        tags: ['leather', 'belt', 'accessory', 'vintage'],
        featured: false,
        images: [{ url: '/uploads/sample-belt.jpg', alt: 'Classic Leather Belt' }]
      },
      {
        name: 'Retro Sneakers',
        description: 'Classic retro-style sneakers with modern comfort technology. Features leather upper, cushioned sole, and vintage branding.',
        price: 12000,
        originalPrice: 15000,
        category: 'Footwear',
        sizes: [
          { name: 'XS', available: true },
          { name: 'S', available: true },
          { name: 'M', available: true },
          { name: 'L', available: true },
          { name: 'XL', available: true },
          { name: 'XXL', available: false }
        ],
        colors: [
          { name: 'White/Red', hex: '#FFFFFF' },
          { name: 'Black/White', hex: '#000000' }
        ],
        stock: 20,
        tags: ['sneakers', 'retro', 'footwear', 'casual'],
        featured: true,
        images: [{ url: '/uploads/sample-sneakers.jpg', alt: 'Retro Sneakers' }]
      },
      {
        name: 'Vintage Band T-Shirt',
        description: 'Soft cotton t-shirt featuring vintage band graphics. Distressed print for an authentic worn-in look.',
        price: 3500,
        originalPrice: 4500,
        category: 'Sale',
        sizes: [
          { name: 'S', available: true },
          { name: 'M', available: true },
          { name: 'L', available: true }
        ],
        colors: [
          { name: 'Black', hex: '#000000' },
          { name: 'Gray', hex: '#808080' }
        ],
        stock: 15,
        tags: ['t-shirt', 'vintage', 'band', 'graphic'],
        featured: false,
        images: [{ url: '/uploads/sample-tshirt.jpg', alt: 'Vintage Band T-Shirt' }]
      },
      {
        name: 'Men\'s Retro Striped Shirt',
        description: 'Casual button-down shirt with 70s inspired vertical stripes. Breathable fabric perfect for summer.',
        price: 4500,
        originalPrice: 6000,
        category: 'Men',
        sizes: [
          { name: 'S', available: true },
          { name: 'M', available: true },
          { name: 'L', available: true },
          { name: 'XL', available: true }
        ],
        colors: [
          { name: 'Mustard/White', hex: '#E1AD01' },
          { name: 'Navy/White', hex: '#000080' }
        ],
        stock: 40,
        tags: ['shirt', 'retro', 'striped', 'casual'],
        featured: true,
        images: [{ url: '/uploads/sample-striped-shirt.jpg', alt: 'Mens Retro Striped Shirt' }]
      },
      {
        name: 'Women\'s High-Waisted Flare Jeans',
        description: 'Authentic 70s cut flare jeans. Premium stretch denim that highlights the silhouette while remaining comfortable.',
        price: 9500,
        originalPrice: 13000,
        category: 'Women',
        sizes: [
          { name: '26', available: true },
          { name: '28', available: true },
          { name: '30', available: true },
          { name: '32', available: false }
        ],
        colors: [
          { name: 'Light Blue', hex: '#ADD8E6' },
          { name: 'Dark Wash', hex: '#00008B' }
        ],
        stock: 25,
        tags: ['jeans', 'flare', 'denim', 'vintage'],
        featured: true,
        images: [{ url: '/uploads/sample-flare-jeans.jpg', alt: 'Flare Jeans' }]
      },
      {
        name: 'Cargo Streetwear Pants',
        description: 'Utility cargo pants with oversized pockets and adjustable ankle cords.',
        price: 7500,
        originalPrice: null,
        category: 'Streetwear',
        sizes: [
          { name: 'S', available: true },
          { name: 'M', available: true },
          { name: 'L', available: true }
        ],
        colors: [
          { name: 'Olive Green', hex: '#556B2F' },
          { name: 'Black', hex: '#000000' }
        ],
        stock: 35,
        tags: ['cargo', 'pants', 'streetwear', 'utility'],
        featured: false,
        images: [{ url: '/uploads/sample-cargo-pants.jpg', alt: 'Cargo Pants' }]
      },
      {
        name: 'Vintage Round Sunglasses',
        description: 'John Lennon style round sunglasses with polarized lenses and metallic frames.',
        price: 2500,
        originalPrice: null,
        category: 'Accessories',
        sizes: [
          { name: 'One Size', available: true }
        ],
        colors: [
          { name: 'Gold/Green', hex: '#FFD700' },
          { name: 'Silver/Black', hex: '#C0C0C0' }
        ],
        stock: 60,
        tags: ['sunglasses', 'accessories', 'vintage'],
        featured: true,
        images: [{ url: '/uploads/sample-sunglasses.jpg', alt: 'Round Sunglasses' }]
      },
      {
        name: 'Chunky Platform Boots',
        description: '90s grunge inspired chunky platform boots in vegan leather.',
        price: 14000,
        originalPrice: 16000,
        category: 'Footwear',
        sizes: [
          { name: '36', available: true },
          { name: '38', available: true },
          { name: '40', available: true }
        ],
        colors: [
          { name: 'Black', hex: '#000000' },
          { name: 'Burgundy', hex: '#800020' }
        ],
        stock: 12,
        tags: ['boots', 'footwear', 'platform', 'goth'],
        featured: false,
        images: [{ url: '/uploads/sample-platform-boots.jpg', alt: 'Platform Boots' }]
      },
      {
        name: 'Y2K Crop Top',
        description: 'Rhinestone embellished crop top straight out of the year 2000.',
        price: 2000,
        originalPrice: 4500,
        category: 'Sale',
        sizes: [
          { name: 'XS', available: true },
          { name: 'S', available: true }
        ],
        colors: [
          { name: 'Pink', hex: '#FFC0CB' },
          { name: 'White', hex: '#FFFFFF' }
        ],
        stock: 5,
        tags: ['y2k', 'crop top', 'sale'],
        featured: false,
        images: [{ url: '/uploads/sample-y2k-top.jpg', alt: 'Y2K Crop Top' }]
      }
    ];

    await Product.insertMany(products);
    console.log('Created sample products');

    console.log('\n=== SEED COMPLETED ===');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@retrofits.lk / admin123');
    console.log('User: user@retrofits.lk / user123');
    console.log('\nSample products have been added to the store.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();