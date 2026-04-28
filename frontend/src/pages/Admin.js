import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';


const Admin = ({ activeTabOverride = 'products' }) => {
  const { user, token, isAdmin } = useAuth();
  const activeTab = activeTabOverride;
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [notification, setNotification] = useState(null);
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    if (type === 'success') {
      setTimeout(() => setNotification(null), 3000);
    }
  };
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImages, setProductImages] = useState([]); // Array of { file, preview }
  const [sortConfig, setSortConfig] = useState({
    products: { field: 'createdAt', order: 'desc' },
    orders: { field: 'createdAt', order: 'desc' },
    payments: { field: 'createdAt', order: 'desc' },
    users: { field: 'createdAt', order: 'desc' }
  });

  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', id: null, title: '', message: '' });
  const [viewingOrder, setViewingOrder] = useState(null);


  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'Men',
    subCategory: '',
    stock: 0,
    sizes: [],
    colors: [],
    tags: [],
    featured: false,
    excludeFromNewArrivals: false
  });

  const getAvailableSizes = () => {
    const category = productFormData.category;

    // Standard clothing sizes
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

    // Clothing logic (Men/Women)
    if (['Men', 'Women'].includes(category)) {
      // Accessories usually don't have sizes, or are "One Size"
      if (category === 'Accessories') return ['One Size'];
      
      // Standard clothing sizes
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    }

    return ['One Size'];
  };

  const getChartData = () => {
    if (!orders || orders.length === 0) return [];
    
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(date) && o.status === 'delivered');
      const revenue = dayOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
      return { 
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), 
        revenue,
        orders: dayOrders.length
      };
    });
  };

  const getSubCategories = (category) => {
    // Combine hardcoded defaults with existing ones from DB
    const defaults = {
      'Men': ['Casual Wear', 'Formal Wear', 'Activewear', 'Outerwear', 'Denim', 'Other'],
      'Women': ['Dresses & Gowns', 'Tops & Blouses', 'Skirts & Trousers', 'Activewear', 'Outerwear', 'Other'],
      'Accessories': ['Watches', 'Jewelry', 'Bags & Wallets', 'Belts', 'Sunglasses', 'Other'],
      'Jerseys': ['National', 'Club', 'Retro', 'Training', 'Other']
    };

    const existing = subCategoriesMap[category] || [];
    const defaultList = defaults[category] || ['Other'];
    
    // Union of both, unique values
    return Array.from(new Set([...defaultList, ...existing]));
  };







  useEffect(() => {
    if (token) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, sortConfig]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      if (activeTab === 'products') {
        const sort = `${sortConfig.products.order === 'desc' ? '-' : ''}${sortConfig.products.field}`;
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/products?sort=${sort}`, { headers });
        setProducts(response.data.data || []);
      }
      if (['orders', 'payments', 'reports'].includes(activeTab)) {
        const tabKey = activeTab === 'reports' ? 'orders' : activeTab;
        const sort = `${sortConfig[tabKey]?.order === 'desc' ? '-' : ''}${sortConfig[tabKey]?.field || 'createdAt'}`;
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/orders/admin/all?sort=${sort}`, { headers });
        setOrders(response.data.data || []);
      }
      if (activeTab === 'users') {
        const sort = `${sortConfig.users.order === 'desc' ? '-' : ''}${sortConfig.users.field}`;
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users?sort=${sort}`, { headers });
        setUsersList(response.data.data || []);
      }

      // Fetch subcategories for the product form
      const subCatResponse = await axios.get(`${process.env.REACT_APP_API_URL}/products/subcategories`);
      if (subCatResponse.data.success) {
        setSubCategoriesMap(subCatResponse.data.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    
    // Fix price bug: Ensure numbers are stored as numbers or empty strings, not invalid strings
    if (type === 'number') {
      finalValue = value === '' ? '' : parseFloat(value);
    }

    setProductFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSort = (tab, field) => {
    setSortConfig(prev => {
      const currentSort = prev[tab];
      const newOrder = currentSort.field === field && currentSort.order === 'desc' ? 'asc' : 'desc';
      return {
        ...prev,
        [tab]: { field, order: newOrder }
      };
    });
  };

  const getSortIcon = (tab, field) => {
    const config = sortConfig[tab];
    if (config.field !== field) return (
      <svg className="w-3 h-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
    );
    return config.order === 'desc' 
      ? <svg className="w-3 h-3 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      : <svg className="w-3 h-3 ml-1 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
  };

  const handleSizeToggle = (sizeName) => {
    setProductFormData(prev => {
      const exists = prev.sizes.find(s => s.name === sizeName);
      if (exists) {
        return {
          ...prev,
          sizes: prev.sizes.filter(s => s.name !== sizeName)
        };
      } else {
        return {
          ...prev,
          sizes: [...prev.sizes, { name: sizeName, stock: 0 }]
        };
      }
    });
  };

  const handleSizeStockChange = (sizeName, stock) => {
    setProductFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map(s => s.name === sizeName ? { ...s, stock: parseInt(stock) || 0 } : s)
    }));
  };


  const handleProductSubmit = async (e) => {
    e.preventDefault();

    try {
      const headers = { Authorization: `Bearer ${token}` };


      const formData = new FormData();
      
      const excludedFields = ['_id', '__v', 'createdAt', 'updatedAt', 'images', 'ratings'];
      
      Object.keys(productFormData).forEach(key => {
        if (excludedFields.includes(key)) return;
        
        if (key === 'sizes' || key === 'colors' || key === 'tags') {
          formData.append(key, JSON.stringify(productFormData[key] || []));
        } else {
          formData.append(key, productFormData[key] !== undefined ? productFormData[key] : '');
        }

      });


      if (productImages.length > 0) {
        productImages.forEach(img => {
          formData.append('images', img.file);
        });
      }

      if (editingProduct) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/products/${editingProduct._id}`,
          formData,
          { headers }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/products`,
          formData,
          { headers }
        );
      }

      setShowProductForm(false);
      setEditingProduct(null);
      setProductImages([]);
      fetchData();
      showNotification(editingProduct ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
      console.error('Error saving product:', error);
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Error saving product. Please check your data and try again.';
      showNotification(message, 'error');
    }
  };




  const handleDeleteProduct = async (productId) => {
    setConfirmModal({
      show: true,
      type: 'product',
      id: productId,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.'
    });
  };

  const handleExportReports = () => {
    if (orders.length === 0) return;
    
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Items', 'Total (LKR)', 'Status', 'Payment'];
    const rows = orders.map(order => [
      order._id,
      new Date(order.createdAt).toLocaleDateString(),
      order.user?.name || 'Guest',
      order.user?.email || 'N/A',
      order.items?.length || 0,
      order.pricing?.total || 0,
      order.status,
      order.paymentMethod
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `retrofits_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    const { type, id } = confirmModal;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = '';
      if (type === 'product') endpoint = `/products/${id}`;
      if (type === 'user') endpoint = `/users/${id}`;
      if (type === 'order') endpoint = `/orders/${id}`;

      await axios.delete(`${process.env.REACT_APP_API_URL}${endpoint}`, { headers });
      setConfirmModal({ show: false, type: '', id: null, title: '', message: '' });
      fetchData();
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showNotification(`Failed to delete ${type}: ` + (error.response?.data?.message || error.message), 'error');
    }
  };



  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${process.env.REACT_APP_API_URL}/orders/${orderId}/status`,
        { status },
        { headers }
      );
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${userId}`,
        { role },
        { headers }
      );
      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleRemoveImage = async (productId, index) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/products/${productId}/images/${index}`,
        { headers }
      );
      if (response.data.success) {
        setEditingProduct(response.data.data);
        setProductFormData(response.data.data);
        fetchData();
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };


  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      show: true,
      type: 'user',
      id: userId,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.'
    });
  };

  const handleDeleteOrder = async (orderId) => {
    setConfirmModal({
      show: true,
      type: 'order',
      id: orderId,
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.'
    });
  };


  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container-custom py-8">
        {/* Notification Banner */}
        {notification && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform translate-y-0 ${
            notification.type === 'error' 
              ? 'bg-red-50 border-red-500 text-red-800' 
              : 'bg-green-50 border-green-500 text-green-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-2 font-bold">&times;</button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 capitalize">
            {activeTab === 'products' ? 'Product Management' :
             activeTab === 'orders' ? 'Order Management' :
             activeTab === 'payments' ? 'Payment Management' :
             activeTab === 'users' ? 'User Management' :
             'Report Management'}
          </h1>
          {activeTab === 'products' && (
            <button
              onClick={() => {
                if (!showProductForm) {
                  setEditingProduct(null);
                  setProductImages([]);
                  setProductFormData({
                    name: '',
                    description: '',
                    price: '',
                    originalPrice: '',
                    category: 'Men',
                    subCategory: '',
                    stock: 0,
                    sizes: [],
                    colors: [],
                    tags: [],
                    isActive: true,
                    featured: false
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                setShowProductForm(!showProductForm);
              }}
              className="btn-primary"
            >
              {showProductForm ? 'Cancel' : 'Add Product'}
            </button>
          )}

        </div>

        {/* Product Form */}
        {showProductForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={productFormData.name}
                    onChange={handleProductInputChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={productFormData.category}
                    onChange={handleProductInputChange}
                    className="input-field"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Accessories">Accessories</option>

                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category / Type</label>
                  <div className="relative">
                    <input
                      list="subcategory-list"
                      name="subCategory"
                      value={productFormData.subCategory}
                      onChange={handleProductInputChange}
                      placeholder="Select or type new sub-category"
                      className="input-field"
                    />
                    <datalist id="subcategory-list">
                      {getSubCategories(productFormData.category).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={productFormData.description}
                    onChange={handleProductInputChange}
                    required
                    rows="3"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (LKR)</label>
                  <input
                    type="number"
                    name="price"
                    value={productFormData.price}
                    onChange={handleProductInputChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (LKR)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={productFormData.originalPrice}
                    onChange={handleProductInputChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock (Auto-calculated from sizes)</label>
                  <input
                    type="number"
                    name="stock"
                    value={productFormData.sizes.length > 0 
                      ? productFormData.sizes.reduce((acc, s) => acc + (parseInt(s.stock) || 0), 0)
                      : productFormData.stock
                    }
                    onChange={handleProductInputChange}
                    disabled={productFormData.sizes.length > 0}
                    required
                    className={`input-field ${productFormData.sizes.length > 0 ? 'bg-gray-100' : ''}`}
                  />
                </div>
                
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-gray-800">Size Inventory</label>
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => {
                          const allSizes = getAvailableSizes();
                          setProductFormData(prev => ({
                            ...prev,
                            sizes: allSizes.map(size => ({ name: size, stock: 0 }))
                          }));
                        }}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        + Add All Available
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductFormData(prev => ({ ...prev, sizes: [] }))}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  {getAvailableSizes().length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {getAvailableSizes().map(size => {
                          const isSelected = productFormData.sizes.some(s => s.name === size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSizeToggle(size)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isSelected 
                                  ? 'bg-primary-600 text-white' 
                                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                      
                      {productFormData.sizes.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {productFormData.sizes.map(size => (
                            <div key={size.name} className="flex flex-col">
                              <label className="text-xs text-gray-500 mb-1">{size.name} Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={size.stock}
                                onChange={(e) => handleSizeStockChange(size.name, e.target.value)}
                                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {productFormData.sizes.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Select sizes above to manage individual stock levels.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sizes are not applicable for this category/type.</p>
                  )}
                </div>


                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={productFormData.featured}
                      onChange={handleProductInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Featured Product (Shows on Home)</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="excludeFromNewArrivals"
                      checked={productFormData.excludeFromNewArrivals}
                      onChange={handleProductInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Exclude from New Arrivals (Manual Override)</label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Images (Max 4 Total)
                  </label>
                  
                  {/* Current Images */}
                  {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {editingProduct.images.map((img, idx) => (
                        <div key={img.url || idx} className="relative group aspect-square">
                          <img 
                            src={`${process.env.REACT_APP_UPLOAD_URL}${img.url}`} 
                            alt={`Product ${idx}`} 
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(editingProduct._id, idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                    </div>
                  )}

                  {/* New Images Previews */}
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {productImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <img 
                            src={img.preview} 
                            alt={`New ${idx}`} 
                            className="w-full h-full object-cover rounded-lg border-2 border-primary-500 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = [...productImages];
                              newImages.splice(idx, 1);
                              setProductImages(newImages);
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-100 shadow-lg"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const currentCount = (editingProduct?.images?.length || 0) + productImages.length;
                      
                      if (currentCount + files.length > 4) {
                        showNotification(`You can only have a maximum of 4 images total. You currently have ${currentCount} and tried to add ${files.length}.`, 'error');
                        return;
                      } else {
                        const newImages = files.map(file => ({
                          file,
                          preview: URL.createObjectURL(file)
                        }));
                        setProductImages([...productImages, ...newImages]);
                        e.target.value = ''; // Reset input to allow re-selecting same files if needed
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Maximum 4 images allowed per product (Existing + New).
                  </p>

                </div>

              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('products', 'name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Product {getSortIcon('products', 'name')}</div>
                    </th>
                    <th 
                      onClick={() => handleSort('products', 'category')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Category {getSortIcon('products', 'category')}</div>
                    </th>
                    <th 
                      onClick={() => handleSort('products', 'price')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Price {getSortIcon('products', 'price')}</div>
                    </th>
                    <th 
                      onClick={() => handleSort('products', 'stock')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Stock {getSortIcon('products', 'stock')}</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              src={product.images[0]?.url 
                                ? `${process.env.REACT_APP_UPLOAD_URL}${product.images[0].url}`
                                : 'https://via.placeholder.com/40'
                              }
                              alt={product.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        LKR {product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setProductImages([]);
                            setProductFormData({
                              ...product,
                              subCategory: product.subCategory || '',
                              sizes: product.sizes || [],
                              colors: product.colors || [],
                              tags: product.tags || []
                            });
                            setShowProductForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}


                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('orders', 'orderNumber')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Order # {getSortIcon('orders', 'orderNumber')}</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th 
                      onClick={() => handleSort('orders', 'pricing.total')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Total {getSortIcon('orders', 'pricing.total')}</div>
                    </th>
                    <th 
                      onClick={() => handleSort('orders', 'status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Status {getSortIcon('orders', 'status')}</div>
                    </th>
                    <th 
                      onClick={() => handleSort('orders', 'createdAt')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Date {getSortIcon('orders', 'createdAt')}</div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.user?.name}</div>
                        <div className="text-sm text-gray-500">{order.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        LKR {order.pricing?.total?.toLocaleString() || '0'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => setViewingOrder(order)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Table */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th 
                      onClick={() => handleSort('payments', 'createdAt')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Date {getSortIcon('payments', 'createdAt')}</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th 
                      onClick={() => handleSort('payments', 'pricing.total')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Amount {getSortIcon('payments', 'pricing.total')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.user?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{order.payment?.method || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.payment?.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.payment?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.payment?.status || 'Unknown'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        LKR {order.pricing?.total?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('users', 'name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">User {getSortIcon('users', 'name')}</div>
                    </th>
                    <th 
                      onClick={() => handleSort('users', 'email')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Email {getSortIcon('users', 'email')}</div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th 
                      onClick={() => handleSort('users', 'role')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    >
                      <div className="flex items-center">Role {getSortIcon('users', 'role')}</div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersList.map((u) => (
                    <tr key={u._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-bold">
                            {u.profileImage ? <img src={`${process.env.REACT_APP_UPLOAD_URL}${u.profileImage}`} alt={u.name} className="h-10 w-10 rounded-full object-cover" /> : u.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          } border-0 cursor-pointer focus:ring-0`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-gray-900">Reports Overview</h2>
              <button
                onClick={handleExportReports}
                className="flex items-center space-x-2 bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-primary-800 transition shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export to CSV</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 mb-8">

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex items-center">
              <div className="p-3 rounded-full bg-primary-100 text-primary-600 mr-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">LKR {orders.filter(o => o.status === 'delivered').reduce((acc, order) => acc + (order.pricing?.total || 0), 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cancelled Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'cancelled').length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">


              {/* Revenue Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 text-gray-800">Weekly Revenue (LKR)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()}>
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

              {/* Order Volume Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 text-gray-800">Order Volume</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}


        {/* Confirmation Modal */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{confirmModal.title}</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{confirmModal.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ show: false, type: '', id: null, title: '', message: '' })}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {viewingOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setViewingOrder(null)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-900">Order Details - {viewingOrder.orderNumber}</h3>
                    <button onClick={() => setViewingOrder(null)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Info</h4>
                      <p className="text-sm font-medium text-gray-900">{viewingOrder.user?.name}</p>
                      <p className="text-sm text-gray-500">{viewingOrder.user?.email}</p>
                      <p className="text-sm text-gray-500">{viewingOrder.deliveryAddress?.phone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</h4>
                      <p className="text-sm text-gray-900">{viewingOrder.deliveryAddress?.street}</p>
                      <p className="text-sm text-gray-900">
                        {viewingOrder.deliveryAddress?.city}, {viewingOrder.deliveryAddress?.state} {viewingOrder.deliveryAddress?.zipCode}
                      </p>
                      <p className="text-sm text-gray-900">{viewingOrder.deliveryAddress?.country}</p>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Order Items</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Size/Color</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 uppercase">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewingOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded bg-gray-100 mr-3 flex-shrink-0">
                                  {item.image && <img src={`${process.env.REACT_APP_UPLOAD_URL}${item.image}`} alt="" className="h-full w-full object-cover rounded" />}
                                </div>
                                <div className="text-sm font-medium text-gray-900">{item.name || 'Product'}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span> | Color: {item.color}</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">LKR {item.price?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold">
                        <tr>
                          <td colSpan="3" className="px-4 py-2 text-right text-sm text-gray-600">Subtotal</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">LKR {viewingOrder.pricing?.subtotal?.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="px-4 py-2 text-right text-sm text-gray-600">Shipping</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">LKR {viewingOrder.pricing?.shipping?.toLocaleString()}</td>
                        </tr>
                        <tr className="bg-primary-50 text-primary-900">
                          <td colSpan="3" className="px-4 py-3 text-right text-base">Total</td>
                          <td className="px-4 py-3 text-right text-base">LKR {viewingOrder.pricing?.total?.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div>
                      <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-1">Payment Method</p>
                      <p className="text-sm font-medium text-gray-900 uppercase">{viewingOrder.payment?.method || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-1">Payment Status</p>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${
                        viewingOrder.payment?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {viewingOrder.payment?.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
  );
};

export default Admin;