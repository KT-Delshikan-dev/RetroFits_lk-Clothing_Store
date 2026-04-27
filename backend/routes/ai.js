const express = require('express');
const axios = require('axios');
const Product = require('../models/Product');
const Order = require('../models/Order');
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

    // 2. Build MongoDB Query
    let mongoQuery = { isActive: true };

    if (category) {
      mongoQuery.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (keywords && keywords.length > 0) {
      // Use $and to ensure all keywords are somewhat present, or $or for broader search
      // Regex matching in name, description, and category as requested
      mongoQuery.$and = keywords.map(kw => ({
        $or: [
          { name: { $regex: kw, $options: 'i' } },
          { description: { $regex: kw, $options: 'i' } },
          { category: { $regex: kw, $options: 'i' } },
          { tags: { $regex: kw, $options: 'i' } }
        ]
      }));
    }

    // 3. Execute Query
    const products = await Product.find(mongoQuery).limit(20);
    const total = await Product.countDocuments(mongoQuery);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: 1,
        limit: 20,
        total,
        pages: Math.ceil(total / 20)
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
      const order = await Order.findOne({ orderNumber: { $regex: order_id, $options: 'i' } });
      if (order) {
        extraData.order = order;
        finalResponse = `Order Found! Your order #${order.orderNumber} is currently ${order.status.toUpperCase()}. (Placed on ${new Date(order.createdAt).toLocaleDateString()})`;
      } else {
        finalResponse = `I couldn't find an order with ID "${order_id}". Please double-check your order number.`;
      }
    } 
    else if (intent === 'availability' || intent === 'search' || suggestion) {
      let productQuery = { isActive: true };
      
      if (suggestion) {
        productQuery.$or = [
          { category: { $regex: suggestion, $options: 'i' } },
          { subCategory: { $regex: suggestion, $options: 'i' } },
          { tags: { $regex: suggestion, $options: 'i' } }
        ];
      } else if (keywords && keywords.length > 0) {
        productQuery.$and = keywords.map(kw => ({
          $or: [
            { name: { $regex: kw, $options: 'i' } },
            { description: { $regex: kw, $options: 'i' } }
          ]
        }));
        if (category) {
          productQuery.category = { $regex: category, $options: 'i' };
        }
      }

      products = await Product.find(productQuery).limit(3);
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
