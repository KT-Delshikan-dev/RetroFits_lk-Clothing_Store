import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';



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
      
      // Process revenue data for last 7 days
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

      setAdminData({ orders, revenueData: revenueByDay });
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

  const categories = [
    { name: 'Men', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop', link: '/products?category=Men' },
    { name: 'Women', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop', link: '/products?category=Women' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400&h=500&fit=crop', link: '/products?category=Accessories' },
    { name: 'Footwear', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop', link: '/products?category=Footwear' }
  ];


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-950 text-white min-h-[85vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=900&fit=crop"
            alt="High Fashion 2026"
            className="w-full h-full object-cover opacity-60 transform scale-105 hover:scale-100 transition-transform duration-[15s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/70 to-gray-950"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent"></div>
        </div>
        <div className="relative container-custom py-24 md:py-32">
           <div className="max-w-2xl transform translate-y-[-10%]">
            {isAdmin ? (
              <>
                <span className="text-primary-400 font-bold tracking-[0.4em] uppercase text-xs mb-6 block">Management Console • 2026</span>
                <h1 className="text-6xl md:text-8xl font-serif font-black mb-8 leading-tight drop-shadow-2xl text-white">
                  Luxury &<br /><span className="text-secondary-500">Excellence.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-lg font-light leading-relaxed tracking-wide">
                  Welcome, {user?.name.split(' ')[0]}. Command the future of AVENZA with precision analytics and inventory mastery.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link to="/admin" className="bg-primary-600 text-white px-10 py-5 rounded-full font-bold hover:bg-primary-700 transition-all transform hover:scale-105 text-center uppercase tracking-widest text-xs shadow-2xl">
                    Executive Dashboard
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="text-secondary-500 font-bold tracking-[0.5em] uppercase text-xs mb-6 block">Sophistication Redefined • Collection 2026</span>
                <h1 className="text-6xl md:text-8xl font-serif font-black mb-8 leading-tight drop-shadow-2xl">
                  The Essence of<br /><span className="text-white opacity-90 italic">Avenza.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-lg font-light leading-relaxed tracking-wide">
                  Experience the fusion of exquisite tailoring and modern sophistication. 
                  Our 2026 collection celebrates the pinnacle of style with a vision for the future.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link to="/products" className="btn-silver px-10 py-4 rounded-full uppercase tracking-widest text-xs">
                    Explore Collection
                  </Link>
                </div>
              </>
            )}
          </div>

        </div>
      </section>

       {/* Featured Products or Admin Analytics */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          {isAdmin ? (
            <div>
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-serif font-bold text-gray-900">Store Analytics Overview</h2>
                <Link to="/admin/reports" className="text-primary-600 hover:text-primary-700 font-medium">
                  Detailed Reports →
                </Link>
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
                    <div key={product._id} className="product-card bg-white rounded-lg shadow-sm overflow-hidden">
                      <Link to={`/product/${product._id}`} className="block">
                        <div className="aspect-w-1 aspect-h-1">
                          <img
                            src={product.images[0]?.url 
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
                          <Link to={`/product/${product._id}`}>{product.name}</Link>
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