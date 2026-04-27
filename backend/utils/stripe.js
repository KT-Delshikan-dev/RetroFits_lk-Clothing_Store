const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

const createPaymentIntent = async (amount, currency = 'lkr') => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured in .env');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents/smallest currency unit
      currency,
      payment_method_types: ['card'],
      metadata: { integration_check: 'accept_a_payment' }
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe PaymentIntent error:', error);
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  stripe
};
