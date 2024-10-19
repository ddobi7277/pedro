from datetime import datetime, timedelta, timezone
import jwt
from .database import SessionLocal
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from .shcema import UserCreate,ItemCreate,SaleCreate,SaleEdit,CategoryCreate
from .models import User,Item,Sales,Category
import uuid
from sqlalchemy.orm import Session
from fastapi import Depends,  HTTPException, status
from fastapi.security import OAuth2PasswordBearer


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
    return  db.query(Item).filter(Item.seller == user).order_by(Item.category).all()

async def get_item_by_id(item_id:str,db:Session):
    return db.query(Item).filter(Item.id == item_id).first()

async def get_items_by_category(db:Session, category:str):
    return db.query(Item).filter(Item.category == category).all()

async def create_user(db:Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.hashed_password)
    db_user= User(id= str(uuid.uuid4()),username= user.username, full_name= user.full_name, hashed_password= hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

async def create_item(db:Session, item:ItemCreate, username:str):
    print(item)
    db_item = Item(id=str(uuid.uuid4()),name= item.name, cost= item.cost, price= item.price, tax=round(item.tax,2),price_USD= round(item.price/300,2), cant= item.cant,category=item.category,seller= username )
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

async def create_sale(db:Session, item:ItemCreate, gender:str, date:str,sale_cant:int):
    print(item)
    db_item_sold = Sales(
        id=str(uuid.uuid4()),
        name= item.name,
        cost= item.cost+item.tax,
        price= item.price,
        price_USD= item.price_USD,
        cant= sale_cant,
        revenue= round((item.price-((item.tax*300)+(item.cost*300))),2),
        revenue_USD= round((item.price_USD - (item.tax+item.cost)),2),
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
    
async def update_item(item_id:str, item: ItemCreate, db:Session):
    old_item= db.query(Item).filter(Item.id == item_id).first()
    old_item.name= item.name
    old_item.cost= item.cost+item.tax
    old_item.price= item.price
    old_item.tax= round((item.tax),2)
    old_item.price_USD= round(item.price,2)
    old_item.cant= item.cant
    old_item.category = item.category
    db.commit()
    db.refresh(old_item)
    
    return old_item

async def update_category(db:Session,id:str,name:str):
    db_category = db.query(Category).filter(Category.id == id).first()
    db_category.name= name
    db.commit()
    db.refresh(db_category)
    return db_category

async def update_sale(sale_id:str,db:Session, sale:SaleEdit,tax:float):
    old_sale= db.query(Sales).filter(Sales.id == sale_id).first()
    old_sale.price= sale.price
    old_sale.price_USD= round(sale.price/300,2)
    old_sale.cant= sale.cant 
    old_sale.revenue= round((sale.price-((old_sale.cost*0.16*300)+(old_sale.cost*300))),2)
    old_sale.revenue_USD= round((sale.price/300 - (tax+old_sale.cost)),2)
    db.commit()
    db.refresh(old_sale)
    return old_sale

async def update_item_categories(db:Session,old_category:str,updated_cat:str):
    db.query(Item).filter(Item.category == old_category).update({Item.category:updated_cat})
    return "Updated"
    
    



def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

async def authenticate_user(db:Session , username: str, password: str):
    user =await get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def create_access_token(user:User, expires_delta: timedelta | None = None):
    user_en = UserCreate.model_validate(user)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        
    payload = {
        'sub': user_en.username,
        'exp': expire
    }
    
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(db:Session= Depends(get_db), token: str= Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username:str= payload.get('sub')
        print(username)
        user=await get_user_by_username(db,username)
        if user is None:
            raise credentials_exception 
    except InvalidTokenError:
        raise credentials_exception
    user_ob= UserCreate.model_validate(user)
    if user:
        return user_ob
    else:
        return credentials_exception

