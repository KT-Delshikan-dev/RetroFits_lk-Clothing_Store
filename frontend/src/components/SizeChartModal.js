import React from 'react';

const SizeChartModal = ({ category, onClose }) => {
  const getChartData = () => {
    const cat = category?.toLowerCase() || '';
    
    if (cat.includes('men') || cat.includes('women') || cat.includes('streetwear')) {
      return {
        title: 'Clothing Size Chart',
        headers: ['Size', 'Chest (in)', 'Waist (in)', 'Length (in)'],
        rows: [
          ['XS', '32-34', '26-28', '26'],
          ['S', '34-36', '28-30', '27'],
          ['M', '38-40', '32-34', '28'],
          ['L', '42-44', '36-38', '29'],
          ['XL', '46-48', '40-42', '30'],
          ['XXL', '50-52', '44-46', '31'],

        ]
      };
    }
    
    if (cat.includes('footwear')) {
      return {
        title: 'Footwear Size Chart',
        headers: ['US', 'UK', 'EU', 'CM'],
        rows: [
          ['6', '5', '39', '24'],
          ['7', '6', '40', '25'],
          ['8', '7', '41', '26'],
          ['9', '8', '42', '27'],
          ['10', '9', '43', '28'],

        ]
      };
    }

    if (cat.includes('accessories')) {
      return {
        title: 'Accessories Size Guide',
        headers: ['Type', 'Dimensions', 'Notes'],
        rows: [
          ['Belts', '32-42 inches', 'Adjustable'],
          ['Bags', 'Varies', 'See description'],
          ['Hats', 'One Size', 'Adjustable strap'],
        ]
      };
    }

    // Default
    return {
      title: 'Standard Size Chart',
      headers: ['Size', 'Chest (in)', 'Waist (in)'],
      rows: [
        ['S', '34-36', '28-30'],
        ['M', '38-40', '32-34'],
        ['L', '42-44', '36-38'],
        ['XL', '46-48', '40-42'],
      ]
    };
  };

  const chart = getChartData();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-serif font-bold text-white uppercase tracking-wider">{chart.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {chart.headers.map((header, idx) => (
                    <th key={idx} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chart.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm text-gray-500 italic">
            * All measurements are in inches unless otherwise specified. Fit may vary by style or personal preference.
          </p>
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-900 text-white px-8 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeChartModal;
