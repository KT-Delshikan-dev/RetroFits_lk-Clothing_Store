const { Query, ID } = require('node-appwrite');
const { databases, DB_ID, COLLECTIONS, users } = require('../utils/appwrite');
const bcrypt = require('bcryptjs');

const userRepository = {
    async getById(id) {
        try {
            const doc = await databases.getDocument(DB_ID, COLLECTIONS.USERS, id);
            return this._mapDocument(doc);
        } catch (error) {
            if (error.code === 404) return null;
            throw error;
        }
    },

    async getByEmail(email) {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.USERS, [
                Query.equal('email', email)
            ]);
            if (response.total === 0) return null;
            return this._mapDocument(response.documents[0]);
        } catch (error) {
            throw error;
        }
    },

    async create(data) {
        const { password, ...otherData } = data;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const preparedData = { 
            ...otherData, 
            password: hashedPassword,
            role: otherData.role || 'user'
        };

        if (preparedData.addresses) preparedData.addresses = JSON.stringify(preparedData.addresses);
        if (preparedData.savedCards) preparedData.savedCards = JSON.stringify(preparedData.savedCards);

        const doc = await databases.createDocument(DB_ID, COLLECTIONS.USERS, ID.unique(), preparedData);
        return this._mapDocument(doc);
    },

    async update(id, data) {
        const preparedData = { ...data };
        
        if (preparedData.password) {
            const salt = await bcrypt.genSalt(10);
            preparedData.password = await bcrypt.hash(preparedData.password, salt);
        }

        if (preparedData.addresses) preparedData.addresses = JSON.stringify(preparedData.addresses);
        if (preparedData.savedCards) preparedData.savedCards = JSON.stringify(preparedData.savedCards);

        const doc = await databases.updateDocument(DB_ID, COLLECTIONS.USERS, id, preparedData);
        return this._mapDocument(doc);
    },

    async list(filters = {}) {
        const queries = [];
        if (filters.role) queries.push(Query.equal('role', filters.role));
        
        queries.push(Query.limit(filters.limit || 20));
        queries.push(Query.offset(filters.offset || 0));
        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(DB_ID, COLLECTIONS.USERS, queries);
        return {
            users: response.documents.map(doc => this._mapDocument(doc)),
            total: response.total
        };
    },

    async delete(id) {
        await databases.deleteDocument(DB_ID, COLLECTIONS.USERS, id);
        return true;
    },

    _mapDocument(doc) {
        const user = { ...doc, id: doc.$id };
        delete user.$id;
        delete user.$collectionId;
        delete user.$databaseId;
        delete user.$createdAt;
        delete user.$updatedAt;
        delete user.$permissions;

        if (typeof user.addresses === 'string') {
            try { user.addresses = JSON.parse(user.addresses); } catch (e) { user.addresses = []; }
        }
        if (typeof user.savedCards === 'string') {
            try { user.savedCards = JSON.parse(user.savedCards); } catch (e) { user.savedCards = []; }
        }

        return user;
    }
};

module.exports = userRepository;
