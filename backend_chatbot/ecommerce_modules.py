import sqlite3
import json
import os

# --- CONFIGURATION ---
# This ensures the code finds the DB and JSON file in the same folder as this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'shop.db')
USERS_FILE = os.path.join(BASE_DIR, 'users.json')

class RecommendationEngine:
    @staticmethod
    def get_recommendations(category_query):
        """
        Connects to the group's SQLite database (shop.db) 
        and finds products matching the category.
        """
        recommendations = []
        
        # Check if the database exists (created by setup_db.py)
        if not os.path.exists(DB_PATH):
            print(f"Error: {DB_PATH} not found. Please run setup_db.py first.")
            return []
            
        try:
            # Connect to database
            conn = sqlite3.connect(DB_PATH)
            # This allows accessing columns by name (row['name'] instead of row[1])
            conn.row_factory = sqlite3.Row 
            cursor = conn.cursor()
            
            # SQL Query: Select all columns where category looks like the query
            # % symbol allows partial matches (e.g., "cloth" matches "Clothing")
            cursor.execute(
                "SELECT * FROM products WHERE category LIKE ?", 
                (f'%{category_query}%',)
            )
            
            rows = cursor.fetchall()
            
            # Format the data into a clean list of dictionaries
            for row in rows:
                recommendations.append({
                    "id": row["id"],
                    "name": row["name"],
                    "price": row["price"],
                    "category": row["category"],
                    "description": row["description"],
                    "image": row["image"]
                })
                
            conn.close()
            
        except Exception as e:
            print(f"Database Error: {e}")
            return []
            
        return recommendations

class LoyaltySystem:
    @staticmethod
    def _init_user_db():
        """Internal helper: Creates users.json if it doesn't exist."""
        if not os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'w') as file:
                # Initialize with empty data
                json.dump({}, file)

    @staticmethod
    def get_points(user_id):
        """Reads the current points for a specific user."""
        LoyaltySystem._init_user_db()
        user_id = str(user_id) # Ensure ID is a string for JSON keys
        
        try:
            with open(USERS_FILE, 'r') as file:
                users = json.load(file)
            return users.get(user_id, 0)
        except:
            return 0

    @staticmethod
    def add_points(user_id, purchase_amount):
        """
        Calculates points based on purchase amount (1 point per $10).
        Updates the JSON file and returns (points_earned, new_total).
        """
        LoyaltySystem._init_user_db()
        
        # Logic: 1 point for every $10 spent
        try:
            points_earned = int(float(purchase_amount) / 10)
        except (ValueError, TypeError):
            points_earned = 0

        user_id = str(user_id)
        
        try:
            with open(USERS_FILE, 'r') as file:
                users = json.load(file)
        except:
            users = {}

        # Update balance
        current_points = users.get(user_id, 0)
        new_total = current_points + points_earned
        users[user_id] = new_total

        # Save back to file
        with open(USERS_FILE, 'w') as file:
            json.dump(users, file, indent=4)
            
        return points_earned, new_total