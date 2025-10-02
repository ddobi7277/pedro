# =============================
# Imports and Configuration
# =============================
from fastapi import FastAPI, WebSocket, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import os
import uuid as _uuid
import platform
import subprocess

# Local imports
from shcema import UserCreate, ItemCreate, SaleCreate, SaleEdit, CategoryCreate, PublicItemResponse, CustomerCreate, OrderCreate, UserRead, UserUpdate
from services import *
from models import User
from services import get_db

# =============================
# App Initialization
# =============================
app = FastAPI(
    title="CubaBalance API",
    description="Professional e-commerce API for inventory management",
    version="1.0.0"
)

# Static file serving
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# =============================
# Middleware Configuration
# =============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://reliably-communal-man.ngrok-free.app",
        "https://cubalcance.netlify.app",
        "http://localhost:3000",
        "127.0.0.1"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# =============================
# Configuration and Utility Functions
# =============================
ENABLE_FIREWALL = os.getenv("ENABLE_FIREWALL", "true").lower() == "true"
IS_LINUX = platform.system() == "Linux"
ALLOW_LOCALHOST = os.getenv("ALLOW_LOCALHOST", "true").lower() == "true"

async def initialize_admin_user():
    """Initialize default admin user on startup"""
    db = next(get_db())
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "pedro").first()
        if not admin_user:
            admin_user_data = UserCreate(
                username="pedro",
                full_name="Pedro Admin",
                hashed_password="Admin,1234",
                is_admin=True
            )
            await create_user(db=db, user=admin_user_data)
            print("✓ Admin user 'pedro' created successfully")
        else:
            # Ensure existing user is admin
            if not admin_user.is_admin:
                admin_user.is_admin = True
                db.commit()
                print("✓ User 'pedro' updated to admin status")
            else:
                print("✓ Admin user 'pedro' already exists")
    except Exception as e:
        print(f"Error initializing admin user: {e}")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    """Run initialization tasks on application startup"""
    await initialize_admin_user()

def is_cloudflare_request(headers):
    """Check if request comes from Cloudflare"""
    cf_connecting_ip = headers.get("CF-Connecting-IP")
    cf_ray = headers.get("CF-RAY")
    return cf_connecting_ip and cf_ray

def is_allowed_host(host: str) -> bool:
    """Check if the host is allowed to access the application"""
    allowed_hosts = ['www.cubaunify.uk']
    if ALLOW_LOCALHOST:
        allowed_hosts.extend(['localhost:8000', '127.0.0.1:8000', 'localhost', '127.0.0.1'])
    return any(allowed_host in host for allowed_host in allowed_hosts)

def execute_firewall_commands(ip: str, port: int = 8000):
    """Execute firewall commands to block suspicious IPs (Linux only)"""
    if not ENABLE_FIREWALL:
        print(f"Firewall disabled - would have blocked IP: {ip}")
        return
    
    if not IS_LINUX:
        print(f"Firewall commands only work on Linux - would have blocked IP: {ip}")
        return
    
    try:
        commandD = f"sudo ufw delete allow {port}/tcp"
        command = f"sudo ufw insert 1 deny from {ip} to any port {port} proto tcp"
        commandA = f"sudo ufw allow {port}/tcp"
        
        print(f"Executing firewall commands for IP: {ip}")
        subprocess.run(commandD, shell=True, check=True)
        subprocess.run(command, shell=True, check=True)
        subprocess.run(commandA, shell=True, check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"Failed to execute firewall command: {e}")
    except Exception as e:
        print(f"Error in firewall execution: {e}")

# =============================
# GET Endpoints
# =============================

@app.get("/", tags=["General"])
@app.get("/index", tags=["General"])
async def root(request: Request):
    """Root endpoint with host validation"""
    print(request.headers.get('host'))
    host_name = request.headers.get('host')
    headers = request.headers
    
    if (is_cloudflare_request(headers)) and ('www.cubaunify.uk' in host_name):
        if host_name == 'www.cubaunify.uk':
            return {"message": "Welcome to Cubalcance"}
    else:
        return {"message": "What are you trying to do motherfucker???"}

