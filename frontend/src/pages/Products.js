import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    search: '',
    sort: '-createdAt'
  });


  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const subCategory = params.get('subCategory');
    const search = params.get('search');
    const featured = params.get('featured');

    setFilters(prev => ({
      ...prev,
      category: category || '',
      subCategory: subCategory || '',
      search: search || '',
      featured: featured || ''
    }));
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.subCategory) params.append('subCategory', filters.subCategory);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);


      const response = await axios.get(`${process.env.REACT_APP_API_URL}/products?${params.toString()}`);
      setProducts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'category') newFilters.subCategory = ''; // Reset subCategory when category changes
      return newFilters;
    });
  };

  const categories = ['Men', 'Women', 'Accessories', 'Footwear'];
  
  const getSubCategories = (category) => {
    const cat = categories.find(c => c.toLowerCase() === category?.toLowerCase());
    if (!cat) return [];
    
    switch (cat) {
      case 'Men': return ['T-Shirts', 'Shirts', 'Jeans', 'Shorts', 'Kits', 'Other'];
      case 'Women': return ['T-Shirts', 'Frocks', 'Jeans', 'Kits', 'Other'];
      case 'Footwear': return ['Formals', 'Casuals', 'Other'];
      case 'Accessories': return ['Wallets', 'Chains', 'Sunglasses', 'Other'];

      default: return [];
    }
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
    { value: '-name', label: 'Name: Z to A' }
  ];

  const activeCategory = categories.find(c => c.toLowerCase() === filters.category?.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              {filters.search ? `Search: "${filters.search}"` : 
               filters.subCategory ? `${activeCategory || filters.category} - ${filters.subCategory}` :
               activeCategory ? activeCategory : 
               'All Products'}
            </h1>
            <p className="text-gray-600">
              {pagination.total ? `Showing ${products.length} of ${pagination.total} products` : 'Browse our collection'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
              <button
                onClick={() => setFilters({
                  category: '',
                  subCategory: '',
                  search: '',
                  sort: '-createdAt'
                })}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear Filters
              </button>

          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 space-y-8">
            {/* Sub Categories */}
            {activeCategory && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  {activeCategory} Collection
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange('subCategory', '')}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      filters.subCategory === '' ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All {activeCategory}
                  </button>
                  {getSubCategories(activeCategory).map(sub => (
                    <button
                      key={sub}
                      onClick={() => handleFilterChange('subCategory', sub)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.subCategory === sub ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}



            {/* Filters placeholder */}

          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {loading ? (

              <div className="flex justify-center items-center py-24">
                <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
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
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
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
                          {user?.role !== 'admin' && (
                            <button
                              onClick={() => addToCart(product)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                              title="Add to Cart"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center">
                    <nav className="flex items-center space-x-2">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => {
                            const params = new URLSearchParams(location.search);
                            params.set('page', page);
                            // window.history.pushState({}, '', `${location.pathname}?${params.toString()}`);
                          }}
                          className={`px-4 py-2 rounded-lg ${
                            page === pagination.page
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;