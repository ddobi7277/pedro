from fastapi import FastAPI, WebSocket,Depends,  HTTPException, status
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from fastapi import FastAPI,Form
from .shcema import UserCreate,ItemCreate,SaleCreate,SaleEdit,CategoryCreate
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
from .services import *
from .models import User
from sqlalchemy.orm import Session
from websockets import WebSocketServerProtocol
app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

origins= ["https://equity-limitation-terry-provider.trycloudflare.com/login","http://localhost:3000","https://equity-limitation-terry-provider.trycloudflare.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins= origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
class WebSocketServer(WebSocketServerProtocol):
    async def on_connect(self):
        await self.send("You are connected!")

    async def on_receive(self, text):
        await self.send(f"You sent: {text}")

    async def on_close(self, code, reason):
        await self.send(f"Closed: {code}, {reason}")

#User.metadata.create_all(bind=engine)
@app.websocket("/wss")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send("Connected!")

    while True:
        data = await websocket.receive()
        if isinstance(data, str):
            await websocket.send(f"You sent: {data}")
        elif isinstance(data, bytes):
            await websocket.send(f"You sent: {data.decode('utf8')}")

@app.get("/index")
async def root():
    return {"message": "Welcome to la Cuevita "}

@app.get("/users",response_model= None)
async def  read_users(current_user:User= Depends(get_current_user),db:Session= Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="You're not authorized to see this",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if current_user:
        return await get_users(db,0,100)
    
    else:
        return credentials_exception
    
@app.get("/get_seller_items")
async def get_seller_items(current_user:User= Depends(get_current_user), db:Session= Depends(get_db)):
    if current_user:
        return await get_items_by_seller(current_user.username,db)
        
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You don;t have any product or you're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )
        
@app.get("/get_seller_sales")
async def get_seller_sales(current_user:User= Depends(get_current_user), db:Session= Depends(get_db)):
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
        return {"Authentication Status":"Successfull!"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers= {"WWW-Authenticate":"Bearer"}
            )


@app.post("/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = await get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
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
        user, expires_delta=access_token_expires
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
        item.cant= item.cant-sale.cant
        await update_item(item_id=item.id,item= item,db=db)
        await create_sale(db, item, sale.gender,sale.date, sale.cant)
        return "Sale created"
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not authorized!",
            headers= {"WWW-Authenticate":"Bearer"}
            )

    
    
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
        

            

            
            


    
