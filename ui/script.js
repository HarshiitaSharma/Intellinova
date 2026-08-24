// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:5000"; // Python Backend
const REACT_APP_URL = "http://localhost:5173"; // React Frontend (Vite)

// --- DUMMY DATA (Fallback for Home Page) ---
const PRODUCTS = [
    { id: 1, name: "IntelliNova Pro Max Phone", category: "Mobile", price: "₹49,999", rating: 4.8, image: "https://via.placeholder.com/300x200/007bff/FFFFFF?text=Nova+Phone" },
    { id: 2, name: "AeroStride Running Shoes", category: "Shoes", price: "₹2,999", rating: 4.5, image: "https://via.placeholder.com/300x200/28a745/FFFFFF?text=Shoes" },
    { id: 3, name: "X-Series Noise Cancelling Headphones", category: "Electronics", price: "₹8,500", rating: 4.7, image: "https://via.placeholder.com/300x200/ffc107/343a40?text=Headphones" },
    { id: 4, name: "Classic Cotton T-Shirt", category: "Apparel", price: "₹999", rating: 4.2, image: "https://via.placeholder.com/300x200/dc3545/FFFFFF?text=T-Shirt" },
    { id: 5, name: "Smart Home Security Camera 360", category: "Electronics", price: "₹3,999", rating: 4.4, image: "https://via.placeholder.com/300x200/6c757d/FFFFFF?text=Camera" },
    { id: 6, name: "Leather Formal Shoes", category: "Shoes", price: "₹4,500", rating: 4.6, image: "https://via.placeholder.com/300x200/17a2b8/FFFFFF?text=Formal+Shoes" },
];

// --- HELPER: Stars ---
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) { starsHtml += '★'; }
    if (halfStar) { starsHtml += '½'; }
    return starsHtml;
}

