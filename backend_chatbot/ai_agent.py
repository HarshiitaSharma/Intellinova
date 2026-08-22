import google.generativeai as genai
import os

# --- CONFIGURATION ---
# Get your FREE API Key here: https://aistudio.google.com/app/apikey
# Set it in your terminal: export GEMINI_API_KEY="your_key"
API_KEY = os.getenv("GEMINI_API_KEY") 

if API_KEY:
    genai.configure(api_key=API_KEY)

def get_ai_response(user_text, context_products):
    """
    Tries to get a real AI response using Google Gemini.
    Falls back to rule-based logic if no key is present.
    """
    
    # 1. IF API KEY EXISTS -> USE REAL AI
    if API_KEY:
        try:
            model = genai.GenerativeModel('gemini-pro')
            
            # Contextual Prompting
            product_summary = "\n".join([f"- {p[1]} (${p[2]})" for p in context_products[:5]])
            prompt = f"""
            You are Nova, an AI shopping assistant. 
            User said: "{user_text}"
            
            Here are some products available in the store:
            {product_summary}
            
            Answer the user politely. If they asked for a product, mention the ones above.
            Keep it short (under 50 words).
            """
            
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print("API Error (falling back):", e)
    
    # 2. FALLBACK (NO API KEY) -> SMART LOCAL LOGIC
    user_text = user_text.lower()
    if "hello" in user_text:
        return "Hello! I'm Nova. I've analyzed our database and can help you find products."
    if "price" in user_text:
        return "I can find the best deals for you. Take a look at these items below."
    if not context_products:
        return "I couldn't find exact matches, but I'm always learning!"
        
    return f"I found {len(context_products)} items that match what you're looking for. Check them out!"