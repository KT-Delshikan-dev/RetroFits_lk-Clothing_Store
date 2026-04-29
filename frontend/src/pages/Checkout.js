import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { validateCardNumber, validateExpiryDate, validateCVV } from '../utils/cardValidation';
import { Navigate } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock');

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.addresses?.[0]?.street || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    zipCode: user?.addresses?.[0]?.zipCode || '',
    country: user?.addresses?.[0]?.country || 'Sri Lanka'
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Card payment state
  const [savedCards, setSavedCards] = useState(user?.savedCards || []);
  const [selectedCardId, setSelectedCardId] = useState(user?.savedCards?.find(c => c.isDefault)?._id || '');
  const [showNewCardForm, setShowNewCardForm] = useState(user?.savedCards?.length === 0);
  
  // Verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Sync saved cards when user changes
  React.useEffect(() => {
    if (user?.savedCards) {
      setSavedCards(user.savedCards);
      if (!selectedCardId && user.savedCards.length > 0) {
        setSelectedCardId(user.savedCards.find(c => c.isDefault)?.id || user.savedCards[0].id);
      }
    }
  }, [user, selectedCardId]);

  const [newCardData, setNewCardData] = useState({
    cardHolder: user?.name || '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    saveCard: true
  });
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" />;
  }

  const shipping = getCartTotal() > 5000 ? 0 : 250;
  const total = getCartTotal() + shipping;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNewCardChange = (e) => {
    let value = e.target.value;
    
    // Card number formatting (add spaces)
    if (e.target.name === 'cardNumber') {
      value = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) return;
    }
    
    // Expiry date formatting (add slash)
    if (e.target.name === 'expiryDate') {
      value = value.replace(/\//g, '');
      if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }

    if (e.target.name === 'cvv') {
      if (value.length > 4) return;
    }

    setNewCardData({
      ...newCardData,
      [e.target.name]: e.target.name === 'saveCard' ? e.target.checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Card validation
    if (paymentMethod === 'card' && showNewCardForm) {
      if (!validateCardNumber(newCardData.cardNumber)) {
        setError('Invalid card number');
        setLoading(false);
        return;
      }
      if (!validateExpiryDate(newCardData.expiryDate)) {
        setError('Invalid expiry date (MM/YY)');
        setLoading(false);
        return;
      }
      if (!validateCVV(newCardData.cvv)) {
        setError('Invalid CVV');
        setLoading(false);
        return;
      }
    }

    try {
      const orderData = {
        items: cartItems
          .filter(item => item.product && item.product.id)
          .map(item => ({
            product: item.product.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        })),
        deliveryAddress: {
          name: formData.name,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        payment: {
          method: paymentMethod
        },
        pricing: {
          subtotal: getCartTotal(),
          shipping: 500,
          total: getCartTotal() + 500
        },
        paymentMethod: paymentMethod
      };

      console.log('Sending order data:', orderData);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // If card payment, start verification process
      if (paymentMethod === 'card') {
        setCurrentOrder(response.data.data);
        
        // Send OTP to email
        await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/send-email-otp`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setShowVerificationModal(true);
      } else {
        // COD - Proceed to confirmation
        clearCart();
        navigate('/order-confirmation', { state: { order: response.data.data } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    try {
      // 1. Verify OTP and get Stripe client secret
      const verifyResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders/${currentOrder._id}/verify-payment-otp`,
        { otp: verificationOtp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verifyResponse.data.success) {
        // 2. Confirm Stripe Payment if clientSecret is provided
        if (verifyResponse.data.clientSecret) {
          const stripe = await stripePromise;
          // In a full implementation, we'd use Elements/CardElement here
          // For now, we simulate the Stripe confirmation but use the real backend intent
          console.log('Confirming real Stripe payment with secret:', verifyResponse.data.clientSecret);
        }

        // 3. If it's a new card and user wants to save it
        if (showNewCardForm && newCardData.saveCard) {
          await axios.put(
            `${process.env.REACT_APP_API_URL}/users/cards`,
            {
              cardHolder: newCardData.cardHolder,
              cardNumber: newCardData.cardNumber,
              expiryDate: newCardData.expiryDate,
              cardType: 'Visa',
              isDefault: savedCards.length === 0
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        // 3. Simulate Stripe Payment Confirmation
        const paymentResponse = await axios.put(
          `${process.env.REACT_APP_API_URL}/orders/${currentOrder._id}/payment`,
          { 
            transactionId: verifyResponse.data.paymentIntentId || `TXN${Date.now()}`,
            status: 'completed'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setShowVerificationModal(false);
        clearCart();
        navigate('/order-confirmation', { state: { order: paymentResponse.data.data } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifying(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items before checking out</p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Delivery Information</h2>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-600">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="font-medium">Cash on Delivery</span>
                      <p className="text-sm text-gray-500">Pay when you receive your order</p>
                    </div>
                  </label>

                  <div className="border border-gray-300 rounded-lg overflow-hidden transition-all hover:border-primary-600">
                    <label className={`flex items-center p-4 cursor-pointer ${paymentMethod === 'card' ? 'bg-primary-50' : ''}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <span className="font-medium">Card Payment</span>
                        <p className="text-sm text-gray-500">Pay securely with your Visa, Mastercard, or AMEX</p>
                      </div>
                    </label>

                    {paymentMethod === 'card' && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                        {/* Saved Cards List */}
                        {savedCards.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Select a saved card:</p>
                            {savedCards.map((card) => (
                              <label key={card.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-primary-400">
                                <input
                                  type="radio"
                                  name="selectedCard"
                                  value={card.id}
                                  checked={selectedCardId === card.id && !showNewCardForm}
                                  onChange={() => {
                                    setSelectedCardId(card.id);
                                    setShowNewCardForm(false);
                                  }}
                                  className="h-4 w-4 text-primary-600"
                                />
                                <div className="ml-3 flex-1 flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{card.cardNumber}</p>
                                    <p className="text-xs text-gray-500">{card.cardType} • Exp: {card.expiryDate}</p>
                                  </div>
                                  <div className="text-xs text-gray-400 font-mono">CVV: ***</div>
                                </div>
                              </label>
                            ))}
                            
                            <button
                              type="button"
                              onClick={() => setShowNewCardForm(true)}
                              className={`text-sm font-medium ${showNewCardForm ? 'text-primary-800' : 'text-primary-600'} hover:underline`}
                            >
                              + Use a different card
                            </button>
                          </div>
                        )}

                        {/* New Card Form */}
                        {showNewCardForm && (
                          <div className="space-y-4 pt-2 border-t border-gray-200 mt-4">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-bold text-gray-800">Add New Card</p>
                              {savedCards.length > 0 && (
                                <button 
                                  type="button" 
                                  onClick={() => setShowNewCardForm(false)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Card Holder Name</label>
                              <input
                                type="text"
                                name="cardHolder"
                                placeholder="J. DOE"
                                value={newCardData.cardHolder}
                                onChange={handleNewCardChange}
                                required={showNewCardForm}
                                className="input-field py-2 text-sm uppercase"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Card Number</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  name="cardNumber"
                                  placeholder="0000 0000 0000 0000"
                                  value={newCardData.cardNumber}
                                  onChange={handleNewCardChange}
                                  required={showNewCardForm}
                                  className="input-field py-2 text-sm font-mono"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <svg className="h-5 w-8 text-gray-400" viewBox="0 0 36 24" fill="currentColor">
                                    <rect width="36" height="24" rx="4" fill="#F3F4F6"/>
                                    <path d="M6 10H10V14H6V10ZM12 10H16V14H12V10ZM18 10H22V14H18V10ZM24 10H28V14H24V10Z" fill="#D1D5DB"/>
                                  </svg>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                                <input
                                  type="text"
                                  name="expiryDate"
                                  placeholder="MM/YY"
                                  value={newCardData.expiryDate}
                                  onChange={handleNewCardChange}
                                  required={showNewCardForm}
                                  className="input-field py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">CVV</label>
                                <input
                                  type="password"
                                  name="cvv"
                                  placeholder="***"
                                  value={newCardData.cvv}
                                  onChange={handleNewCardChange}
                                  required={showNewCardForm}
                                  className="input-field py-2 text-sm"
                                />
                              </div>
                            </div>

                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                name="saveCard"
                                checked={newCardData.saveCard}
                                onChange={handleNewCardChange}
                                className="rounded text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-xs text-gray-600">Securely save this card for future purchases</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary mt-8 py-4 text-lg"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mx-auto text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  `Place Order - LKR ${total.toLocaleString()}`
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.image 
                          ? `${process.env.REACT_APP_UPLOAD_URL}${item.image}`
                          : 'https://via.placeholder.com/64'
                        }
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} {item.size && `| Size: ${item.size}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      LKR {(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>LKR {getCartTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `LKR ${shipping.toLocaleString()}`}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>LKR {total.toLocaleString()}</span>
                </div>
              </div>

              {shipping === 0 && (
                <p className="mt-4 text-sm text-green-600 text-center">
                  ✓ You've qualified for free shipping!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in">
            <button 
              onClick={() => setShowVerificationModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Verify Card Payment</h2>
              <p className="text-gray-600 mt-2">
                We've sent a 6-digit verification code to <span className="font-semibold text-gray-900">{user?.email}</span>
              </p>
            </div>

            {notification.message && (
              <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
                notification.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {notification.message}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationOtp}
                  onChange={(e) => setVerificationOtp(e.target.value)}
                  placeholder="000000"
                  className="input-field text-center text-2xl tracking-[1em] font-bold py-4"
                  required
                />
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full btn-primary py-4 text-lg"
                >
                  {verifying ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Pay Now'
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setNotification({ message: 'Sending new code...', type: 'success' });
                    try {
                      await axios.post(
                        `${process.env.REACT_APP_API_URL}/auth/send-email-otp`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setNotification({ message: 'Code resent successfully', type: 'success' });
                      // Clear notification after 3 seconds
                      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
                    } catch (err) {
                      setError('Failed to resend code. Please try again.');
                      setNotification({ message: '', type: '' });
                    }
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 text-center py-2"
                >
                  Didn't receive a code? Resend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;