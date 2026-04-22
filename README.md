# Inventory Management System

Restructured Clean Architecture with React Frontend and Python Backend.

## Project Structure

- `frontend/`: React + Vite UI code.
- `backend/`: Python (FastAPI) API logic.
- `database/`: Supabase SQL schema.

## Setup Instructions

### 1. Database (Supabase)
1. Log in to your Supabase Dashboard.
2. Go to the SQL Editor.
3. Copy and run the content of `database/supabase_schema.sql`.

### 2. Backend
1. Ensure you have Python 3.10+ installed.
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Ensure your `.env` file has the following:
   ```env
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   JWT_SECRET=your_secret
   ```
4. Run the backend:
   ```bash
   python3 -m backend.main
   ```

### 3. Execution
1. Ensure your `.env` file is populated.
2. Run `npm run build` to build the frontend.
3. Run `npm run dev` to start the unified Python server (which serves the frontend and handles API requests).

## Features
- Full Inventory Tracking (Stock, Sales, Products, Suppliers).
- FIFO Stock reduction logic (First-In, First-Out).
- Multi-batch restoration logic.
- Real-time Dashboard with analytics.
- Secure JWT Authentication.
