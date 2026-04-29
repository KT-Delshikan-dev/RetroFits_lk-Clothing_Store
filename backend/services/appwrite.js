const { Client, Databases, Users, Account, Storage, ID, Query } = require('node-appwrite');
require('dotenv').config();

/**
 * Appwrite Service Module
 * Initializes the Appwrite client and provides service instances.
 */

const client = new Client();

// Configuration from environment variables
const ENDPOINT = process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    console.error('Missing Appwrite configuration. Please check your .env file.');
}

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);
const account = new Account(client); // For server-side account management
const storage = new Storage(client);

// Constant IDs from env or placeholders
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'DATABASE_ID';
const COLLECTIONS = {
    PRODUCTS: process.env.APPWRITE_COLLECTION_PRODUCTS || 'COLLECTION_ID_PRODUCTS',
    USERS: process.env.APPWRITE_COLLECTION_USERS || 'COLLECTION_ID_USERS',
    ORDERS: process.env.APPWRITE_COLLECTION_ORDERS || 'COLLECTION_ID_ORDERS',
    PAYMENT: process.env.APPWRITE_COLLECTION_PAYMENT || 'COLLECTION_ID_PAYMENT',
};

module.exports = {
    client,
    databases,
    users,
    account,
    storage,
    ID,
    Query,
    DATABASE_ID,
    COLLECTIONS
};
