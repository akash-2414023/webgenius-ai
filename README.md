# WebGenius AI 🚀
> Production-Oriented AI Website Builder with Authentication, MongoDB Atlas Persistence, and Live Preview

**WebGenius AI** is an intelligent full-stack website generation platform that transforms natural language prompts into responsive, functional web applications. It includes user authentication, cloud project persistence via MongoDB Atlas, multi-device viewport testing, VS Code-grade Monaco code editing, historical snapshot version recovery, and one-click ZIP/HTML export.

---

## ✨ System Features

- 🤖 **Google Gemini AI Generation**: Deep integration with Google's official Gemini SDK (`gemini-3.8-flash`) with structured JSON schema output and fallback cascades.
- 🔐 **Secure User Authentication**:
  - Full registration, login, logout, and password recovery.
  - Email normalization and password strength enforcement (8+ characters, letter & number).
  - Passwords securely hashed with `bcryptjs` (salt rounds: 12).
  - HTTP-only, SameSite cookies storing signed JWT tokens (protects against XSS token theft).
  - Single-use, expiring cryptographic tokens for password reset.
  - Brute-force rate limiting on `/api/auth/*` endpoints.
- 🍃 **MongoDB Atlas Cloud Persistence**:
  - Singleton connection pool with graceful offline fallback.
  - Complete schemas with indexes: `Users`, `Projects`, `ProjectVersions`.
  - Strict ownership verification on every read, update, rename, and delete operation.
- 📊 **User Workspace Dashboard**:
  - Dark-themed dashboard matching the WebGenius AI aesthetic.
  - Search, sort (by last modified or name), and manage saved projects.
  - Rename, delete (with safety confirmation), and 1-click open in Builder.
- 🔄 **Recoverable Version History**:
  - Automatic snapshot creation before AI modifications and manual code edits.
  - Inspect earlier snapshots and restore previous versions at any time.
- 💻 **Monaco Code Inspector**:
  - Full VS Code Monaco Editor (`@monaco-editor/react`) for live code inspection.
  - Multi-file tabs: `index.html` (Complete), `body.html`, `styles.css`, `script.js`.
  - **"Apply to Live Preview"** synchronization.
- 📱 **Sandboxed Live Preview**:
  - Sandboxed `<iframe>` with simulated browser chrome, reload, and fullscreen mode.
  - Responsive viewport switcher: **Desktop (100%)**, **Tablet (768px)**, and **Mobile (390px)**.
- 📦 **One-Click Export**:
  - Client-side zero-latency project packaging into runnable `.zip` archives (containing `index.html`, `/src`, and `README.md`) or standalone `.html`.

---

## 🏗️ Project Architecture

```
website build/
├── client/                     # Frontend (React 18, TypeScript, Vite 6, Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # Login, Register, Forgot/Reset Password, User Profile
│   │   │   ├── chat/           # Prompt input, style presets, revisions & version history
│   │   │   ├── dashboard/      # User project dashboard, search, sorting, CRUD cards
│   │   │   ├── editor/         # Monaco code editor drawer with live preview sync
│   │   │   ├── layout/         # Header navigation, viewport switcher, save project status
│   │   │   ├── modals/         # Gemini & MongoDB Atlas settings, export modal
│   │   │   └── preview/        # Sandboxed iframe with device frames & starter architectures
│   │   ├── services/           # REST client & JSZip packaging
│   │   ├── types/              # Strict TypeScript definitions
│   │   ├── App.tsx             # State & view orchestrator
│   │   └── main.tsx
│   ├── vercel.json             # Vercel SPA rewrites
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Backend (Node.js, Express, TypeScript, Mongoose)
│   ├── src/
│   │   ├── config/             # Environment validation & secrets loader
│   │   ├── controllers/        # Auth, project CRUD, config, and Gemini controllers
│   │   ├── db/                 # MongoDB Atlas singleton connection pool
│   │   ├── middleware/         # JWT auth, rate limiting, error handling
│   │   ├── models/             # User, Project, ProjectVersion Mongoose schemas
│   │   ├── routes/             # REST route declarations
│   │   ├── services/           # Google Gemini AI SDK service
│   │   ├── tests/              # End-to-end integration test suite
│   │   ├── utils/              # Password hashing, JWT signing, token crypto
│   │   └── index.ts            # Express server entry point (Helmet, Cookie-Parser, CORS)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                # Root environment template
├── .gitignore                  # Safeguards secrets, credentials, and artifacts
├── package.json                # Root concurrent scripts
└── README.md
```

