# IntelliNova 🛍️✨

IntelliNova is an AI-powered shopping assistant demo. It pairs a Flask + SQLite backend with **two** frontends: a static HTML/JS storefront and a React (Vite) chat/recommendation app, plus loyalty points and an AR try-on placeholder.

## Features

- 🤖 **AI Chat Assistant ("Nova")** — natural-language product search, with an optional Google Gemini integration (falls back to rule-based replies if no API key is set)
- 🛒 **Product Recommendations** — category or keyword-based search against a SQLite product catalog
- 💎 **Loyalty Points** — earn points on every purchase, tracked per user
- 🕶️ **AR Try-On** — placeholder camera-feed modal in the React app
- 🎤 **Voice Search** — chat input via the Web Speech API (Chrome only)
- 🔗 **Two connected frontends** — a classic multi-page storefront (`ui_frontend/`) that hands off "Ask AI" queries to the React chat app (`frontend/`)

## Project Structure

```
Intellinova/
├── backend_chatbot/       # Flask API
│   ├── app.py              # Routes: /chat, /recommend, /purchase, /points
│   ├── ai_agent.py         # Gemini integration + fallback logic
│   ├── ecommerce_modules.py# RecommendationEngine, LoyaltySystem
│   ├── setup_db.py         # Creates & seeds shop.db
│   ├── shop.db             # SQLite product database
│   ├── users.json          # Loyalty points storage
│   └── requirements.txt
│
├── frontend/               # React + Vite chat/recommendation app
│   ├── src/
│   │   ├── App.jsx
│   │   └── Recommendations.jsx
│   └── package.json
│
└── ui_frontend/             # Static HTML/CSS/JS storefront
    ├── ui/
    │   ├── index.html
    │   ├── login.html / signup.html / profile.html
    │   ├── recommend.html
    │   ├── ar.html
    │   ├── chat.html
    │   ├── script.js
    │   └── style.css
    └── *.jpg                 # Product images
```

## Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- A modern browser (Chrome recommended for voice search)
- (Optional) A [Google Gemini API key](https://aistudio.google.com/app/apikey) for real AI responses

## Setup & Running

You'll run **three** things at once, each in its own terminal.

### 1. Backend (Flask API) — port 5000

```bash
cd backend_chatbot
pip install -r requirements.txt
python setup_db.py      # only needed once, to create/seed shop.db
python app.py
```

Optional — enable real AI chat responses:

```bash
export GEMINI_API_KEY="your_key_here"   # Windows: set GEMINI_API_KEY=your_key_here
python app.py
```

Without a key, the chatbot automatically falls back to rule-based replies.

### 2. React app (chat + recommendations) — port 5173

```bash
cd frontend
npm install
npm run dev
```

### 3. Static storefront — port 5500

Open `ui_frontend/ui/index.html` with a local server (e.g. the VS Code **Live Server** extension), so it's served at `http://127.0.0.1:5500/ui_frontend/ui/index.html`. The port is hardcoded in `script.js`, so opening the file directly (`file://...`) won't work correctly.

## How the pieces talk to each other

- The static storefront (`ui_frontend`) and the React app (`frontend`) both call the Flask API directly at `http://127.0.0.1:5000`.
- Clicking **"Ask AI"** on a product card in the storefront redirects to the React app with a pre-filled query (`http://localhost:5173/?query=...`).
- The React app links back to the storefront via **"Back to Store"**.

If you change any of the default ports, update the corresponding `API_BASE_URL` / `REACT_APP_URL` constants in `ui_frontend/ui/script.js` and the `fetch` URLs in `frontend/src/App.jsx`.

## Notes

- `google-generativeai` is deprecated upstream; the app still works, but you'll see a `FutureWarning` on startup. Google's current SDK is `google-genai`.
- Do **not** commit `node_modules/` — it's already in `frontend/.gitignore`. If you ever zip or copy the project between machines, delete `node_modules/` first and run `npm install` fresh on the target machine (platform-specific binaries won't transfer correctly otherwise).

