const { Client, Databases, ID } = require('node-appwrite');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID;
const colId = process.env.APPWRITE_COLLECTION_USERS;

async function createUser(name, email, password, role) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userData = {
        name,
        email,
        password: hashedPassword,
        role,
        addresses: JSON.stringify([]),
        savedCards: JSON.stringify([])
    };

    return await databases.createDocument(dbId, colId, ID.unique(), userData);
}

async function run() {
    try {
        console.log("Creating Admin and Users...");
        
        const admin = await createUser("Admin User", "admin@retrofits.lk", "admin123", "admin");
        console.log(`Admin created: ${admin.email}`);
        
        const user1 = await createUser("John Doe", "john@example.com", "user123", "user");
        console.log(`User 1 created: ${user1.email}`);
        
        const user2 = await createUser("Jane Smith", "jane@example.com", "user123", "user");
        console.log(`User 2 created: ${user2.email}`);
        
        console.log("All users created successfully!");
    } catch (error) {
        console.error("Error creating users:", error.message);
    }
}

run();
