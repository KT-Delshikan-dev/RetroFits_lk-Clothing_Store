const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID;
const colId = process.env.APPWRITE_COLLECTION_PRODUCTS;

const dummyProducts = [
    {
        name: "Premium Linen Summer Shirt",
        description: "Breathable 100% pure linen shirt in a relaxed fit. Perfect for tropical climates and summer outings.",
        price: 4500,
        originalPrice: 5500,
        category: "Men",
        subCategory: "Casual Wear",
        images: JSON.stringify([{ url: "/uploads/sample-shirt.jpg", alt: "Linen Shirt" }]),
        sizes: JSON.stringify([{ name: "S", stock: 10 }, { name: "M", stock: 15 }, { name: "L", stock: 5 }]),
        colors: JSON.stringify([{ name: "Sky Blue", hex: "#87CEEB" }, { name: "White", hex: "#FFFFFF" }]),
        stock: 30,
        tags: JSON.stringify(["linen", "summer", "shirt", "casual"]),
        featured: true,
        isActive: true,
        excludeFromNewArrivals: false
    },
    {
        name: "Vintage High-Waist Flare Jeans",
        description: "Classic 70s inspired flare jeans with a flattering high-waist cut. Premium stretch denim for all-day comfort.",
        price: 6800,
        originalPrice: 8500,
        category: "Women",
        subCategory: "Denim",
        images: JSON.stringify([{ url: "/uploads/sample-jeans.jpg", alt: "Flare Jeans" }]),
        sizes: JSON.stringify([{ name: "28", stock: 8 }, { name: "30", stock: 12 }, { name: "32", stock: 10 }]),
        colors: JSON.stringify([{ name: "Vintage Blue", hex: "#4682B4" }]),
        stock: 30,
        tags: JSON.stringify(["vintage", "denim", "jeans", "women"]),
        featured: true,
        isActive: true,
        excludeFromNewArrivals: false
    },
    {
        name: "National Jersey - Home Edition",
        description: "Official national team home jersey. Moisture-wicking fabric with embroidered crest and premium finishing.",
        price: 3200,
        originalPrice: 3200,
        category: "Jerseys",
        subCategory: "National",
        images: JSON.stringify([{ url: "/uploads/sample-jersey.jpg", alt: "National Jersey" }]),
        sizes: JSON.stringify([{ name: "S", stock: 20 }, { name: "M", stock: 25 }, { name: "L", stock: 20 }, { name: "XL", stock: 15 }]),
        colors: JSON.stringify([{ name: "National Colors", hex: "#FFD700" }]),
        stock: 80,
        tags: JSON.stringify(["jersey", "national", "sports", "football"]),
        featured: true,
        isActive: true,
        excludeFromNewArrivals: false
    },
    {
        name: "Urban Minimalist Backpack",
        description: "Sleek, water-resistant backpack with a 15-inch laptop compartment. Ideal for daily commute and university.",
        price: 5200,
        originalPrice: 7000,
        category: "Accessories",
        subCategory: "Bags",
        images: JSON.stringify([{ url: "/uploads/sample-bag.jpg", alt: "Backpack" }]),
        sizes: JSON.stringify([{ name: "One Size", stock: 50 }]),
        colors: JSON.stringify([{ name: "Charcoal Gray", hex: "#36454F" }, { name: "Matte Black", hex: "#000000" }]),
        stock: 50,
        tags: JSON.stringify(["backpack", "accessories", "urban", "travel"]),
        featured: false,
        isActive: true,
        excludeFromNewArrivals: false
    },
    {
        name: "Retro Graphic Oversized Tee",
        description: "Heavyweight cotton oversized t-shirt featuring a retro synthwave graphic print. Streetwear essential.",
        price: 2800,
        originalPrice: 3500,
        category: "Men",
        subCategory: "Streetwear",
        images: JSON.stringify([{ url: "/uploads/sample-tee.jpg", alt: "Graphic Tee" }]),
        sizes: JSON.stringify([{ name: "M", stock: 30 }, { name: "L", stock: 30 }, { name: "XL", stock: 20 }]),
        colors: JSON.stringify([{ name: "Midnight Black", hex: "#191970" }]),
        stock: 80,
        tags: JSON.stringify(["oversized", "tee", "streetwear", "graphic"]),
        featured: true,
        isActive: true,
        excludeFromNewArrivals: false
    }
];

async function seedProducts() {
    try {
        console.log("Starting to seed dummy products...");
        for (const product of dummyProducts) {
            console.log(`Creating product: ${product.name}`);
            await databases.createDocument(dbId, colId, ID.unique(), product);
        }
        console.log("Successfully seeded 5 dummy products!");
    } catch (error) {
        console.error("Seeding failed:", error.message);
    }
}

seedProducts();
