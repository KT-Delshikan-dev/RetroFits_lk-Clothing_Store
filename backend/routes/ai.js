const express = require('express');
const axios = require('axios');
const productRepository = require('../repositories/productRepository');
const orderRepository = require('../repositories/orderRepository');
const { databases, DB_ID, COLLECTIONS } = require('../utils/appwrite');
const { Query } = require('node-appwrite');

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @route   POST /api/ai-search
// @desc    NLP-based product search
// @access  Public
router.post('/ai-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    // 1. Call Python ML Service to extract keywords
    let mlResponse;
    try {
      mlResponse = await axios.post(`${ML_SERVICE_URL}/search`, { query });
    } catch (error) {
      console.error('ML Service Error:', error.message);
      // Fallback to simple split if ML service is down
      mlResponse = { data: { keywords: query.split(' '), category: null } };
    }

    const { keywords, category } = mlResponse.data;

    // 2. Build Appwrite Query
    const queries = [Query.equal('isActive', true)];

    if (category) {
      queries.push(Query.equal('category', category));
    }

    // Appwrite search works best on one attribute at a time or composite indexes.
    // We'll use the search keyword if available.
    if (keywords && keywords.length > 0) {
      // Appwrite's Query.search works on full-text indexed attributes.
      // Assuming 'name' or a composite 'searchableText' attribute is indexed.
      queries.push(Query.search('name', keywords.join(' ')));
    }

    // 3. Execute Query
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
        ...queries,
        Query.limit(20)
    ]);

    const products = response.documents.map(doc => {
        const p = { ...doc, id: doc.$id };
        if (typeof p.sizes === 'string') try { p.sizes = JSON.parse(p.sizes); } catch(e){}
        if (typeof p.colors === 'string') try { p.colors = JSON.parse(p.colors); } catch(e){}
        if (typeof p.images === 'string') try { p.images = JSON.parse(p.images); } catch(e){}
        return p;
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: 1,
        limit: 20,
        total: response.total,
        pages: Math.ceil(response.total / 20)
      },
      ai_metadata: {
        keywords,
        category
      }
    });
  } catch (error) {
    console.error('AI Search Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/chat
// @desc    AI Chatbot interaction
// @access  Public
router.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    // 1. Call Python ML Service for intent detection
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/chat`, { query });
    const { intent, response, suggestion, keywords, order_id, category } = mlResponse.data;

    let products = [];
    let extraData = {};
    let finalResponse = response;

    // 2. Handle Intents
    if (intent === 'order_status' && order_id) {
      // Fetch order by orderNumber
      const orderResponse = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
          Query.equal('orderNumber', order_id)
      ]);
      
      if (orderResponse.total > 0) {
        const order = orderResponse.documents[0];
        const mappedOrder = { ...order, id: order.$id };
        // Map JSON strings back
        if (typeof mappedOrder.deliveryAddress === 'string') try { mappedOrder.deliveryAddress = JSON.parse(mappedOrder.deliveryAddress); } catch(e){}
        if (typeof mappedOrder.pricing === 'string') try { mappedOrder.pricing = JSON.parse(mappedOrder.pricing); } catch(e){}
        
        extraData.order = mappedOrder;
        finalResponse = `Order Found! Your order #${mappedOrder.orderNumber} is currently ${mappedOrder.status.toUpperCase()}. (Placed on ${new Date(mappedOrder.$createdAt).toLocaleDateString()})`;
      } else {
        finalResponse = `I couldn't find an order with ID "${order_id}". Please double-check your order number.`;
      }
    } 
    else if (intent === 'availability' || intent === 'search' || suggestion) {
      const productQueries = [Query.equal('isActive', true)];
      
      if (suggestion) {
          productQueries.push(Query.equal('category', suggestion));
      } else if (keywords && keywords.length > 0) {
          productQueries.push(Query.search('name', keywords.join(' ')));
          if (category) {
              productQueries.push(Query.equal('category', category));
          }
      }

      const pResponse = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          ...productQueries,
          Query.limit(3)
      ]);
      
      products = pResponse.documents.map(doc => {
          const p = { ...doc, id: doc.$id };
          if (typeof p.images === 'string') try { p.images = JSON.parse(p.images); } catch(e){}
          return p;
      });

      if (products.length === 0 && intent === 'availability') {
        finalResponse = `I'm sorry, we don't seem to have that item in stock right now. Would you like to see something else?`;
      }
    }

    res.json({
      success: true,
      intent,
      response: finalResponse,
      suggestion,
      products,
      ...extraData
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
