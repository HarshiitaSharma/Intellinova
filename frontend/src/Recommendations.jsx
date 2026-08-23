import React, { useState } from 'react';

const Recommendations = () => {
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState('user_1');
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Recommendations from Backend
  const fetchRecommendations = async () => {
    if (!category) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/recommend?category=${category}`);
      const data = await res.json();
      setProducts(data.results || []);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    }
    setLoading(false);
  };

  // Buy Item
  const buyItem = async (product) => {
    try {
      const res = await fetch('http://localhost:5000/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: product.price })
      });
      const data = await res.json();
      alert(`Purchased ${product.name}! \nYou earned ${data.points_earned} points.`);
      fetchPoints(); 
    } catch (err) {
      console.error("Purchase failed", err);
    }
  };

  // Check Points
  const fetchPoints = async () => {
    try {
      const res = await fetch(`http://localhost:5000/points/${userId}`);
      const data = await res.json();
      setPoints(data.points);
    } catch (err) {
      console.error("Failed to fetch points", err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Loyalty Header */}
      <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Loyalty Rewards</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm opacity-80">User ID:</span>
            <input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              className="text-black px-2 py-1 rounded text-sm"
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold">{points !== null ? points : 0}</p>
          <button onClick={fetchPoints} className="text-xs underline mt-1">Refresh Points</button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-lg font-bold mb-4">Find Products</h3>
        <div className="flex gap-3">
          <select 
            className="border p-2 rounded flex-grow"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Accessories">Accessories</option>
          </select>
          <button 
            onClick={fetchRecommendations}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((item) => (
          <div key={item.id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-48 object-cover"
              onError={(e) => {e.target.src='https://via.placeholder.com/300?text=No+Image'}}
            />
            <div className="p-4">
              <h4 className="font-bold truncate">{item.name}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-green-600 font-bold">${item.price}</span>
                <button 
                  onClick={() => buyItem(item)}
                  className="bg-black text-white px-3 py-1 rounded text-sm"
                >
                  Buy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;