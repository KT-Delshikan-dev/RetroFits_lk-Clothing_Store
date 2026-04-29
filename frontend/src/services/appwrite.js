import { Client, Databases, Account, Storage } from 'appwrite';

/**
 * Appwrite Frontend Service
 * Connects the React application to the Appwrite backend.
 */

const client = new Client();

const ENDPOINT = process.env.REACT_APP_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID || 'PROJECT_ID';

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client);
export const storage = new Storage(client);

// Replace with your actual IDs
export const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID || 'DATABASE_ID';
export const COLLECTIONS = {
    PRODUCTS: process.env.REACT_APP_APPWRITE_COLLECTION_PRODUCTS || 'COLLECTION_ID_PRODUCTS',
    USERS: process.env.REACT_APP_APPWRITE_COLLECTION_USERS || 'COLLECTION_ID_USERS',
    ORDERS: process.env.REACT_APP_APPWRITE_COLLECTION_ORDERS || 'COLLECTION_ID_ORDERS',
};

export default client;
