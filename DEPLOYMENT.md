# 🚀 WebGenius AI — Production Deployment Guide

A step-by-step, beginner-friendly guide to deploying **WebGenius AI** publicly using **Render** (free tier) and **MongoDB Atlas** (free tier).

---

## 🏗 Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │            User Browser                │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼ (Static HTML/JS/CSS)                          ▼ (API Requests & Auth Cookies)
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│     Render Static Site          │             │    Render Web Service (Node)    │
│     (webgenius-ui)              │             │    (webgenius-api)              │
│     https://<app>.onrender.com  │             │    https://<api>.onrender.com   │
└─────────────────────────────────┘             └────────────────┬────────────────┘
                                                                 │
                                                 ┌───────────────┴───────────────┐
                                                 │                               │
                                                 ▼                               ▼
                                  ┌─────────────────────────────┐ ┌─────────────────────────────┐
                                  │   MongoDB Atlas (M0 Free)   │ │      Google Gemini API      │
                                  │   (webgenius-cluster)       │ │     (gemini-3.8-flash)      │
                                  └─────────────────────────────┘ └─────────────────────────────┘
```

* **Frontend**: React + Vite + Tailwind CSS deployed as a **Render Static Site**.
* **Backend**: Node.js + Express + Mongoose deployed as a **Render Web Service**.
* **Database**: MongoDB Atlas M0 Free Cluster (`webgenius-cluster`) for user accounts, projects, and version history.
* **AI Engine**: Google Gemini API running server-side (`gemini-3.8-flash`).

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:
1. A free **GitHub account** ([github.com](https://github.com)).
2. A free **Render account** ([render.com](https://render.com)).
3. A free **MongoDB Atlas account** with your `webgenius-cluster` created ([cloud.mongodb.com](https://cloud.mongodb.com)).
4. A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey).
5. Verified that `.env` files are ignored by git (configured in `.gitignore`).

---

## 🍃 Step 1: Configure MongoDB Atlas

Ensure your MongoDB Atlas cluster allows incoming connections from Render:

1. Log in to [MongoDB Cloud](https://cloud.mongodb.com).
2. **Configure Network Access**:
   * In the left sidebar, click **Security** ➔ **Network Access**.
   * Click **Add IP Address**.
   * Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   * Click **Confirm**. *(Required because cloud providers like Render use dynamic IPs).*
3. **Create Database User**:
   * In the left sidebar, click **Security** ➔ **Database Access**.
   * Click **Add New Database User**.
   * Select **Password Authentication**.
   * Set a Username (e.g., `webgenius_user`) and a secure Password.
   * Under **Database User Privileges**, select **Read and write to any database**.
   * Click **Add User**.
4. **Copy Connection String**:
   * Click **Database** in the sidebar.
   * On your `webgenius-cluster`, click the **Connect** button.
   * Choose **Drivers** (Node.js).
   * Copy the connection string. It looks like:
     ```
     mongodb+srv://<username>:<password>@webgenius-cluster.xxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   * *Replace `<username>` and `<password>` with the credentials created in Step 1.3.*

---

## 🐙 Step 2: Push Your Project to GitHub

1. Open PowerShell or Terminal in your project root:
   ```powershell
   cd "c:\Users\hp\OneDrive\Desktop\website build"
   ```
2. Verify git status and ensure secrets are NOT tracked:
   ```powershell
   git status
   ```
   *(Ensure `.env` or `server/.env` are NOT listed in "Changes to be committed" or "Untracked files" — they are protected by `.gitignore`).*
3. If this is a new repository, initialize and commit:
   ```powershell
   git init
   git add .
   git commit -m "Production ready WebGenius AI"
   ```
