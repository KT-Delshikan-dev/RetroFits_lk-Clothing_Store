import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAdmin, user, token } = useAuth();
  const [adminData, setAdminData] = useState({ orders: [], revenueData: [] });

  useEffect(() => {
    fetchFeaturedProducts();
    if (isAdmin && token) {
      fetchAdminStats();
    }
  }, [isAdmin, token]);

  const fetchAdminStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = response.data.data;
      
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const revenueByDay = last7Days.map(date => {
        const dayOrders = orders.filter(o => o.createdAt.startsWith(date) && o.status !== 'cancelled');
        const revenue = dayOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
        return { date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), revenue };
      });

      const totalRevenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

      setAdminData({ orders, revenueData: revenueByDay, totalRevenue });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/products?featured=true&limit=8`);
      setFeaturedProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`${isAdmin ? 'pt-4 pb-6' : 'pt-8 pb-12'} bg-white`}>
        <div className="container-custom">
          <div className={`relative bg-gray-950 text-white ${isAdmin ? 'min-h-[40vh]' : 'min-h-[70vh] md:min-h-[80vh]'} flex items-center rounded-[40px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] group animate-fade-in`}>
            <div className="absolute inset-0 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=900&fit=crop"
                alt="High Fashion 2026"
                className="w-full h-full object-cover transition-transform duration-[15s] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative px-8 md:px-20 py-24 md:py-32 w-full max-w-4xl">
              {isAdmin ? (
                <div className="animate-fadeIn">
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-8 backdrop-blur-md">
                    Management Console • 2026
                  </div>
                  <h1 className="text-3xl md:text-5xl font-serif font-black mb-4 leading-tight drop-shadow-2xl text-white">
                    Luxury & <span className="text-secondary-500 italic">Excellence.</span>
                  </h1>
                  <p className="text-sm md:text-base text-gray-300 mb-6 max-w-lg font-light leading-relaxed tracking-wide">
                    Welcome, {user?.name.split(' ')[0]}. Command the future of AVENZA with precision analytics and inventory mastery.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Link to="/admin" className="bg-primary-600 text-white px-10 py-5 rounded-full font-bold hover:bg-primary-700 transition-all transform hover:scale-105 text-center uppercase tracking-widest text-xs shadow-2xl">
                      Executive Dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/30 text-secondary-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-8 backdrop-blur-md">
                    Sophistication Redefined • 2026
                  </div>
                  <h1 className="text-5xl md:text-8xl font-serif font-black mb-8 leading-tight drop-shadow-2xl">
                    The Essence of<br /><span className="text-white italic opacity-90">Avenza.</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-xl font-light leading-relaxed tracking-wide">
                    Experience the fusion of exquisite tailoring and modern sophistication. 
                    Our 2026 collection celebrates the pinnacle of style with a vision for the future.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Link to="/products" className="btn-silver px-12 py-5 rounded-full uppercase tracking-widest text-xs">
                      Explore Collection
                    </Link>
                    <button className="px-12 py-5 bg-white/5 border border-white/20 text-white rounded-full uppercase tracking-widest text-xs font-bold hover:bg-white/10 transition-all backdrop-blur-sm">
                      Our Philosophy
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Visual accents */}
            <div className="absolute top-0 right-0 p-12 hidden md:block">
              <div className="w-32 h-32 border-t-2 border-r-2 border-white/10 rounded-tr-[40px]"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-secondary-500 via-primary-500 to-transparent opacity-60"></div>
          </div>
        </div>
      </section>

      {/* Featured Products or Admin Analytics */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          {isAdmin ? (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-gray-900">Executive Overview</h2>
                  <p className="text-gray-500 text-sm">Real-time performance metrics and order monitoring</p>
                </div>
                <Link to="/admin/reports" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
                  Detailed Reports
                </Link>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                  <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p>
                    <p className="text-2xl font-black text-gray-900">LKR {adminData.totalRevenue?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                  <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
                    <p className="text-2xl font-black text-gray-900">{adminData.orders.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                  <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Users</p>
                    <p className="text-2xl font-black text-gray-900">Verified</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-6 text-gray-800">Weekly Revenue (LKR)</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminData.revenueData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`LKR ${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Order Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-6 text-gray-800">Recent Order Activity</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adminData.revenueData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Orders Section - Added as requested */}
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                  <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">View All Orders</Link>
                </div>
                <div className="space-y-4">
                  {adminData.orders.filter(o => o.status === 'pending').slice(0, 5).map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:border-primary-200 transition-all">
                      <div className="flex items-center space-x-4 mb-3 md:mb-0">
                        <div className="h-10 w-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-700 font-bold">
                          {order.user?.name?.charAt(0) || 'G'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-gray-900">{order.orderNumber}</p>
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="text-sm">
                          <span className="text-gray-500">Customer:</span>
                          <span className="ml-1 font-medium">{order.user?.name || 'Guest'}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-1 font-bold">LKR {order.pricing?.total?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Items Preview - Added as requested */}
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Ordered Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                              {item.image && (
                                <img 
                                  src={`${process.env.REACT_APP_UPLOAD_URL}${item.image}`} 
                                  alt={item.name} 
                                  className="h-6 w-6 object-cover rounded mr-2"
                                />
                              )}
                              <span className="text-xs text-gray-700 font-medium">
                                {item.name} <span className="text-gray-400 ml-1">x{item.quantity}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Link to={`/admin/orders`} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                          Manage Order →
                        </Link>
                      </div>
                    </div>
                  ))}
                  {adminData.orders.filter(o => o.status === 'pending').length === 0 && (
                    <p className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      No newly arrived (pending) orders to display.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-serif font-bold">Featured Products</h2>
                <Link to="/products?featured=true" className="text-primary-600 hover:text-primary-700 font-medium tracking-wide">
                  View All →
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="product-card bg-white rounded-lg shadow-sm overflow-hidden">
                      <Link to={`/product/${product.id}`} className="block">
                        <div className="aspect-w-1 aspect-h-1">
                          <img
                            src={product.images?.[0]?.url 
                              ? `${process.env.REACT_APP_UPLOAD_URL}${product.images[0].url}`
                              : 'https://via.placeholder.com/300x300?text=No+Image'
                            }
                            alt={product.name}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      </Link>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              LKR {product.price.toLocaleString()}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                LKR {product.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      {!isAdmin && (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Free Shipping</h3>
                <p className="text-gray-600">On orders over LKR 5,000</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Easy Returns</h3>
                <p className="text-gray-600">30-day return policy</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7L3 9m0 0l3 9m-3-9h12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Customer Support</h3>
                <p className="text-gray-600">24/7 support available</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
