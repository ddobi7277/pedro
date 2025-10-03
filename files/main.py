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
import json


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
    print(f"[LOGIN] Login attempt for username: {form_data.username}")
    user= await authenticate_user(db, form_data.username,form_data.password)
    if not user:
        print(f"[LOGIN] Authentication failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers= {"WWW-Authenticate":"Bearer"}
            )
    
    print(f"[LOGIN] User authenticated: {user.username}, ID: {user.id}")
    print(f"[LOGIN] User object attributes: username={user.username}, full_name={user.full_name}, is_admin={user.is_admin}")
    
    access_token_expires = timedelta(minutes= ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token=await create_access_token(
        user_data={"username": user.username, "is_admin": user.is_admin}, expires_delta=access_token_expires
    )    
    print(f"[LOGIN] Token created for user: {user.username}")
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
async def upload_image(
    product_id: str = Form(...), 
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Crear la estructura de carpetas: uploads/vendedor/id_producto/
    vendor_folder = f"uploads/{current_user.username}"
    product_folder = f"{vendor_folder}/{product_id}"
    
    # Crear las carpetas si no existen
    os.makedirs(product_folder, exist_ok=True)
    
    # Generar nombre único para la imagen
    ext = os.path.splitext(file.filename)[1]
    filename = f"{current_user.username}_{file.filename.split('.')[0]}_{_uuid.uuid4().hex[:8]}{ext}"
    
    # Ruta completa del archivo
    file_path = os.path.join(product_folder, filename)
    
    # Guardar archivo
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # URL para la base de datos
    image_url = f"/uploads/{current_user.username}/{product_id}/{filename}"
    
    return {"filename": filename, "url": image_url}

    
    
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

# Endpoint simple para eliminar imagen por nombre
@app.post("/items/{item_id}/delete-image")
async def delete_image_simple(
    item_id: str,
    image_name: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar imagen física y de la base de datos"""
    # Verificar que el item existe y pertenece al usuario - SIN process_item_images
    current_item = db.query(Item).filter(Item.id == item_id).first()
    if not current_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if current_item.seller != current_user.username:
        raise HTTPException(status_code=401, detail="You're not the owner of that item!")
    
    # 1. Borrar archivo físico
    # La imagen está en uploads/vendedor/id_producto/imagen.png
    file_path = f"uploads/{current_user.username}/{item_id}/{image_name}"
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted file: {file_path}")
        else:
            print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # 2. Quitar de la base de datos - trabajar directamente con el string JSON
    existing_images = []
    if current_item.images:
        try:
            existing_images = json.loads(current_item.images)
        except:
            existing_images = []
    
    # Buscar y eliminar la imagen del array
    # La URL en BD es /uploads/vendedor/id_producto/imagen.png
    image_url_to_remove = f"/uploads/{current_user.username}/{item_id}/{image_name}"
    if image_url_to_remove in existing_images:
        existing_images.remove(image_url_to_remove)
    
    # Actualizar SOLO este item específico en la base de datos
    current_item.images = json.dumps(existing_images) if existing_images else None
    
    # Commit y refresh SOLO para este item
    try:
        db.commit()
        db.refresh(current_item)
        return {"message": "Image deleted successfully", "deleted_file": image_name}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Endpoint para agregar imágenes a un producto existente
@app.post("/items/{item_id}/add-images")
async def add_images_to_item(
    item_id: str,
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Agregar múltiples imágenes a un producto existente"""
    # Verificar que el item existe y pertenece al usuario
    current_item = await get_item_by_id(item_id=item_id, db=db)
    if not current_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if current_item.seller != current_user.username:
        raise HTTPException(status_code=401, detail="You're not the owner of that item!")
    
    # Crear la estructura de carpetas: uploads/vendedor/id_producto/
    vendor_folder = f"uploads/{current_user.username}"
    product_folder = f"{vendor_folder}/{item_id}"
    os.makedirs(product_folder, exist_ok=True)
    
    # Procesar cada archivo
    saved_images = []
    for file in files:
        # Generar nombre único
        ext = os.path.splitext(file.filename)[1]
        filename = f"{current_user.username}_{file.filename.split('.')[0]}_{_uuid.uuid4().hex[:8]}{ext}"
        
        # Guardar archivo
        file_path = os.path.join(product_folder, filename)
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # URL para la base de datos
        image_url = f"/uploads/{current_user.username}/{item_id}/{filename}"
        saved_images.append(image_url)
    
    # Obtener imágenes existentes
    existing_images = []
    if current_item.images:
        try:
            existing_images = json.loads(current_item.images)
        except:
            existing_images = []
    
    # Agregar las nuevas imágenes
    all_images = existing_images + saved_images
    
    # Actualizar en la base de datos
    current_item.images = json.dumps(all_images)
    db.commit()
    
    return {
        "message": f"Added {len(saved_images)} images successfully",
        "new_images": saved_images,
        "total_images": len(all_images)
    }

@app.put("/edit/item/{item_id}")
async def edit_users(item_id,item:ItemEdit,current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    # Usar consulta directa sin process_item_images para evitar modificaciones no deseadas
    current_item = db.query(Item).filter(Item.id == item_id).first()
    if not current_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
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



            

            
            


    
