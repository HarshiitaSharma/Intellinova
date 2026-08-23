import React, { useState, useEffect, useRef } from "react";

// Fallback data in case backend is offline
const MOCK_PRODUCTS = [
  { id: 1, name: "Nike Air Max 90", price: 12000, category: "Shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" },
  { id: 2, name: "Urban Leather Jacket", price: 4500, category: "Clothing", image: "https://images.unsplash.com/photo-1551028919-ac66e624ecd6?w=500&q=80" },
  { id: 3, name: "Apple Watch Series 8", price: 35000, category: "Electronics", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80" },
  { id: 4, name: "Ray-Ban Aviator", price: 8500, category: "Accessories", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80" },
];

function App() {
  // --- STATE ---
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I'm IntelliNova. Ask me about products" }
  ]);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [points, setPoints] = useState(0);
  const [userId, setUserId] = useState("user_react_1"); 
  const [isListening, setIsListening] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const chatEndRef = useRef(null); // For auto-scrolling
  
  // --- INITIALIZATION ---
  useEffect(() => {
    fetchPoints();
    
    // 1. Check if user came from HTML Store with a question
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('query');
    
    if (initialQuery) {
        // Automatically send the message if query exists
        handleSend(initialQuery);
        // Remove query from URL so refresh doesn't resend it
        window.history.replaceState({}, document.title, "/");
    } else {
        // Only fetch default products if we AREN'T searching immediately
        fetchAllProducts(); 
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- API CALLS ---
  const fetchPoints = async () => {
    try {
      // Changed localhost to 127.0.0.1 to avoid IPv6 issues
      const res = await fetch(`http://127.0.0.1:5000/points/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch points");
      const data = await res.json();
      setPoints(data.points);
    } catch (err) { console.warn("Backend offline (Points)"); }
  };

  const fetchAllProducts = async () => {
    try {
      // Changed localhost to 127.0.0.1 to avoid IPv6 issues
      const res = await fetch("http://127.0.0.1:5000/recommend");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.results || []);
    } catch (err) {
      console.error("Database fetch failed, using mock data", err);
      // Keep MOCK_PRODUCTS if fetch fails (already set in initial state)
    }
  };

  // --- CHAT LOGIC ---
  const handleSend = async (manualText = null) => {
    const text = manualText || query;
    if (!text) return;

    setMessages((prev) => [...prev, { sender: "user", text: text }]);
    setQuery("");

    try {
      const res = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      
      if (!res.ok) throw new Error("Chat API failed");
      const data = await res.json();
      
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
      
      const rec = await fetch(`http://127.0.0.1:5000/recommend?q=${encodeURIComponent(text)}`);
      if (rec.ok) {
        const recData = await rec.json();
        if(recData.results && recData.results.length > 0) {
            setProducts(recData.results);
        }
      }

    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error: Is 'python app.py' running?" }]);
    }
  };

  // --- VOICE LOGIC ---
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice requires Google Chrome.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      handleSend(transcript);
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.start();
  };

  // --- SHOPPING LOGIC ---
  const handlePurchase = async (product) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount: product.price }),
      });
      if (!res.ok) throw new Error("Purchase failed");
      const data = await res.json();
      alert(`Bought ${product.name}! Earned ${data.points_earned} points.`);
      setPoints(data.total_points || data.points);
    } catch (err) { alert("Purchase failed."); }
  };

  const toggleAR = () => setArOpen(!arOpen);

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>✨ IntelliNova App</div>
        <div style={styles.navIcons}>
          <span style={styles.pointsBadge}>💎 {points} pts</span>
          {/* Link back to the HTML Storefront (Adjust port if needed) */}
          <a href="http://127.0.0.1:5500/ui_frontend/ui/index.html" style={styles.link}>Back to Store</a>
        </div>
      </nav>

      <div style={styles.mainLayout}>
        {/* Left Panel: Chat */}
        <div style={styles.chatSection}>
          <div style={styles.chatHeader}>💬 AI Assistant</div>
          
          <div style={styles.chatWindow}>
            {messages.map((msg, i) => (
              <div key={i} style={msg.sender === "user" ? styles.userMsgWrapper : styles.botMsgWrapper}>
                <div style={msg.sender === "user" ? styles.userMsg : styles.botMsg}>
                  <span style={{whiteSpace: "pre-wrap"}}>{msg.text}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={styles.inputArea}>
            <button onClick={startListening} style={isListening ? styles.micActive : styles.mic}>🎤</button>
            <input 
              style={styles.input} 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI..." 
            />
            <button onClick={() => handleSend()} style={styles.sendBtn}>➤</button>
          </div>
        </div>

        {/* Right Panel: Recommendations */}
        <div style={styles.productSection}>
          <div style={styles.productHeader}>
            <h3 style={{margin:0, color:'#333'}}>For You</h3>
            <button onClick={fetchAllProducts} style={styles.resetBtn}>Show All</button>
          </div>
          <div style={styles.grid}>
            {products.map(p => (
              <div key={p.id} style={styles.card}>
                <div style={styles.imageContainer}>
                    <img src={p.image} style={styles.productImage} onError={(e)=>e.target.style.display='none'}/>
                </div>
                <div style={styles.cardBody}>
                    <h4 style={styles.productName}>{p.name}</h4>
                    <p style={styles.price}>₹{p.price}</p>
                    <div style={styles.btnGroup}>
                        <button onClick={() => handlePurchase(p)} style={styles.buyBtn}>Buy Now</button>
                        <button onClick={toggleAR} style={styles.arBtn}>AR View</button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AR Overlay */}
      {arOpen && (
        <div style={styles.modal}>
            <div style={styles.modalContent}>
                <h3>🕶️ AR Try-On</h3>
                <div style={styles.arBox}>
                    [Camera Feed Simulation]
                </div>
                <button onClick={toggleAR} style={styles.closeBtn}>Close</button>
            </div>
        </div>
      )}
    </div>
  );
}

// --- IMPROVED STYLES ---
const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    background: "#f3f4f6",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },

  // Header
  navbar: {
    height: "60px",
    padding: "0 30px",
    background: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    borderBottom: "1px solid #e5e7eb",
  },

  logo: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: "#4f46e5",
    margin: 0,
  },

  navIcons: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },

  pointsBadge: {
    fontSize: "14px",
    background: "#dcfce7",
    color: "#15803d",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    border: "1px solid #bbf7d0",
  },

  link: {
    textDecoration: "none",
    color: "#6b7280",
    fontWeight: "600",
    fontSize: "0.9rem",
    padding: "6px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    background: "white",
  },

  // Main Layout
  mainLayout: {
    flex: 1,
    display: "flex",
    padding: "20px",
    gap: "20px",
    overflow: "hidden",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
  },

  // Chat Section (Left)
  chatSection: {
    width: "400px",
    minWidth: "350px",
    background: "white",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
  },

  chatHeader: {
    padding: "15px 20px",
    borderBottom: "1px solid #f3f4f6",
    fontWeight: "700",
    color: "#374151",
    background: "#f9fafb",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
  },

  chatWindow: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    background: "#ffffff",
  },

  userMsgWrapper: {
    display: "flex",
    justifyContent: "flex-end",
  },

  botMsgWrapper: {
    display: "flex",
    justifyContent: "flex-start",
  },

  userMsg: {
    background: "#4f46e5",
    color: "white",
    padding: "12px 16px",
    borderRadius: "18px 18px 0 18px",
    maxWidth: "85%",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
  },

  botMsg: {
    background: "#f3f4f6",
    color: "#1f2937",
    padding: "12px 16px",
    borderRadius: "18px 18px 18px 0",
    maxWidth: "85%",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    border: "1px solid #e5e7eb",
  },

  inputArea: {
    padding: "15px",
    borderTop: "1px solid #f3f4f6",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "24px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "0.95rem",
    background: "#f9fafb",
  },

  mic: {
    background: "white",
    border: "1px solid #d1d5db",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },

  micActive: {
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "pulse 1.5s infinite",
  },

  sendBtn: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.1rem",
  },

  // Product Section (Right)
  productSection: {
    flex: 1,
    overflowY: "auto",
    padding: "0 10px",
    display: "flex",
    flexDirection: "column",
  },

  productHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "0 0 20px 0",
    borderBottom: "1px solid #ddd",
    paddingBottom: "10px",
  },

  resetBtn: {
    background: "white",
    border: "1px solid #d1d5db",
    padding: "5px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
    paddingBottom: "20px",
  },

  card: {
    background: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
    transition: "transform 0.2s",
    display: "flex",
    flexDirection: "column",
  },

  imageContainer: {
    height: "180px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
  },

  productImage: {
    maxHeight: "100%",
    maxWidth: "100%",
    objectFit: "contain",
  },

  cardBody: {
    padding: "15px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  productName: {
    margin: "0 0 5px 0",
    fontSize: "1rem",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },

  price: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: "1.1rem",
    margin: "0 0 10px 0",
  },

  btnGroup: {
    display: "flex",
    gap: "10px",
  },

  buyBtn: {
    flex: 1,
    background: "#16a34a",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "background 0.2s",
  },

  arBtn: {
    flex: 1,
    background: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
  },

  // Modal
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },

  modalContent: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    width: "400px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },

  arBox: {
    width: "100%",
    height: "250px",
    background: "black",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
  },

  closeBtn: {
    marginTop: "20px",
    padding: "10px 20px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default App;