import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database import get_supabase

SECRET_KEY = os.environ.get("JWT_SECRET", "88283584826372819192837465615243")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# Bcrypt has a 72-byte limit. We'll handle it by truncating or pre-hashing. 
# Pre-hashing with SHA256 is the standard way to allow infinite password length with bcrypt.
def prepare_password(password: str) -> bytes:
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        return hashlib.sha256(pwd_bytes).hexdigest().encode('utf-8')
    return pwd_bytes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str):
    try:
        return bcrypt.checkpw(
            prepare_password(plain_password), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(prepare_password(password), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    supabase = get_supabase()
    res = supabase.table("users").select("id, username, email").eq("id", user_id).single().execute()
    user = res.data
    if user is None:
        raise credentials_exception
    return user