4. Create a repository on [GitHub](https://github.com/new) (e.g. `webgenius-ai`).
5. Link and push to your GitHub repo:
   ```powershell
   git branch -M main
   git remote add origin https://github.com/<your-username>/webgenius-ai.git
   git push -u origin main
   ```

---

## ⚡ Step 3: Deploy on Render

You can deploy using either **Method A (Blueprint — Recommended)** or **Method B (Manual)**.

### Method A: Blueprint 1-Click Deployment (Recommended)

WebGenius AI includes a preconfigured [`render.yaml`](./render.yaml) file:

1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top right corner and select **Blueprint**.
3. Connect your GitHub account and select your `webgenius-ai` repository.
4. Render will read `render.yaml` and discover two services:
   * **`webgenius-api`** (Backend Web Service)
   * **`webgenius-ui`** (Frontend Static Site)
5. Fill in the required environment variables prompted by the wizard:
   * `GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.
   * `MONGODB_URI`: Your MongoDB Atlas connection string from Step 1.4.
6. Click **Apply**. Render will automatically build, deploy, and link both services together!

---

### Method B: Manual Service Setup

If you prefer to configure each service manually:

#### 1. Deploy the Backend Web Service:
* In Render Dashboard, click **New +** ➔ **Web Service**.
* Connect your `webgenius-ai` repository.
* Configure:
  * **Name**: `webgenius-api`
  * **Region**: Oregon (or your preferred region)
  * **Root Directory**: `server`
  * **Runtime**: `Node`
  * **Build Command**: `npm install && npm run build`
  * **Start Command**: `npm start`
  * **Plan**: `Free`
* Scroll down to **Environment Variables** and add:
  | Key | Value | Description |
  | :--- | :--- | :--- |
  | `NODE_ENV` | `production` | Enables production security & cookies |
  | `PORT` | `5000` | Server listening port |
  | `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API key |
  | `GEMINI_MODEL` | `gemini-3.8-flash` | Fast, production model |
  | `MONGODB_URI` | `mongodb+srv://...` | Atlas connection string |
  | `MONGODB_DB_NAME` | `webgenius_ai` | Database name |
  | `JWT_SECRET` | *(Random 32+ char string)* | Token encryption secret |
  | `SESSION_SECRET` | *(Random 32+ char string)* | Session encryption secret |
  | `CLIENT_ORIGIN` | `https://webgenius-ui.onrender.com` | Your frontend URL |
  | `FRONTEND_URL` | `https://webgenius-ui.onrender.com` | Your frontend URL |
* Click **Create Web Service**.
* Wait for deployment to complete and copy the backend URL (e.g. `https://webgenius-api.onrender.com`).

#### 2. Deploy the Frontend Static Site:
* In Render Dashboard, click **New +** ➔ **Static Site**.
* Connect your `webgenius-ai` repository.
* Configure:
  * **Name**: `webgenius-ui`
  * **Root Directory**: `client`
  * **Build Command**: `npm install && npm run build`
  * **Publish Directory**: `dist`
* Add an Environment Variable:
  | Key | Value |
  | :--- | :--- |
  | `VITE_API_URL` | `https://webgenius-api.onrender.com` *(your backend URL)* |
* Under **Redirects/Rewrites**:
  * Add a rewrite rule:
    * **Source**: `/*`
    * **Destination**: `/index.html`
    * **Action**: `Rewrite`
* Click **Create Static Site**.

---

## 🔍 Step 4: Verify Your Deployment

Once both services are deployed:

1. **Test the Backend Health**:
   Open in your browser:
   `https://webgenius-api.onrender.com/api/health`
   You should see:
   ```json
   {
     "status": "healthy",
     "service": "WebGenius AI API",
     "database": {
       "isConfigured": true,
       "isConnected": true,
       "dbName": "webgenius_ai"
     }
   }
   ```
2. **Open the Frontend**:
   Visit `https://webgenius-ui.onrender.com`.
3. **Test Account Creation**:
   * Click **Sign Up** and create an account.
   * Verify that your name appears in the top navigation.
4. **Generate a Website**:
   * Type a prompt (e.g. *"A modern portfolio for a freelance photographer"*).
   * Watch Gemini generate the live preview, source code, and responsive layout.
5. **Test Persistence & Dashboard**:
   * Click **Save Project**.
   * Navigate to the **Dashboard** view (`My Projects`).
   * Refresh your browser page to confirm the project and dashboard view are preserved.

---

## 💡 Troubleshooting & FAQs

### Q: Why does the first request take 30–50 seconds?
* **A**: Render's **Free Tier** puts web services to sleep after 15 minutes of inactivity. When a new request arrives, it takes about 30 seconds to wake up (cold start). Once awake, responses are instantaneous. For 24/7 instant availability, upgrade to Render's starter plan ($7/mo) or use a free uptime monitor (e.g. Cron-job.org) hitting `/api/health` every 10 minutes.

### Q: MongoDB fails with `Could not connect to MongoDB`
* **A**: Check your MongoDB Atlas **Network Access**. Make sure `0.0.0.0/0` is listed in your IP whitelist. Also verify your database user password has no unencoded characters.

### Q: Login doesn't persist across browser reloads
* **A**: Ensure your backend has `CLIENT_ORIGIN` set to your exact frontend Render URL (`https://webgenius-ui.onrender.com`) without a trailing slash. WebGenius AI automatically uses `sameSite: 'none'` and `secure: true` on HTTPS.

### Q: How do I change my Gemini Model?
* **A**: In your Render Web Service dashboard, set the environment variable `GEMINI_MODEL=gemini-3.8-flash` (or `gemini-2.0-flash`), and click **Save Changes**. The service will redeploy automatically.

---

## 🛡 Security Best Practices
* Never commit `.env` files to git.
* Keep your `JWT_SECRET` and `SESSION_SECRET` distinct and at least 32 characters long.
* In production, the sandboxed iframe prevents generated websites from accessing host cookies, local storage, or server credentials.
