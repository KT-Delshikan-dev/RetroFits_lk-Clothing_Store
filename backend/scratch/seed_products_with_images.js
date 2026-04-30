const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID;
const colId = process.env.APPWRITE_COLLECTION_PRODUCTS;

const productsWithImages = [
    {
        name: "Premium Linen Azure Shirt",
        description: "Experience ultimate comfort with our premium azure blue linen shirt. Tailored for a modern yet relaxed silhouette.",
        price: 5200,
        originalPrice: 6500,
        category: "Men",
        subCategory: "Premium",
        images: JSON.stringify([{ url: "/uploads/mens_shirt.png", alt: "Premium Linen Azure Shirt" }]),
        sizes: JSON.stringify([{ name: "M", stock: 25 }, { name: "L", stock: 20 }, { name: "XL", stock: 15 }]),
        colors: JSON.stringify([{ name: "Azure Blue", hex: "#007FFF" }]),
        stock: 60,
        tags: JSON.stringify(["linen", "premium", "men", "shirt"]),
        featured: true,
        isActive: true
    },
    {
        name: "Botanical Garden Floral Dress",
        description: "A stunning floral dress featuring a botanical print on pure silk. Perfect for garden parties and summer events.",
        price: 8900,
        originalPrice: 12000,
        category: "Women",
        subCategory: "Dresses",
        images: JSON.stringify([{ url: "/uploads/womens_dress.png", alt: "Botanical Garden Floral Dress" }]),
        sizes: JSON.stringify([{ name: "S", stock: 15 }, { name: "M", stock: 20 }, { name: "L", stock: 10 }]),
        colors: JSON.stringify([{ name: "Floral Mix", hex: "#FF69B4" }]),
        stock: 45,
        tags: JSON.stringify(["dress", "floral", "women", "summer"]),
        featured: true,
        isActive: true
    },
    {
        name: "National Elite Football Jersey",
        description: "Official elite edition national jersey. Engineered with breathable mesh and moisture-wicking technology.",
        price: 3800,
        originalPrice: 3800,
        category: "Jerseys",
        subCategory: "National",
        images: JSON.stringify([{ url: "/uploads/jersey.png", alt: "National Elite Football Jersey" }]),
        sizes: JSON.stringify([{ name: "S", stock: 30 }, { name: "M", stock: 40 }, { name: "L", stock: 30 }, { name: "XL", stock: 20 }]),
        colors: JSON.stringify([{ name: "Gold/Green", hex: "#FFD700" }]),
        stock: 120,
        tags: JSON.stringify(["jersey", "football", "national", "sports"]),
        featured: true,
        isActive: true
    }
];

async function seed() {
    try {
        console.log("Adding products with real images...");
        for (const p of productsWithImages) {
            console.log(`Creating: ${p.name}`);
            await databases.createDocument(dbId, colId, ID.unique(), p);
        }
        console.log("Products with images added successfully!");
    } catch (error) {
        console.error("Failed to add products:", error.message);
    }
}

seed();
