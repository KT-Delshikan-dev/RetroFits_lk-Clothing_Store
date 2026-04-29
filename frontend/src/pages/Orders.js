import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null });
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    fetchOrders();
  }, [token, isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true);
      await axios.delete(`${process.env.REACT_APP_API_URL}/orders/${orderId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCancelModal({ show: false, orderId: null });
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Error cancelling order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order #</p>
                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image 
                            ? `${process.env.REACT_APP_UPLOAD_URL}${item.image}`
                            : 'https://via.placeholder.com/64'
                          }
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="h-16 w-16 flex-shrink-0 rounded-md border border-gray-200 flex items-center justify-center bg-gray-50">
                        <span className="text-gray-500">+{order.items.length - 3}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        LKR {order.pricing.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="btn-outline py-2"
                      >
                        {selectedOrder?.id === order.id ? 'Hide Details' : 'View Details'}
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => setCancelModal({ show: true, orderId: order.id })}
                          className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                {selectedOrder?.id === order.id && (
                  <div className="border-t px-6 py-4 bg-gray-50">
                    <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
                    
                    {/* Items List */}
                    <div className="space-y-4 mb-6">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            <img
                              src={item.image 
                                ? `${process.env.REACT_APP_UPLOAD_URL}${item.image}`
                                : 'https://via.placeholder.com/80'
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

                    {/* Delivery Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                        <p className="text-sm text-gray-600">
                          {order.deliveryAddress.name}<br />
                          {order.deliveryAddress.street}<br />
                          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}<br />
                          Phone: {order.deliveryAddress.phone}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Payment</h4>
                        <p className="text-sm text-gray-600">
                          {order.payment.method === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                        </p>
                      </div>
                    </div>

                    {/* Pricing Summary */}
                    <div className="border-t pt-4 max-w-xs ml-auto">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>LKR {order.pricing.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping</span>
                          <span>{order.pricing.shipping === 0 ? 'Free' : `LKR ${order.pricing.shipping.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                          <span>Total</span>
                          <span>LKR {order.pricing.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Cancellation Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setCancelModal({ show: false, orderId: null })}>
              <div className="absolute inset-0 bg-gray-900 opacity-75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-8 sm:pb-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-50 sm:mx-0 sm:h-12 sm:w-12 border border-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-6 sm:text-left">
                    <h3 className="text-xl leading-6 font-serif font-bold text-gray-900" id="modal-title">
                      Cancel Order?
                    </h3>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Are you sure you want to cancel this order? This action is permanent and cannot be undone. Your items will be immediately released back into our inventory.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={() => handleCancelOrder(cancelModal.orderId)}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2.5 bg-red-600 text-base font-bold text-white hover:bg-red-700 focus:outline-none sm:w-auto sm:text-sm uppercase tracking-wider"
                >
                  Confirm Cancellation
                </button>
                <button
                  type="button"
                  onClick={() => setCancelModal({ show: false, orderId: null })}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm uppercase tracking-wider"
                >
                  Nevermind
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;