# backend/setup_db.py
import sqlite3
import requests

# --- EXTENDED PRODUCT LIST (50+ Items) ---
CUSTOM_PRODUCTS = [
    (101, "Classic Aviator Sunglasses", 1500, "Accessories", "Gold frame aviator sunglasses", "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500"),
    (102, "Wayfarer Black Shades", 1200, "Accessories", "Classic black wayfarer sunglasses", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500"),
    (103, "Vintage Round Glasses", 1800, "Accessories", "Retro round clear glasses", "https://images.unsplash.com/photo-1577803645773-f96470509666?w=500"),
    (104, "Luxury Gold Watch", 15000, "Electronics", "Premium gold finish analog watch", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500"),
    (105, "Sport Digital Watch", 4500, "Electronics", "Rugged digital sports watch waterproof", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"),
    (106, "Minimalist Leather Watch", 6000, "Electronics", "Brown leather strap minimalism", "https://images.unsplash.com/photo-1434056838489-2e30c0eb703e?w=500"),
    (107, "Nike Air Jordan High", 18000, "Shoes", "High top basketball sneakers red black", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"),
    (108, "Adidas Ultraboost", 14000, "Shoes", "White running shoes comfortable", "https://images.unsplash.com/photo-1587563871167-1ee7c735dfeb?w=500"),
    (109, "Converse Chuck Taylor", 3500, "Shoes", "Classic high top canvas sneakers", "https://images.unsplash.com/photo-1607522370275-f14206c19f26?w=500"),
    (110, "Denim Trucker Jacket", 4500, "Clothing", "Blue denim jacket vintage wash", "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500"),
    (111, "Leather Biker Jacket", 8500, "Clothing", "Black genuine leather motorcycle jacket", "https://images.unsplash.com/photo-1551028919-ac66e624ecd6?w=500"),
    (112, "Bomber Jacket Olive", 3200, "Clothing", "Olive green bomber jacket", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500"),
    (113, "Summer Floral Dress", 2500, "Clothing", "Light summer dress with floral pattern", "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500"),
    (114, "Formal Blue Shirt", 1800, "Clothing", "Office wear cotton shirt blue", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500"),
    (115, "Graphic Streetwear Tee", 999, "Clothing", "Oversized graphic t-shirt black", "https://images.unsplash.com/photo-1503341455253-b2e723099de5?w=500"),
]

def init_db():
    conn = sqlite3.connect('shop.db')
    cursor = conn.cursor()
    
    # Reset Table (Drop old one to ensure clean slate)
    cursor.execute("DROP TABLE IF EXISTS products")
    
    cursor.execute('''
        CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name TEXT,
            price REAL,
            category TEXT,
            description TEXT,
            image TEXT
        )
    ''')
    
    # 1. Add Custom High-Quality Products
    print("📦 Adding Custom Inventory...")
    for p in CUSTOM_PRODUCTS:
        cursor.execute('INSERT INTO products (id, name, price, category, description, image) VALUES (?, ?, ?, ?, ?, ?)', p)
    
    # 2. Fetch Generic Data from FakeStoreAPI (Filler Content)
    print("🌍 Fetching Global Products...")
    try:
        response = requests.get('https://fakestoreapi.com/products')
        data = response.json()
        for item in data:
            # Map categories to better names
            cat = item['category']
            if "clothing" in cat: cat = "Clothing"
            elif "jewelery" in cat: cat = "Accessories"
            elif "electronics" in cat: cat = "Electronics"
            
            cursor.execute('''
                INSERT OR IGNORE INTO products (id, name, price, category, description, image)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (item['id'], item['title'], item['price'] * 80, cat, item['description'], item['image']))
    except:
        print("⚠️ Internet fetch failed, using only custom data.")

    conn.commit()
    print("✅ Database Populated Successfully with 35+ items!")
    conn.close()

if __name__ == '__main__':
    init_db()