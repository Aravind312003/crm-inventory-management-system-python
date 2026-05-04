import os
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

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
    allow_origins=[
        "http://localhost:5173",
        "https://inventory-management-python.web.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- AUTH ROUTES ----------------

@app.post("/api/auth/register")
async def register(request: Request):
    try:
        data = await request.json()
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")

        supabase = get_supabase()

        existing = supabase.table("users") \
            .select("*") \
            .or_(f"username.eq.{username},email.eq.{email}") \
            .execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="User already exists")

        hashed_pw = get_password_hash(password)

        res = supabase.table("users").insert([{
            "username": username,
            "email": email,
            "password": hashed_pw
        }]).execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Error creating user")

        return {
            "message": "User registered successfully",
            "user": res.data[0]
        }

    except Exception as e:
        print("REGISTER ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login")
async def login(request: Request):
    try:
        data = await request.json()

        identifier = data.get("identifier") or data.get("username")
        password = data.get("password")

        if not identifier or not password:
            raise HTTPException(status_code=400, detail="Credentials required")

        supabase = get_supabase()

        res = supabase.table("users") \
            .select("*") \
            .or_(f"username.eq.{identifier},email.eq.{identifier}") \
            .execute()

        user = res.data[0] if res.data else None

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if not verify_password(password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid password")

        token = create_access_token({
            "id": user["id"],
            "username": user["username"]
        })

        return {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }

    except Exception as e:
        print("LOGIN ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


# ---------------- CRUD ROUTES ----------------

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


# ---------------- SALES ROUTES ----------------

@app.get("/api/sales")
async def get_sales():
    supabase = get_supabase()
    res = supabase.table("sales").select("*").order("created_at", desc=True).execute()
    return res.data or []


@app.post("/api/sales")
async def create_sale(request: Request):
    try:
        data = await request.json()
        stock_id = data.pop("stock_id", None)

        if stock_id:
            sale_id = InventoryService.create_sale_order(data, int(stock_id))
            return {"id": sale_id, **data}

        supabase = get_supabase()
        res = supabase.table("sales").insert([data]).execute()
        return res.data[0]

    except Exception as e:
        print("SALE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- STATIC FILES ----------------

dist_path = os.path.join(os.getcwd(), "dist")


@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: HTTPException):
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=404,
            content={"detail": "API endpoint not found"}
        )

    index_path = os.path.join(dist_path, "index.html")

    if os.path.exists(index_path):
        return FileResponse(index_path)

    return JSONResponse(
        status_code=404,
        content={"detail": "Frontend not found"}
    )


if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")


# ---------------- CLOUD RUN ENTRY ----------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)