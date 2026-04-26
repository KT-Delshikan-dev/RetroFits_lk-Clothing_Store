import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SizeChartModal from '../components/SizeChartModal';


const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
   const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [mainImage, setMainImage] = useState(0);



  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/products/${id}`);
      const productData = response.data.data;
      setProduct(productData);
      
      // Set default size and color
      if (productData.sizes && productData.sizes.length > 0) {
        const availableSize = productData.sizes.find(s => s.available);
        if (availableSize) setSelectedSize(availableSize.name);
      }
      if (productData.colors && productData.colors.length > 0) {
        setSelectedColor(productData.colors[0].name);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setError('Please select a size');
      return;
    }

    if (product.colors.length > 0 && !selectedColor) {
      setError('Please select a color');
      return;
    }

    // Check size-specific stock
    if (product.sizes.length > 0) {
      const sizeData = product.sizes.find(s => s.name === selectedSize);
      if (!sizeData || sizeData.stock < quantity) {
        setError(`Sorry, only ${sizeData?.stock || 0} units are available for this size.`);
        return;
      }
    } else if (product.stock < quantity) {
      setError(`Sorry, only ${product.stock} units are available.`);
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    setError('');
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

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
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
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
            <li>/</li>
            <li><Link to="/products" className="hover:text-gray-700">Products</Link></li>
            <li>/</li>
            <li><Link to={`/products?category=${product.category.toLowerCase()}`} className="hover:text-gray-700">{product.category}</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4 aspect-square">
              <img
                src={product.images[mainImage]?.url 
                  ? `${process.env.REACT_APP_UPLOAD_URL}${product.images[mainImage].url}`
                  : 'https://via.placeholder.com/600x600?text=No+Image'
                }
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    onClick={() => setMainImage(index)}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all ${
                      mainImage === index ? 'ring-2 ring-primary-600 opacity-100' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={`${process.env.REACT_APP_UPLOAD_URL}${image.url}`}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-20 sm:h-24 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Product Info */}
          <div>
            <p className="text-sm text-primary-600 font-medium mb-2">{product.category}</p>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.ratings.average)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-gray-600 text-sm">
                ({product.ratings.count} reviews)
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">
                  LKR {product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="ml-3 text-xl text-gray-500 line-through">
                      LKR {product.originalPrice.toLocaleString()}
                    </span>
                    <span className="ml-3 bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                      {product.getDiscountPercentage?.() || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="text-gray-600 mb-8">{product.description}</p>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">Size: {selectedSize}</h3>
                  <button 
                    onClick={() => setShowSizeChart(true)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 underline flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">

                  {product.sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => size.stock > 0 && setSelectedSize(size.name)}
                      disabled={size.stock <= 0}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                        selectedSize === size.name
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : size.stock > 0
                          ? 'border-gray-300 text-gray-700 hover:border-primary-600'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed line-through'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}

                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Color: {selectedColor}</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedColor === color.name
                          ? 'border-primary-600 ring-2 ring-primary-200'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex || '#ccc' }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center border border-gray-300 rounded-lg w-32">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="flex-1 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Add to Cart */}
            {user?.role === 'admin' ? (
              <div className="w-full py-4 px-6 rounded-lg font-medium text-lg bg-gray-200 text-gray-500 text-center">
                Admins cannot purchase products
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`w-full py-4 px-6 rounded-lg font-medium text-lg ${
                  product.stock > 0
                    ? 'btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Free shipping over LKR 5,000
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  30-day returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSizeChart && (
        <SizeChartModal 
          category={product.category} 
          onClose={() => setShowSizeChart(false)} 
        />
      )}
    </div>

  );
};

export default ProductDetail;