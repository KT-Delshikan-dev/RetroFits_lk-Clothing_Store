import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderConfirmation = () => {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No order found</h2>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600">
              Thank you for shopping with Retrofits LK
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-wrap justify-between items-center mb-6 pb-6 border-b">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Order Date</p>
                <p className="text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.image 
                          ? `${process.env.REACT_APP_UPLOAD_URL}${item.image}`
                          : 'https://via.placeholder.com/64'
                        }
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} {item.size && `| Size: ${item.size}`}
                        {item.color && ` | Color: ${item.color}`}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Delivery Address</h3>
                <p className="text-gray-600">
                  {order.deliveryAddress.name}<br />
                  {order.deliveryAddress.street}<br />
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}<br />
                  {order.deliveryAddress.country}<br />
                  Phone: {order.deliveryAddress.phone}
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Payment Method</h3>
                <p className="text-gray-600">
                  {order.payment.method === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>LKR {order.pricing?.subtotal?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.pricing?.shipping === 0 ? 'Free' : `LKR ${order.pricing?.shipping?.toLocaleString() || '0'}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>LKR {order.pricing?.total?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/orders" className="btn-outline text-center">
              View Order History
            </Link>
            <Link to="/products" className="btn-primary text-center">
              Continue Shopping
            </Link>
          </div>

          {/* Info Message */}
          <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-center">
            <p className="font-medium">A confirmation SMS has been sent to your phone.</p>
            <p className="text-sm mt-1">You can track your order status in the "My Orders" section.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;