---

## ⚙️ Environment Variables

Create `server/.env` based on `server/.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` or `production`) | `development` |
| `GEMINI_API_KEY` | Google Gemini API Key from Google AI Studio | `AIzaSy...` |
| `GEMINI_MODEL` | Active Gemini Model | `gemini-3.8-flash` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Database name | `webgenius_ai` |
| `JWT_SECRET` | Secret key for signing authentication JWTs | `a_long_random_secret_at_least_32_chars` |
| `SESSION_SECRET` | Session secret key | `a_long_random_session_secret` |
| `CLIENT_ORIGIN` | Allowed client origin for CORS | `http://localhost:5173` |
| `FRONTEND_URL` | Frontend URL for password reset links | `http://localhost:5173` |

For the client (`client/.env` in production):
- `VITE_API_URL`: URL of the deployed backend (e.g. `https://webgenius-api.onrender.com`). Leave empty in local development to use Vite's built-in proxy.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
# Windows (PowerShell):
npm.cmd install
cd server; npm.cmd install; cd ..
cd client; npm.cmd install; cd ..

# macOS / Linux:
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Run the Development Servers
```bash
# Runs both backend (:5000) and frontend (:5173) concurrently
npm run dev
# (or 'npm.cmd run dev' on Windows PowerShell)
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

A comprehensive integration test suite is included in `server/src/tests/integration.test.ts`. It spins up an in-memory MongoDB instance and verifies all 17 authentication, authorization, and persistence scenarios:

```bash
cd server
npm test
# (or 'npm.cmd test' on Windows PowerShell)
```

**Verified Scenarios**:
1. User registration with email normalization (lowercase).
2. Duplicate email rejection (HTTP 409).
3. Login with valid credentials.
4. Login with invalid credentials (HTTP 401).
5. Logout & cookie clearance.
6. Route protection without token (HTTP 401).
7. Saving generated website to user account.
8. Reopening saved project from database.
9. Editing and saving project (increments version count to 2).
10. Listing versions & rolling back to Version 1.
11. Cross-user read isolation (blocked with HTTP 404).
12. Cross-user deletion isolation (blocked with HTTP 404).
13. Project deletion by authorized owner.
14. Verified project removal.
15. Password recovery with single-use cryptographic tokens.
16. Database offline disconnection handling.
17. Full production builds for client and server.

---

## 🌐 Production Deployment Guide

### A. Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free Shared Cluster (`M0`).
2. Under **Database Access**, create a user (e.g. `webgenius_user`) with read/write privileges.
3. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) so cloud providers like Render/Vercel can connect.
4. Click **Connect ➔ Drivers ➔ Node.js** and copy the connection string:
   `mongodb+srv://webgenius_user:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority`

### B. Backend Deployment (Render / Railway / Fly.io)
1. Push the code to a private GitHub repository.
2. In [Render](https://render.com), create a new **Web Service** pointing to your repository.
3. Configure the service settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Set Environment Variables:
   - `NODE_ENV=production`
   - `PORT=5000` (Render sets `PORT` automatically)
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `GEMINI_MODEL=gemini-3.8-flash`
   - `MONGODB_URI=your_mongodb_atlas_uri`
   - `MONGODB_DB_NAME=webgenius_ai`
   - `JWT_SECRET=your_production_secret`
   - `SESSION_SECRET=your_production_session_secret`
   - `CLIENT_ORIGIN=https://your-frontend-app.vercel.app`
   - `FRONTEND_URL=https://your-frontend-app.vercel.app`
5. Note your backend URL (e.g., `https://webgenius-api.onrender.com`).

### C. Frontend Deployment (Vercel)
1. In [Vercel](https://vercel.com), import the same GitHub repository.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Set Environment Variables:
   - `VITE_API_URL=https://webgenius-api.onrender.com` (your Render backend URL)
5. Deploy. Vercel will build the frontend using `client/vercel.json` and serve it with global CDN caching.
