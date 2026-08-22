from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

# --- IMPORTS ---
try:
    from ai_agent import get_ai_response
except ImportError:
    get_ai_response = None

from ecommerce_modules import LoyaltySystem, RecommendationEngine

app = Flask(__name__)
CORS(app)

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'shop.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message', '').lower()
    
    conn = get_db_connection()
    
    # Search Logic
    search_term = user_query
    if "shoe" in user_query: search_term = "Shoes"
    elif "phone" in user_query: search_term = "Mobile"
    elif "watch" in user_query: search_term = "Electronics"
    elif "cloth" in user_query: search_term = "Clothing"
    
    cursor = conn.execute(
        "SELECT * FROM products WHERE name LIKE ? OR category LIKE ? LIMIT 5", 
        (f"%{search_term}%", f"%{search_term}%")
    )
    rows = cursor.fetchall()
    conn.close()

    # Format Product List
    product_list_text = ""
    if rows:
        product_list_text = "\n\n🔍 **Found these items:**\n"
        for row in rows:
            product_list_text += f"• {row['name']} (${row['price']})\n"
    
    # AI Response
    ai_reply = ""
    if get_ai_response:
        try:
            context = f"Query: {user_query}\nData: {product_list_text}"
            ai_reply = get_ai_response(context, rows)
        except: ai_reply = "I found these items:"

    if not ai_reply: ai_reply = "Here is what I found:"
    
    return jsonify({"reply": ai_reply + product_list_text})

@app.route('/recommend', methods=['GET'])
def recommend():
    # 1. Get parameters
    category = request.args.get('category')
    q = request.args.get('q')
    
    conn = get_db_connection()
    
    # 2. Determine Query
    if category:
        sql = "SELECT * FROM products WHERE category LIKE ?"
        args = (f"%{category}%",)
    elif q:
        sql = "SELECT * FROM products WHERE name LIKE ? OR category LIKE ?"
        args = (f"%{q}%", f"%{q}%")
    else:
        # CRITICAL FIX: If no params, return ALL products (Limit 50)
        # This populates the homepage with DB data
        sql = "SELECT * FROM products LIMIT 50"
        args = ()
    
    # 3. Execute
    cursor = conn.execute(sql, args)
    rows = cursor.fetchall()
    conn.close()
    
    # 4. Format
    results = []
    for row in rows:
        results.append({
            "id": row['id'], 
            "name": row['name'], 
            "price": row['price'], 
            "image": row['image'], 
            "category": row['category']
        })
        
    return jsonify({"results": results})

@app.route('/purchase', methods=['POST'])
def handle_purchase():
    data = request.json
    user_id = data.get('user_id', 'guest')
    amount = data.get('amount', 0)
    earned, total = LoyaltySystem.add_points(user_id, amount)
    return jsonify({"message": "Success", "points_earned": earned, "total_points": total})

@app.route('/points/<user_id>', methods=['GET'])
def check_points(user_id):
    points = LoyaltySystem.get_points(user_id)
    return jsonify({"user_id": user_id, "points": points})

if __name__ == '__main__':
    print("🚀 Backend Running on Port 5000")
    app.run(debug=True, port=5000)