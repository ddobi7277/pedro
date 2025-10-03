from fastapi import FastAPI, WebSocket,Depends,  HTTPException, status,Request, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from fastapi import FastAPI,Form
from shcema import UserCreate,ItemCreate,SaleCreate,SaleEdit,CategoryCreate, PublicItemResponse
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
from services import *
from models import User
from fastapi.staticfiles import StaticFiles
import os
import uuid as _uuid
from sqlalchemy.orm import Session
import ipaddress
import requests
import subprocess
import platform


app = FastAPI()

# serve uploaded images from /uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def is_cloudflare_request(headers):
    cf_connecting_ip = headers.get("CF-Connecting-IP")
    cf_ray = headers.get("CF-RAY")
    return cf_connecting_ip and cf_ray



app.add_middleware(
    CORSMiddleware,
    allow_origins= ["https://reliably-communal-man.ngrok-free.app","https://cubalcance.netlify.app",'http://localhost:3000','127.0.0.1'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Configuration for firewall functionality
ENABLE_FIREWALL = os.getenv("ENABLE_FIREWALL", "true").lower() == "true"
IS_LINUX = platform.system() == "Linux"
ALLOW_LOCALHOST = os.getenv("ALLOW_LOCALHOST", "true").lower() == "true"

def is_allowed_host(host: str) -> bool:
    """
    Check if the host is allowed to access the application.
    Allows www.cubaunify.uk in production and localhost for development.
    Set ALLOW_LOCALHOST=false to disable localhost access.
    """
    allowed_hosts = ['www.cubaunify.uk']
    
    if ALLOW_LOCALHOST:
        allowed_hosts.extend(['localhost:8000', '127.0.0.1:8000', 'localhost', '127.0.0.1'])
    
    return any(allowed_host in host for allowed_host in allowed_hosts)

def execute_firewall_commands(ip: str, port: int = 8000):
    """
    Execute firewall commands to block suspicious IPs.
    Only works on Linux systems and when ENABLE_FIREWALL is True.
    Set ENABLE_FIREWALL=false environment variable to disable for testing.
    """
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

@app.get("/index")
async def root(request: Request):
    print(request.headers.get('host'))
    host_name= request.headers.get('host')
    headers = request.headers
    print(host_name)
    if (is_cloudflare_request(headers)) and ('www.cubaunify.uk' in host_name):
        if host_name == 'www.cubaunify.uk':
           return {"message":"Welcome to Cubalcance"}
    else:
        return {"message":"What are you trying to do motherfucker???"}
  
@app.get("/users",response_model= None)
async def  read_users(request:Request,current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="You're not authorized to see this",
        headers={"WWW-Authenticate": "Bearer"},
    )
    host_name= request.headers.get('host')
    headers = request.headers
    print(host_name)
    if current_user:
            return await get_users(db,0,100)
    else:
            return credentials_exception
    
@app.get("/get_seller_items")
async def get_seller_items(request:Request,current_user:User= Depends(get_current_user), db:Session= Depends(get_db)):
    host_name= request.headers.get('host')
    headers = request.headers
    print(host_name)
    
    if current_user:
               return await get_items_by_seller(current_user.username,db)
        
    else:
               raise HTTPException(
                   status_code=status.HTTP_401_UNAUTHORIZED,
                   detail="You don;t have any product or you're not authorized!",
                   headers= {"WWW-Authenticate":"Bearer"}
            )

        
@app.get("/get_seller_sales")
async def get_seller_sales(request:Request,current_user:User= Depends(get_current_user), db:Session= Depends(get_db)):
    if current_user:
        return await get_sale_by_seller(db,current_user.username)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )


@app.get("/get_categories_by_seller")
async def get_categories_by_seller_private(current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    if current_user:
        return await get_category_by_seller(db,current_user.username)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )


@app.get("/verify-token/{token}")
async def verify_user(token:str,db:Session= Depends(get_db)):
    user = await get_current_user(db,token)
    if user:
        return {"Authentication Status":f'Successfull! by {user.username}'}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers= {"WWW-Authenticate":"Bearer"}
            )


