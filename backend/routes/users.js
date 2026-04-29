const express = require('express');
const { body, validationResult } = require('express-validator');
const userRepository = require('../repositories/userRepository');
const { protect, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { users, total } = await userRepository.list({ role, limit: parseInt(limit), offset });

    res.json({
      success: true,
      data: users.map(user => {
          const u = { ...user };
          delete u.password;
          return u;
      }),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await userRepository.getById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    delete user.password;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/users/addresses
// @desc    Add/update user address
// @access  Private
router.put('/addresses', protect, [
  body('label').trim().notEmpty().withMessage('Address label is required'),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zipCode').trim().notEmpty().withMessage('Zip code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { label, street, city, state, zipCode, country, isDefault } = req.body;
    const user = await userRepository.getById(req.user.id);

    const addresses = [...(user.addresses || [])];
    const existingIndex = addresses.findIndex(a => a.label === label);
    
    const newAddress = {
      label,
      street,
      city,
      state,
      zipCode,
      country: country || 'Sri Lanka',
      isDefault: isDefault || false
    };

    if (existingIndex >= 0) {
      addresses[existingIndex] = newAddress;
    } else {
      addresses.push(newAddress);
    }

    if (isDefault) {
      addresses.forEach((addr, idx) => {
        if (idx !== (existingIndex >= 0 ? existingIndex : addresses.length - 1)) {
          addr.isDefault = false;
        }
      });
    }

    await userRepository.update(req.user.id, { addresses });

    res.json({
      success: true,
      message: 'Address saved successfully',
      data: addresses
    });
  } catch (error) {
    console.error('Save address error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/users/addresses/:label
// @desc    Delete user address
// @access  Private
router.delete('/addresses/:label', protect, async (req, res) => {
  try {
    const user = await userRepository.getById(req.user.id);
    
    const addresses = [...(user.addresses || [])];
    const addressIndex = addresses.findIndex(a => a.label === req.params.label);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    addresses.splice(addressIndex, 1);
    await userRepository.update(req.user.id, { addresses });

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await userRepository.getById(req.user.id);

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await userRepository.update(req.user.id, { password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/users/cards
// @desc    Add/update user card
// @access  Private
router.put('/cards', protect, [
  body('cardHolder').trim().notEmpty().withMessage('Card holder name is required'),
  body('cardNumber').trim().notEmpty().withMessage('Card number is required'),
  body('expiryDate').trim().notEmpty().withMessage('Expiry date is required'),
  body('cardType').trim().notEmpty().withMessage('Card type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { cardHolder, cardNumber, expiryDate, cardType, isDefault } = req.body;
    const user = await userRepository.getById(req.user.id);

    const savedCards = [...(user.savedCards || [])];
    const maskedNumber = cardNumber.replace(/\s/g, '');
    const displayCardNumber = `**** **** **** ${maskedNumber.slice(-4)}`;

    const existingIndex = savedCards.findIndex(c => c.cardNumber.endsWith(maskedNumber.slice(-4)));
    
    const newCard = {
      cardHolder,
      cardNumber: displayCardNumber,
      expiryDate,
      cardType,
      isDefault: isDefault || false
    };

    if (existingIndex >= 0) {
      savedCards[existingIndex] = newCard;
    } else {
      savedCards.push(newCard);
    }

    if (isDefault) {
      savedCards.forEach((c, idx) => {
        if (idx !== (existingIndex >= 0 ? existingIndex : savedCards.length - 1)) {
          c.isDefault = false;
        }
      });
    }

    await userRepository.update(req.user.id, { savedCards });

    res.json({
      success: true,
      message: 'Card saved successfully',
      data: savedCards
    });
  } catch (error) {
    console.error('Save card error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/users/cards/:cardNumber
// @desc    Delete user card
// @access  Private
router.delete('/cards/:cardNumber', protect, async (req, res) => {
  try {
    const user = await userRepository.getById(req.user.id);
    
    const savedCards = [...(user.savedCards || [])];
    const cardIndex = savedCards.findIndex(c => c.cardNumber === req.params.cardNumber);
    
    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    savedCards.splice(cardIndex, 1);
    await userRepository.update(req.user.id, { savedCards });

    res.json({
      success: true,
      message: 'Card deleted successfully',
      data: savedCards
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user role
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), [
  body('role').isIn(['user', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { role } = req.body;
    const user = await userRepository.getById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await userRepository.update(req.params.id, { role });
    delete updatedUser.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await userRepository.getById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting oneself
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }

    // Prevent deleting oneself
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }

    await userRepository.delete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;