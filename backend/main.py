import os
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional
from datetime import datetime

from backend.database import get_supabase
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)
from services.inventory_service import InventoryService

app = FastAPI(title="Inventory Management API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth Routes ---

@app.post("/api/auth/register")
async def register(request: Request):
    data = await request.json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
        
    supabase = get_supabase()
    # Check if user exists
    existing = supabase.table("users").select("*").or_(f"username.eq.{username},email.eq.{email}").execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User already exists")
        
    hashed_pw = get_password_hash(password)
    res = supabase.table("users").insert([{"username": username, "email": email, "password": hashed_pw}]).execute()
    
    if not res.data:
        raise HTTPException(status_code=500, detail="Error creating user")
        
    return {"message": "User registered successfully", "user": res.data[0]}

@app.post("/api/auth/login")
async def login(request: Request):
    data = await request.json()
    identifier = data.get("identifier") or data.get("username")
    password = data.get("password")
    
    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Credentials required")
        
    supabase = get_supabase()
    res = supabase.table("users").select("*").or_(f"username.eq.{identifier},email.eq.{identifier}").single().execute()
    user = res.data
    
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(data={"id": user["id"], "username": user["username"]})
    return {"token": token, "user": {"id": user["id"], "username": user["username"], "email": user["email"]}}

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# --- CRUD Helper for simple tables ---
def create_crud_routes(prefix: str, table_name: str):
    @app.get(f"/api/{prefix}")
    async def get_all():
        supabase = get_supabase()
        res = supabase.table(table_name).select("*").execute()
        return res.data or []

    @app.post(f"/api/{prefix}")
    async def create(request: Request):
        data = await request.json()
        supabase = get_supabase()
        res = supabase.table(table_name).insert([data]).execute()
        return res.data[0] if res.data else None

    @app.put(f"/api/{prefix}/{{id}}")
    async def update(id: int, request: Request):
        data = await request.json()
        supabase = get_supabase()
        res = supabase.table(table_name).update(data).eq("id", id).execute()
        return res.data[0] if res.data else None

    @app.delete(f"/api/{prefix}/{{id}}")
    async def delete(id: int):
        supabase = get_supabase()
        supabase.table(table_name).delete().eq("id", id).execute()
        return {"message": "Deleted"}

create_crud_routes("suppliers", "suppliers")
create_crud_routes("products", "products")
create_crud_routes("stock", "stock")
create_crud_routes("customers", "customers")

# --- Sales Routes (Special Logic) ---

@app.get("/api/sales")
async def get_sales():
    supabase = get_supabase()
    res = supabase.table("sales").select("*").order("created_at", desc=True).execute()
    return res.data or []

@app.post("/api/sales")
async def create_sale(request: Request):
    data = await request.json()
    stock_id = data.pop("stock_id", None)
    try:
        if stock_id:
            sale_id = InventoryService.create_sale_order(data, int(stock_id))
            return {"id": sale_id, **data}
        else:
            supabase = get_supabase()
            res = supabase.table("sales").insert([data]).execute()
            return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/sales/{id}")
async def update_sale(id: int, request: Request):
    data = await request.json()
    stock_id = data.pop("stock_id", None)
    try:
        sale_id = InventoryService.update_sale_order(id, data, int(stock_id) if stock_id else None)
        return {"id": sale_id, **data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sales/{id}")
async def delete_sale(id: int):
    try:
        InventoryService.delete_sale_order(id)
        return {"message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Dashboard Stats ---

@app.get("/api/dashboard/stats")
async def get_stats():
    supabase = get_supabase()
    try:
        # We can't do simultaneous queries easily without async in Python SDK (which is sync by default unless using async client)
        suppliers_count = supabase.table("suppliers").select("*", count="exact").execute().count
        products_count = supabase.table("products").select("*", count="exact").execute().count
        stock_count = supabase.table("stock").select("*", count="exact").execute().count
        
        sales_res = supabase.table("sales").select("amount, total_price, created_at").execute()
        sales_data = sales_res.data or []
        
        recent_sales = supabase.table("sales").select("*").order("created_at", desc=True).limit(5).execute().data or []
        recent_stock = supabase.table("stock").select("*").order("created_at", desc=True).limit(5).execute().data or []
        
        total_revenue = sum((s.get("total_price") or s.get("amount") or 0) for s in sales_data)
        
        sales_by_date = {}
        for s in sales_data:
            dt = s['created_at'][:10]
            sales_by_date[dt] = sales_by_date.get(dt, 0) + (s.get("total_price") or s.get("amount") or 0)
        
        history = [{"date": d, "amount": a} for d, a in sales_by_date.items()]
        history.sort(key=lambda x: x['date'])
        history = history[-7:]
        
        activity = []
        for s in recent_sales: activity.append({**s, "type": "sale"})
        for s in recent_stock: activity.append({**s, "type": "stock"})
        activity.sort(key=lambda x: x['created_at'], reverse=True)
        activity = activity[:8]
        
        return {
            "totalSuppliers": suppliers_count or 0,
            "totalProducts": products_count or 0,
            "totalStockEntries": stock_count or 0,
            "totalRevenue": total_revenue,
            "salesHistory": history,
            "recentActivity": activity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Static Files & SPA Routing ---

dist_path = os.path.join(os.getcwd(), "dist")

@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
    
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse(
        status_code=404, 
        content={"detail": "Frontend not found. Please run 'npm run build' to generate the dist folder."}
    )

if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