@app.post("/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db), current_user:User= Depends(get_current_user)):
    if current_user:
        if current_user.username == 'pedro':
            db_user = await get_user_by_username(db, username=user.username)
            if db_user:
                raise HTTPException(status_code=400, detail="Username already exists")
            else:
                return await create_user(db= db, user= user)

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm= Depends() , db:Session= Depends(get_db)):
    user= await authenticate_user(db, form_data.username,form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers= {"WWW-Authenticate":"Bearer"}
            )
    access_token_expires = timedelta(minutes= ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token=await create_access_token(
        user=user.username, expires_delta=access_token_expires
    )    
    return {"access_token":access_token, "token_type":"bearer"}


@app.post("/creat/item")
async def create_items(
    item: ItemCreate,
    current_user:User= Depends(get_current_user),
    db:Session= Depends(get_db)
    ):
    old_item= await get_item_by_name(db=db,name= item.name)
    if current_user:
        if not old_item:
            return await create_item(db,item,current_user.username)
        else:
            raise HTTPException(status_code=400, detail="This Item already exists")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )

@app.post("/creat/item-with-images", tags=["Item Management"])
async def create_item_with_images(
    name: str = Form(...),
    cost: float = Form(...),
    price: float = Form(...),
    tax: float = Form(0),
    price_USD: float = Form(...),
    cant: int = Form(...),
    category: str = Form(...),
    detalles: str = Form(""),
    seller: str = Form(...),
    images: list[UploadFile] = File([]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new item with multiple images - OPTIMIZED VERSION"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Check if item already exists
    old_item = await get_item_by_name(db=db, name=name)
    if old_item:
        raise HTTPException(status_code=400, detail="This Item already exists")
    
    # Handle multiple image uploads using optimized system
    image_urls = await save_uploaded_images(images, current_user.username, name)
    
    # Create ItemCreate object with image URLs
    item_data = ItemCreate(
        name=name,
        cost=cost,
        price=price,
        tax=tax,
        price_USD=price_USD,
        cant=cant,
        category=category,
        detalles=detalles,
        seller=seller,
        images=image_urls  # List of URLs
    )
    
    return await create_item(db, item_data, current_user.username)


@app.get('/store/{seller}/items', response_model=list[PublicItemResponse])
async def public_store_items(seller: str, db: Session = Depends(get_db)):
    """Public endpoint to get items for a given seller (store view).
    Returns only public information: name, price, quantity, image, and details."""
    items = await get_items_by_seller(seller, db)
    # Convertir a PublicItemResponse para ocultar información sensible
    return [PublicItemResponse.model_validate(item) for item in items]


@app.get('/store/{seller}/categories')
async def public_store_categories(seller: str, db: Session = Depends(get_db)):
    """Public endpoint to get categories for a given seller."""
    return await get_category_by_seller(db, seller)

@app.post("/create/category")
async def create_categories(category:CategoryCreate,db:Session= Depends(get_db), current_user:User= Depends(get_current_user)):
    old_category= await get_category_by_name(db=db,name=category.name,username=current_user.username)
    if current_user:
        if not old_category:
            return await create_category(db=db,name=category.name,username=current_user.username)
        else:
            raise HTTPException(status_code=400, detail="This Category already exists")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )


@app.post("/create/sale")
async def create_item_sold(sale:SaleCreate, current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    if current_user:
        item=await get_item_by_name(db=db,name=sale.name)
        print(item)
        item.cant= item.cant-sale.cant
        await update_item(item_id=item.id,item= item,db=db)
        await create_sale(db, item, sale.gender,sale.date, sale.cant, revenuE= sale.revenue,  revenuE_USD=sale.revenue_USD)
        return "Sale created"
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )


@app.post("/customers")
async def create_customer_endpoint(customer: CustomerCreate, db: Session = Depends(get_db)):
    existing = await get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
    return await create_customer(db, customer)


@app.get("/customers/{customer_id}")
async def get_customer_endpoint(customer_id: str, db: Session = Depends(get_db)):
    cust = await get_customer_by_id(db, customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust


@app.post("/orders")
async def create_order_endpoint(order: OrderCreate, db: Session = Depends(get_db)):
    return await create_order(db, order)


@app.get("/orders/customer/{customer_id}")
async def get_orders_customer(customer_id: str, db: Session = Depends(get_db)):
    return await get_orders_by_customer(db, customer_id)


@app.get("/orders/seller/{seller}")
async def get_orders_seller(seller: str, db: Session = Depends(get_db)):
    return await get_orders_by_seller(db, seller)


@app.post("/upload-image")
async def upload_image(product_id: str = Form(...), file: UploadFile = File(...)):
    # Save the uploaded image to ./uploads and return its public URL
    ext = os.path.splitext(file.filename)[1]
    filename = f"{product_id}_{_uuid.uuid4().hex}{ext}"
    path = os.path.join("uploads", filename)
    contents = await file.read()
    with open(path, "wb") as f:
        f.write(contents)
    return {"filename": filename, "url": f"/uploads/{filename}"}

    
    
'''
{
  "name": "gafas",
  "cost": 0.50,
  "price": 1100,
  "tax": 0,
  "price_USD": 0,
  "cant": 4,
  "seller": "seller"
}
'''    
    
        
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
            detail="You're not the owner of that item !",
            headers= {"WWW-Authenticate":"Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )

@app.delete("/delete/category/{category_id}")
async def delete_categories(category_id:str,db:Session= Depends(get_db),current_user:User= Depends(get_current_user)):
    category= await get_category(db=db,id=category_id)
    if current_user:
        if (category.category_of == current_user.username):
            await delete_category(db=db,id=category_id)
            return "Deleted"
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )
        
@app.delete("/delete/sale/{sale_id}")
async def delete_items_sold(sale_id:str,current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    sale= await get_sale_by_id(db=db,id=sale_id)
    if current_user:
        if (sale.seller == current_user.username):
            await delete_sale(sale_id=sale_id,db= db)
            return "Deleted!"
        else:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not the owner of that item !",
            headers= {"WWW-Authenticate":"Bearer"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )

@app.put("/edit/item/{item_id}")
async def edit_users(item_id,item:ItemCreate,current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    current_item = await get_item_by_id(item_id=item_id,db= db)
    if current_user:
        if (current_item.seller == current_user.username):
            print('Item in /edit/item',item)
            return await  update_item(item_id=item_id,item=item,db= db)
             
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the owner of that item !",
                headers= {"WWW-Authenticate":"Bearer"}
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )

@app.put("/edit/category/{category_id}")
async def edit_category(category_id:str, category:CategoryCreate ,current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    current_category = await get_category(db=db,id=category_id)
    if current_user:
        if (current_category.category_of == current_user.username):
            await update_item_categories(db=db,old_category=current_category.name,updated_cat=category.name)
            return await update_category(db=db,id=category_id,name=category.name)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the maker of this category !",
                headers= {"WWW-Authenticate":"Bearer"}
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )


@app.put("/edit/item_sold/{sale_id}")
async def edit_sales(sale_id,sale:SaleEdit,current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    item_sold = await get_sale_by_id(db=db,id=sale_id)
    item= await get_item_by_name(db=db,name= item_sold.name)
    print(item.tax)
    if current_user:
        if (item_sold.seller == current_user.username):
            await  update_sale(sale_id=sale_id,db=db,sale=sale,tax=item.tax)
            return "Updated!"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You're not the owner of that item !",
                headers= {"WWW-Authenticate":"Bearer"}
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )
        
@app.get("/{path:path}")
async def catch_all(path: str, request:Request):
    print(request.client)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
                f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tryed to find a vulnerability with method:GET - path:{path}"+ "\n")
                
        # Execute firewall commands (will be skipped on Windows or if disabled)
        execute_firewall_commands(ip)
        
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")

# =============================
# Optimized Image Management System
# =============================

def create_vendor_folder(username: str) -> str:
    """Create vendor-specific folder structure"""
    vendor_folder = f"uploads/{username}"
    os.makedirs(vendor_folder, exist_ok=True)
    return vendor_folder

def generate_unique_filename(vendor: str, product_name: str, original_filename: str) -> str:
    """Generate unique filename with vendor and product context"""
    file_extension = original_filename.split(".")[-1].lower()
    # Clean product name for filename
    clean_product = "".join(c for c in product_name if c.isalnum() or c in ('-', '_')).strip()[:20]
    unique_id = _uuid.uuid4().hex[:8]
    return f"{vendor}_{clean_product}_{unique_id}.{file_extension}"

async def save_uploaded_images(images: list[UploadFile], vendor: str, product_name: str) -> list[str]:
    """Save multiple uploaded images and return their URLs"""
    if not images or not any(img.filename for img in images):
        return []
    
    vendor_folder = create_vendor_folder(vendor)
    image_urls = []
    
    for image in images:
        if image.filename:
            # Generate unique filename
            unique_filename = generate_unique_filename(vendor, product_name, image.filename)
            file_path = f"{vendor_folder}/{unique_filename}"
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)
            
            # Store URL path (served by FastAPI static files)
            image_urls.append(f"/uploads/{vendor}/{unique_filename}")
    
    return image_urls

@app.post("/items/{item_id}/add-images", tags=["Image Management"])
async def add_item_images(
    item_id: str,
    images: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add images to existing item - OPTIMIZED VERSION"""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorized")
    
    # Get the item
    item = await get_item_by_id(item_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user owns the item
    if item.seller != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to edit this item")
    
    # Get existing images
    existing_images = []
    if hasattr(item, 'images') and item.images:
        try:
            existing_images = json.loads(item.images)
        except:
            existing_images = []
    
    # Upload new images using optimized system
    new_image_urls = await save_uploaded_images(images, current_user.username, item.name)
    
    # Combine existing and new images
    all_images = existing_images + new_image_urls
    
    # Update item in database
    item.images = json.dumps(all_images)
    db.commit()
    
    return {
        "message": f"Added {len(new_image_urls)} images", 
        "total_images": len(all_images),
        "new_images": new_image_urls
    }

@app.delete("/items/{item_id}/images/{image_index}", tags=["Image Management"])
async def remove_item_image(
    item_id: str,
    image_index: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove specific image from item by index - OPTIMIZED VERSION"""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorized")
    
    # Get the item
    item = await get_item_by_id(item_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if user owns the item
    if item.seller != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to edit this item")
    
    # Get existing images
    try:
        images = json.loads(item.images) if hasattr(item, 'images') and item.images else []
    except:
        images = []
    
    if image_index < 0 or image_index >= len(images):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Remove image file from disk
    image_path = images[image_index]
    if image_path.startswith('/uploads/'):
        file_path = image_path[1:]  # Remove leading slash
        if os.path.exists(file_path):
            os.remove(file_path)
    
    # Remove from list
    removed_image = images.pop(image_index)
    
    # Update item
    item.images = json.dumps(images)
    db.commit()
    
    return {
        "message": "Image removed", 
        "removed_image": removed_image,
        "remaining_images": len(images)
    }

@app.post("/{path:path}")
async def catch_all(path: str, request:Request):
    print(request.client.host)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
                f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tryed to find a vulnerability with method:POST - path:{path}"+ "\n")
        
        # Execute firewall commands (will be skipped on Windows or if disabled)
        execute_firewall_commands(ip)
        
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")

@app.delete("/{path:path}")
async def catch_all(path: str, request:Request):
    print(request.client.host)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
                f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tryed to find a vulnerability with method:DELETE - path:{path}"+ "\n")
        
        # Execute firewall commands (will be skipped on Windows or if disabled)
        execute_firewall_commands(ip)
        
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")

@app.put("/{path:path}")
async def catch_all(path: str, request:Request):
    print(request.client.host)
    print(request.headers)
    if not is_allowed_host(request.headers.get('host', '')):
        ip = request.client.host
        with open("ips.txt", "a") as f:
                f.write(f"IP:{ip} - hostname:{request.headers.get('host')} - date:{datetime.now()} tryed to find a vulnerability with method:PUT - path:{path}"+ "\n")
        
        # Execute firewall commands (will be skipped on Windows or if disabled)
        execute_firewall_commands(ip)
        
        raise HTTPException(status_code=404, detail="What are you trying to do motherfucker?")



            

            
            


    