@app.get("/users", response_model=None, tags=["Admin"])
async def read_users(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="You're not authorized to see this",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    host_name = request.headers.get('host')
    print(host_name)
    
    if current_user:
        return await get_users(db, 0, 100)
    else:
        return credentials_exception

@app.get("/verify-token/{token}", tags=["Authentication"])
async def verify_user(token: str, db: Session = Depends(get_db)):
    """Verify JWT token validity"""
    user = await get_current_user(db, token)
    if user:
        return {"Authentication Status": f'Successful! by {user.username}'}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

# Seller/Admin endpoints
@app.get("/get_seller_items", tags=["Seller Management"])
async def get_seller_items(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get items for authenticated seller (private endpoint)"""
    host_name = request.headers.get('host')
    print(host_name)
    
    if current_user:
        return await get_items_by_seller(current_user.username, db)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You don't have any product or you're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.get("/get_seller_sales", tags=["Seller Management"])
async def get_seller_sales(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get sales for authenticated seller"""
    if current_user:
        return await get_sale_by_seller(db, current_user.username)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.get("/get_categories_by_seller", tags=["Seller Management"])
async def get_categories_by_seller_private(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get categories for authenticated seller"""
    if current_user:
        return await get_category_by_seller(db, current_user.username)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

# Public store endpoints
@app.get('/store/{seller}/items', response_model=list[PublicItemResponse], tags=["Public Store"])
async def public_store_items(seller: str, db: Session = Depends(get_db)):
    """Public endpoint to get items for a given seller (store view).
    Returns only public information: name, price, quantity, image, and details."""
    items = await get_items_by_seller(seller, db)
    return [PublicItemResponse.model_validate(item) for item in items]

@app.get('/store/{seller}/categories', tags=["Public Store"])
async def public_store_categories(seller: str, db: Session = Depends(get_db)):
    """Public endpoint to get categories for a given seller"""
    return await get_category_by_seller(db, seller)

# Customer endpoints
@app.get("/customers/{customer_id}", tags=["Customer Management"])
async def get_customer_endpoint(customer_id: str, db: Session = Depends(get_db)):
    """Get customer by ID"""
    cust = await get_customer_by_id(db, customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust

# Order endpoints
@app.get("/orders/customer/{customer_id}", tags=["Order Management"])
async def get_orders_customer(customer_id: str, db: Session = Depends(get_db)):
    """Get orders by customer ID"""
    return await get_orders_by_customer(db, customer_id)

@app.get("/orders/seller/{seller}", tags=["Order Management"])
async def get_orders_seller(seller: str, db: Session = Depends(get_db)):
    """Get orders by seller"""
    return await get_orders_by_seller(db, seller)

# =============================
# POST Endpoints
# =============================

@app.post("/register", tags=["Authentication"])
async def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new user (admin only)"""
    if current_user:
        if current_user.username == 'pedro':
            db_user = await get_user_by_username(db, username=user.username)
            if db_user:
                raise HTTPException(status_code=400, detail="Username already exists")
            else:
                return await create_user(db=db, user=user)

@app.post("/token", tags=["Authentication"])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint - returns JWT token"""
    print(f"Login attempt for username: {form_data.username}")  # Debug log
    user = await authenticate_user(db, form_data.username, form_data.password)
    print(f"Authentication result: {user}")  # Debug log
    if not user:
        print("Authentication failed - user not found or wrong password")  # Debug log
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    print(f"User authenticated: {user.username}, is_admin: {getattr(user, 'is_admin', 'NOT_SET')}")  # Debug log
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await create_access_token(
        user_data={'username': user.username, 'is_admin': getattr(user, 'is_admin', False)}, 
        expires_delta=access_token_expires
    )
    print(f"Token created: {access_token[:50]}...")  # Debug log (only first 50 chars)
    return {"access_token": access_token, "token_type": "bearer", "is_admin": getattr(user, 'is_admin', False)}

@app.post("/creat/item", tags=["Item Management"])
async def create_items(
    item: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new item"""
    old_item = await get_item_by_name(db=db, name=item.name)
    if current_user:
        if not old_item:
            return await create_item(db, item, current_user.username)
        else:
            raise HTTPException(status_code=400, detail="This Item already exists")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.post("/create/category", tags=["Category Management"])
async def create_categories(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category"""
    old_category = await get_category_by_name(db=db, name=category.name, username=current_user.username)
    if current_user:
        if not old_category:
            return await create_category(db=db, name=category.name, username=current_user.username)
        else:
            raise HTTPException(status_code=400, detail="This Category already exists")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.post("/create/sale", tags=["Sales Management"])
async def create_item_sold(
    sale: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new sale"""
    if current_user:
        item = await get_item_by_name(db=db, name=sale.name)
        print(item)
        item.cant = item.cant - sale.cant
        await update_item(item_id=item.id, item=item, db=db)
        await create_sale(db, item, sale.gender, sale.date, sale.cant, revenuE=sale.revenue, revenuE_USD=sale.revenue_USD)
        return "Sale created"
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.post("/customers", tags=["Customer Management"])
async def create_customer_endpoint(customer: CustomerCreate, db: Session = Depends(get_db)):
    existing = await get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    return await create_customer(db, customer)

async def create_customer_endpoint(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    existing = await get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    return await create_customer(db, customer)

@app.post("/orders", tags=["Order Management"])
async def create_order_endpoint(order: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order"""
    return await create_order(db, order)

@app.post("/upload-image", tags=["File Management"])
async def upload_image(product_id: str = Form(...), file: UploadFile = File(...)):
    """Upload product image"""
    ext = os.path.splitext(file.filename)[1]
    filename = f"{product_id}_{_uuid.uuid4().hex}{ext}"
    path = os.path.join("uploads", filename)
    contents = await file.read()
    with open(path, "wb") as f:
        f.write(contents)
    return {"filename": filename, "url": f"/uploads/{filename}"}

# =============================
# PUT Endpoints
# =============================
@app.delete("/delete/items/{item_id}")
async def delete_items(item_id:str,current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    item= await get_item_by_id(item_id=item_id,db= db)
    if current_user:
        if (item.seller == current_user.username):
            await delete_item(item_id=item_id,db= db)
            return "Deleted!"
        else:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not the owner of that item!",
            headers={"WWW-Authenticate": "Bearer"}
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

# =============================
# PUT Endpoints
# =============================

@app.put("/edit/item/{item_id}", tags=["Item Management"])
async def edit_item(
    item_id: str,
    item: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit an existing item"""
    current_item = await get_item_by_id(item_id=item_id, db=db)
    if current_user:
        if (current_item.seller == current_user.username):
            print('Item in /edit/item', item)
            return await update_item(item_id=item_id, item=item, db=db)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the owner of that item!",
                headers={"WWW-Authenticate": "Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.put("/edit/category/{category_id}", tags=["Category Management"])
async def edit_category(
    category_id: str,
    category: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit an existing category"""
    current_category = await get_category(db=db, id=category_id)
    if current_user:
        if (current_category.category_of == current_user.username):
            await update_item_categories(db=db, old_category=current_category.name, updated_cat=category.name)
            return await update_category(db=db, id=category_id, name=category.name)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the maker of this category!",
                headers={"WWW-Authenticate": "Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.put("/edit/item_sold/{sale_id}", tags=["Sales Management"])
async def edit_sales(
    sale_id: str,
    sale: SaleEdit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit an existing sale"""
    item_sold = await get_sale_by_id(db=db, id=sale_id)
    item = await get_item_by_name(db=db, name=item_sold.name)
    print(item.tax)
    if current_user:
        if (item_sold.seller == current_user.username):
            await update_sale(sale_id=sale_id, db=db, sale=sale, tax=item.tax)
            return "Updated!"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the owner of that item!",
                headers={"WWW-Authenticate": "Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

# =============================
# DELETE Endpoints
# =============================

@app.delete("/delete/items/{item_id}", tags=["Item Management"])
async def delete_item_by_id(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an item"""
    item = await get_item_by_id(item_id=item_id, db=db)
    if current_user:
        if (item.seller == current_user.username):
            await delete_item(item_id=item_id, db=db)
            return "Deleted!"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the owner of that item!",
                headers={"WWW-Authenticate": "Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.delete("/delete/category/{category_id}", tags=["Category Management"])
async def delete_category_by_id(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a category"""
    category = await get_category(db=db, id=category_id)
    if current_user:
        if (category.category_of == current_user.username):
            await delete_category(db=db, id=category_id)
            return "Deleted"
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

@app.delete("/delete/sale/{sale_id}", tags=["Sales Management"])
async def delete_sale_by_id(
    sale_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a sale"""
    sale = await get_sale_by_id(db=db, id=sale_id)
    if current_user:
        if (sale.seller == current_user.username):
            await delete_sale(sale_id=sale_id, db=db)
            return "Deleted!"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the owner of that item!",
                headers={"WWW-Authenticate": "Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )

# =============================
# Admin Management Endpoints
# =============================

async def verify_admin_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Verify if current user is admin"""
    current_user = await get_current_user(db, token)
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@app.get("/admin/users", response_model=list[UserRead], tags=["Admin"])
async def get_all_users_admin(admin_user: User = Depends(verify_admin_user), db: Session = Depends(get_db)):
    """Get all users (admin only)"""
    users = await get_all_users(db=db)
    return users

@app.get("/admin/users/{user_id}", response_model=UserRead, tags=["Admin"])
async def get_user_by_id_admin(user_id: str, admin_user: User = Depends(verify_admin_user), db: Session = Depends(get_db)):
    """Get user by ID (admin only)"""
    user = await get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/admin/users/{user_id}", response_model=UserRead, tags=["Admin"])
async def update_user_admin(user_id: str, user_update: UserUpdate, admin_user: User = Depends(verify_admin_user), db: Session = Depends(get_db)):
    """Update user information (admin only)"""
    update_data = user_update.dict(exclude_unset=True)
    updated_user = await update_user(db=db, user_id=user_id, user_update=update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@app.delete("/admin/users/{user_id}", tags=["Admin"])
async def delete_user_admin(user_id: str, admin_user: User = Depends(verify_admin_user), db: Session = Depends(get_db)):
    """Delete user (admin only)"""
    try:
        result = await delete_user(db=db, user_id=user_id)
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/status", tags=["Admin"])
async def get_admin_status(admin_user: User = Depends(verify_admin_user)):
    """Check admin status"""
    return {"is_admin": True, "username": admin_user.username}

# =============================
# Security Catch-All Routes (Keep at the bottom)
# =============================

@app.get("/{path:path}", tags=["Security"])
async def catch_all_get(path: str, request: Request):
    """Security catch-all for GET requests"""
    print(request.client)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
            f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tried to find a vulnerability with method:GET - path:{path}\n")
        
        execute_firewall_commands(ip)
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")

@app.post("/{path:path}", tags=["Security"])
async def catch_all_post(path: str, request: Request):
    """Security catch-all for POST requests"""
    print(request.client.host)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
            f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tried to find a vulnerability with method:POST - path:{path}\n")
        
        execute_firewall_commands(ip)
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")

@app.put("/{path:path}", tags=["Security"])
async def catch_all_put(path: str, request: Request):
    """Security catch-all for PUT requests"""
    print(request.client.host)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
            f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tried to find a vulnerability with method:PUT - path:{path}\n")
        
        execute_firewall_commands(ip)
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")

@app.delete("/{path:path}", tags=["Security"])
async def catch_all_delete(path: str, request: Request):
    """Security catch-all for DELETE requests"""
    print(request.client.host)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
            f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tried to find a vulnerability with method:DELETE - path:{path}\n")
        
        execute_firewall_commands(ip)
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")
