from datetime import datetime, timedelta, timezone
import jwt
import json
from database import SessionLocal
# from jwt.exceptions import InvalidTokenError  # This import may not be needed
from passlib.context import CryptContext
from shcema import UserCreate,ItemCreate,ItemEdit,SaleCreate,SaleEdit,CategoryCreate, CustomerCreate, OrderCreate
from models import User,Item,Sales,Category, Customer, Order
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import Depends,  HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from shcema import UserCreate

def process_item_images(item):
    """Convert images JSON string back to list for API response"""
    if hasattr(item, 'images') and item.images:
        try:
            item.images = json.loads(item.images)
        except (json.JSONDecodeError, TypeError):
            item.images = []
    else:
        item.images = []
    return item

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
async def get_category_by_name(db:Session,name:str,username:str):
    return db.query(Category).filter(Category.name==name,Category.category_of== username).first()
async def get_category(db:Session,id:str):
    return db.query(Category).filter(Category.id == id).first()

async def get_category_by_seller(db:Session,username:str):
    return db.query(Category).filter(Category.category_of == username).all()

async def get_sale_by_seller(db:Session,username:str):
    return db.query(Sales).filter(Sales.seller == username).all()

async def get_sale_by_id(db:Session, id:str):
    return db.query(Sales).filter(Sales.id == id).first()
#The crod methods
async def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

async def get_user_by_username(db:Session, username:str):
    return db.query(User).filter(User.username == username).first()

async def get_user_by_id(id:str,db:Session):
    return db.query(User).filter(User.id == id).first()

async def get_item_by_name(db: Session, name:str):
    return db.query(Item).filter(Item.name == name).first()

async def get_items_by_seller(user: str , db:Session):   
    items = db.query(Item).filter(Item.seller == user).order_by(Item.category).all()
    return [process_item_images(item) for item in items]

async def get_item_by_id(item_id:str,db:Session):
    item = db.query(Item).filter(Item.id == item_id).first()
    return process_item_images(item) if item else None

async def get_items_by_category(db:Session, category:str):
    items = db.query(Item).filter(Item.category == category).all()
    return [process_item_images(item) for item in items]

