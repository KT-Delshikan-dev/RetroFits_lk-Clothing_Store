const { Client, Databases, Users, Storage, InputFile } = require('node-appwrite');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);
const storage = new Storage(client);

const DB_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTIONS = {
    PRODUCTS: process.env.APPWRITE_COLLECTION_PRODUCTS,
    USERS: process.env.APPWRITE_COLLECTION_USERS,
    ORDERS: process.env.APPWRITE_COLLECTION_ORDERS,
};

module.exports = {
    client,
    databases,
    users,
    storage,
    DB_ID,
    COLLECTIONS,
    InputFile
};
