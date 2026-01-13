# 🚀 Deployment Guide

This guide describes how to deploy the Agentic AI Platform for free using **Render** (Backend) and **Vercel** (Frontend).

## Prerequisites
1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **Render Account**: Create one at [render.com](https://render.com).
3.  **Vercel Account**: Create one at [vercel.com](https://vercel.com).

---

## Step 1: Push to GitHub

1.  Create a new repository on GitHub (e.g., `agentic-ai-platform`).
2.  Push your local code to this repository:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/agentic-ai-platform.git
    git push -u origin main
    ```

---

## Step 2: Deploy Backend (Render)

1.  Go to your [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name**: `agentic-api` (or similar)
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn --worker-class eventlet -w 1 backend.agentic_api_server:app`
    *   **Instance Type**: `Free`
5.  **Environment Variables** (Click "Advanced" or "Environment"):
    *   Add `GROQ_API_KEY` with your key.
    *   Add `OPENAI_API_KEY` (optional, for fallback).
    *   Add `PYTHONPATH` = `.`
6.  Click **Create Web Service**.
7.  **Copy the URL** once deployed (e.g., `https://agentic-api.onrender.com`). You will need this for the frontend.

---

## Step 3: Deploy Frontend (Vercel)

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `frontend` (Important! Click "Edit" and select the `frontend` folder).
5.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your Render Backend URL (e.g., `https://agentic-api.onrender.com`).
    *   `VITE_WS_URL`: Paste the same URL.
6.  Click **Deploy**.

## ⚠️ Common Deployment Issues

### "Error: No flask entrypoint found" on Vercel
This means Vercel is trying to build your backend instead of your frontend.
**Fix:**
1.  Go to **Settings** > **General** in your Vercel project.
2.  Find **Root Directory**.
3.  Click **Edit** and change it to `frontend`.
4.  Click **Save**.
5.  Go to **Deployments** and redeploy.

---

## 🎉 Done!
Your application is now live!
- **Frontend**: Your Vercel URL (e.g., `https://agentic-ai.vercel.app`)
- **Backend**: Your Render URL