async def create_user(db:Session, user: UserCreate):
    hashed_password = hash_password(user.hashed_password)
    db_user= User(
        id= str(uuid.uuid4()),
        username= user.username, 
        full_name= user.full_name, 
        hashed_password= hashed_password,
        is_admin= user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

async def create_item(db:Session, item:ItemCreate, username:str):
    print(item)
    
    # Convert images list to JSON string for storage
    images_json = None
    if item.images:
        images_json = json.dumps(item.images)
    
    db_item = Item(
        id=str(uuid.uuid4()),
        name=item.name, 
        cost=item.cost, 
        price=item.price, 
        tax=round(item.tax,2),
        price_USD=item.price_USD, 
        cant=item.cant, 
        images=images_json,  # Store as JSON string
        category=item.category,
        seller=username,
        detalles=getattr(item, 'detalles', None)
    )
    #print('item in create_item',db_item)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

async def create_category(db:Session, name:str , username:str):
    db_category = Category(id=str(uuid.uuid4()), name=name , category_of= username)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

async def create_sale(db:Session, item:ItemCreate, gender:str, date:str,sale_cant:int,revenuE:int,revenuE_USD:int):
    print(item)
    db_item_sold = Sales(
        id=str(uuid.uuid4()),
        name= item.name,
        cost= item.cost+item.tax,
        price= item.price,
        price_USD= item.price_USD,
        cant= sale_cant,
        revenue= revenuE,
        revenue_USD= revenuE_USD,
        gender= gender,
        date= date,
        category= item.category,
        seller= item.seller
        )

    print(db_item_sold)
    db.add(db_item_sold)
    db.commit()
    db.refresh(db_item_sold)
    return db_item_sold

'''
    
class SellsCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name:str
    cost:float
    price:float
    price_USD:float
    cant:int
    revenue:float
    gender:str
    date:str
    seller:str | None= None

'''
async def delete_category(db:Session,id:str):
    db_category = db.query(Category).filter(Category.id == id).first()
    db.delete(db_category)
    db.commit()
    
    
async def delete_user(id:str,db:Session):
    db_user = await get_user_by_id(id=id,db=db)
    if db_user:
        db.delete(db_user)
        db.commit()

async def delete_sale(sale_id:str, db:Session):
    db_sells = await get_sale_by_id(db,sale_id)
    db.delete(db_sells)
    db.commit()

async def delete_item(item_id:str, db:Session):
    item= db.query(Item).filter(Item.id == item_id).first()
    db.delete(item)
    db.commit()
    
async def update_item(item_id:str, item: ItemEdit, db:Session):
    # Obtener el item actual con consulta fresca
    old_item = db.query(Item).filter(Item.id == item_id).first()
    if not old_item:
        return None
    
    # Guardar el valor original de images para no modificarlo
    original_images = old_item.images
    
    # Actualizar SOLO los campos que están en ItemEdit, NO tocar images
    old_item.name = item.name
    old_item.cost = item.cost
    old_item.price = item.price
    old_item.tax = round((item.tax), 2)
    old_item.price_USD = item.price_USD
    old_item.cant = item.cant
    old_item.category = item.category
    old_item.detalles = item.detalles
    
    # IMPORTANTE: Asegurar que images permanece como string JSON original
    old_item.images = original_images
    
    # Hacer el commit explícito
    try:
        db.commit()
        db.refresh(old_item)
        return old_item
    except Exception as e:
        db.rollback()
        print(f"Error en update_item: {e}")
        raise e

async def update_category(db:Session,id:str,name:str):
    db_category = db.query(Category).filter(Category.id == id).first()
    db_category.name= name
    db.commit()
    db.refresh(db_category)
    return db_category

async def update_sale(sale_id:str,db:Session, sale:SaleEdit,tax:float):
    old_sale= db.query(Sales).filter(Sales.id == sale_id).first()
    old_sale.price= sale.price
    old_sale.price_USD= sale.price_USD
    old_sale.cant= sale.cant 
    old_sale.revenue= sale.revenue
    old_sale.revenue_USD= sale.revenue_USD
    db.commit()
    db.refresh(old_sale)
    return old_sale

async def update_item_categories(db:Session,old_category:str,updated_cat:str):
    db.query(Item).filter(Item.category == old_category).update({Item.category:updated_cat})
    return "Updated"
    
    



def hash_password(password):
    # Bcrypt tiene un límite de 72 bytes, así que truncamos si es necesario
    if isinstance(password, str):
        password = password.encode('utf-8')
    
    # Truncar a 72 bytes si es necesario
    if len(password) > 72:
        password = password[:72]
    
    return pwd_context.hash(password.decode('utf-8') if isinstance(password, bytes) else password)


def verify_password(plain_password, hashed_password):
    # Bcrypt tiene un límite de 72 bytes, así que truncamos si es necesario
    if isinstance(plain_password, str):
        password_bytes = plain_password.encode('utf-8')
    else:
        password_bytes = plain_password
    
    # Truncar a 72 bytes si es necesario
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    # Convertir de vuelta a string para passlib
    password_to_verify = password_bytes.decode('utf-8') if isinstance(password_bytes, bytes) else password_bytes
    
    return pwd_context.verify(password_to_verify, hashed_password)

async def authenticate_user(db:Session , username: str, password: str):
    user =await get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def create_access_token(user_data: dict, expires_delta: timedelta | None = None):
    print(f"[TOKEN] Creating token with user_data: {user_data}")
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        
    username = user_data.get('username') if isinstance(user_data, dict) else user_data
    is_admin = user_data.get('is_admin', False) if isinstance(user_data, dict) else False
    
    print(f"[TOKEN] Extracted username: {repr(username)}, is_admin: {is_admin}")
        
    payload = {
        'sub': username,
        'is_admin': is_admin,
        'exp': expire
    }
    print(f"[TOKEN] Final payload: {payload}")
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    print(f"[TOKEN] Encoded JWT created successfully")
    return encoded_jwt


async def get_current_user(db:Session= Depends(get_db), token: str= Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check for null or invalid tokens first
    if not token or token == "null" or token == "undefined" or len(token.strip()) < 10:
        print(f"[TOKEN] Invalid or null token received: '{token}'")
        raise credentials_exception
    
    try:
        print(f"[TOKEN] Decoding token: {token[:50]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"[TOKEN] Token payload: {payload}")
        username:str= payload.get('sub')
        print(f"[TOKEN] Extracted username from token: {username}")
        user=await get_user_by_username(db,username)
        print(f"[TOKEN] Found user from DB: {user.username if user else 'None'}")
        if user is None:
            print("[TOKEN] User not found in database")
            raise credentials_exception 
    except Exception as e:
        print(f"[TOKEN] Token validation error: {e}")
        raise credentials_exception
    #user_ob= UserCreate.model_validate(user)
    if user:
        return user
    else:
        return credentials_exception


### Customers and Orders helper functions
async def create_customer(db:Session, customer: 'CustomerCreate'):
    from shcema import CustomerCreate
    db_customer = Customer(
        id=str(uuid.uuid4()),
        name=customer.name,
        gender=customer.gender,
        address=customer.address,
        payment_method=customer.payment_method,
        email=customer.email,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


async def get_customer_by_id(db:Session, customer_id:str):
    return db.query(Customer).filter(Customer.id == customer_id).first()


async def get_customer_by_email(db:Session, email:str):
    return db.query(Customer).filter(Customer.email == email).first()


async def create_order(db:Session, order: 'OrderCreate'):
    from shcema import OrderCreate
    db_order = Order(
        id=str(uuid.uuid4()),
        customer_id=order.customer_id,
        item_id=order.item_id,
        item_name=order.item_name,
        total_cost=order.total_cost,
        thumbnail=order.thumbnail,
        date=order.date,
        status=order.status or 'pending',
        seller=order.seller
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


async def get_orders_by_customer(db:Session, customer_id:str):
    return db.query(Order).filter(Order.customer_id == customer_id).all()


async def get_orders_by_seller(db:Session, seller:str):
    return db.query(Order).filter(Order.seller == seller).all()

# =============================
# Admin User Management Functions
# =============================

async def get_all_users(db: Session):
    """Get all users (admin only)"""
    return db.query(User).all()

async def get_user_by_id(db: Session, user_id: str):
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()

async def update_user(db: Session, user_id: str, user_update: dict):
    """Update user information (admin only)"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    for key, value in user_update.items():
        if hasattr(db_user, key) and value is not None:
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

async def delete_user(db: Session, user_id: str):
    """Delete user (admin only)"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    # Don't allow deleting the main admin user
    if db_user.username == "pedro":
        raise ValueError("Cannot delete main admin user")
    
    db.delete(db_user)
    db.commit()
    return True

async def propagate_username_change(db: Session, old_username: str, new_username: str):
    """Propagate username changes to all related tables"""
    try:
        # Update items table - seller field
        db.execute(
            text("UPDATE items SET seller = :new_username WHERE seller = :old_username"),
            {"new_username": new_username, "old_username": old_username}
        )
        
        # Update sales table - seller field  
        db.execute(
            text("UPDATE sales SET seller = :new_username WHERE seller = :old_username"),
            {"new_username": new_username, "old_username": old_username}
        )
        
        # Update categories table - category_of field
        db.execute(
            text("UPDATE categories SET category_of = :new_username WHERE category_of = :old_username"),
            {"new_username": new_username, "old_username": old_username}
        )
        
        # Update orders table - seller field
        db.execute(
            text("UPDATE orders SET seller = :new_username WHERE seller = :old_username"),
            {"new_username": new_username, "old_username": old_username}
        )
        
        db.commit()
        return True
        
    except Exception as e:
        db.rollback()
        raise e