// --- RENDER PRODUCT CARD ---
function createProductCard(product) {
    // Remove currency symbol and commas to get a number for calculation
    const priceNum = parseInt(product.price.toString().replace(/[^\d]/g, '')) || 0;
    
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-rating">
                    ${generateRatingStars(product.rating)} (${product.rating})
                </div>
                <div class="product-price">${product.price}</div>
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <!-- ASK AI: Redirects to React App -->
                    <button class="btn btn-primary" onclick="askAI('${product.name}')" style="flex:1;">Ask AI</button>
                    <!-- BUY: Stays here, hits backend -->
                    <button class="btn" style="background-color:#28a745; color:white; flex:1;" onclick="buyItem(${product.id}, ${priceNum}, '${product.name}')">Buy</button>
                </div>
            </div>
        </div>
    `;
}

// --- CRITICAL: REDIRECT TO REACT APP ---
function askAI(productName) {
    const query = `Tell me details about ${productName}`;
    // Redirects to http://localhost:5173/?query=...
    window.location.href = `${REACT_APP_URL}/?query=${encodeURIComponent(query)}`;
}

function renderProducts() {
    const listingDiv = document.getElementById('product-listing');
    if (listingDiv) {
        listingDiv.innerHTML = PRODUCTS.map(product => createProductCard(product)).join('');
    }
}

// --- AUTH & HEADER LOGIC ---
function getCurrentUser() {
    const userString = localStorage.getItem('intelliNovaUser');
    return userString ? JSON.parse(userString) : null;
}

function loginUser(email, name = null) { 
    let finalName = name;
    if (!finalName || finalName === 'User') { 
        finalName = email.split('@')[0];
        finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
    }
    const initialChar = finalName.charAt(0).toUpperCase();
    const userData = { name: finalName, email: email, initial: initialChar };
    
    localStorage.setItem('intelliNovaUser', JSON.stringify(userData));
    alert(`Logged in successfully as ${finalName}!`);
    window.location.href = 'index.html';
}

window.logoutUser = function() {
    localStorage.removeItem('intelliNovaUser');
    window.location.href = 'login.html'; 
}

function updateHeader() {
    const user = getCurrentUser();
    const navElement = document.getElementById('main-nav');
    if (!navElement) return;

    let leftSideHTML = '';
    if (user) {
        leftSideHTML = `
            <div class="header-left">
                <div class="header-profile-icon" title="View Profile" onclick="window.location.href='profile.html'">
                    ${user.initial}
                </div>
                <a href="index.html" class="logo">IntelliNova</a>
            </div>
        `;
    } else {
        leftSideHTML = `
            <div class="header-left"><a href="index.html" class="logo">IntelliNova</a></div>
        `;
    }

    // Navigation Links
    const links = [
        { name: 'Home', file: 'index.html' },
        { name: 'Recommendations', file: 'recommend.html' },
        // Link 'Chatbot' directly to the React App
        { name: 'Chatbot App', url: REACT_APP_URL }, 
        { name: 'AR Try-On', file: 'ar.html' },
        user ? { name: 'Profile', file: 'profile.html' } : { name: 'Login', file: 'login.html' }
    ];

    const navLinksHTML = links.map(link => {
        if (link.url) {
            // External link (to React)
            return `<a href="${link.url}" target="_self" style="font-weight:bold; color:#007bff;">${link.name}</a>`;
        }
        return `<a href="${link.file}">${link.name}</a>`;
    }).join('');

    navElement.innerHTML = `
        ${leftSideHTML}
        <div class="nav-links">${navLinksHTML}</div>
    `;
}

// --- BACKEND INTEGRATION (LOYALTY & RECS) ---

// 1. Fetch Points
async function fetchRealPoints() {
    const user = getCurrentUser();
    if (!user) return 0;
    try {
        const response = await fetch(`${API_BASE_URL}/points/${user.email}`);
        const data = await response.json();
        return data.points;
    } catch (error) {
        console.error("Backend offline:", error);
        return 0;
    }
}

// 2. Buy Item
async function buyItem(id, price, name) {
    const user = getCurrentUser();
    if (!user) {
        alert("Please login to buy items and earn points!");
        window.location.href = 'login.html';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.email, amount: price })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert(`✅ Purchased ${name}!\n💎 You earned ${data.points_earned} points!`);
            renderLoyaltyWidget(); // Refresh UI immediately
        } else {
            alert("Purchase failed.");
        }
    } catch (error) {
        alert("Could not connect to server. Is 'python app.py' running?");
    }
}

// 3. Render Loyalty Widget (Home & Profile)
async function renderLoyaltyWidget() {
    const user = getCurrentUser();
    const widget = document.getElementById('loyalty-home-widget');
    const profilePoints = document.getElementById('loyalty-points');

    if (user) {
        const points = await fetchRealPoints();

        // Update Home Widget
        if (widget) {
            document.getElementById('widget-welcome').textContent = `Hello, ${user.name}!`;
            document.getElementById('widget-points').textContent = points;
            document.getElementById('widget-purchases').textContent = Math.floor(points / 10); 
        }
        // Update Profile/Recommend Page Badge
        if (profilePoints) {
            profilePoints.innerText = `${points}`;
        }
    } else if (widget) {
        // Logged Out State
        widget.innerHTML = `
            <div class="loyalty-status">
                <h3>Login to see your Loyalty Status!</h3>
                <p>Earn points and badges with IntelliNova.</p>
            </div>
            <a href="login.html" class="btn btn-primary" style="background-color: #333; color: white;">Login Now</a>
        `;
    }
}

// 4. Fetch Recommendations (for recommend.html)
async function fetchRecommendations(category) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    grid.innerHTML = '<p class="loading">Fetching AI recommendations...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/recommend?category=${category}`);
        const data = await response.json();
        const products = data.results || [];

        grid.innerHTML = "";

        if (products.length === 0) {
            grid.innerHTML = '<p>No products found in this category.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
                <div class="card-body" style="padding:15px; text-align:center;">
                    <h3>${product.name}</h3>
                    <p class="price" style="font-weight:bold; color:#28a745;">₹${product.price}</p>
                    <button onclick="buyItem(${product.id}, ${product.price}, '${product.name}')" class="buy-btn" style="background:#6366f1; color:white; border:none; padding:10px; width:100%; cursor:pointer; border-radius:5px;">
                        Buy Now (+ Points)
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        grid.innerHTML = '<p>Backend offline. Please start app.py.</p>';
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    renderProducts();       // Render dummy products on Home
    renderLoyaltyWidget();  // Render Loyalty (Home & Profile)

    // Listener for Recommendation Page Dropdown
    const categorySelect = document.getElementById("category-select");
    if (categorySelect) {
        categorySelect.addEventListener("change", (e) => {
            fetchRecommendations(e.target.value);
        });
    }
});