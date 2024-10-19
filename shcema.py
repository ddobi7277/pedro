from pydantic import BaseModel,ConfigDict


class ItemCreate(BaseModel):
    #
    model_config = ConfigDict(from_attributes=True)
    name: str
    cost:float
    price: float
    tax: float | None = 0
    price_USD:float
    cant:int
    category:str| None= None
    seller:str | None= None
    
class CategoryCreate(BaseModel):
    name: str
        

class UserCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username:str
    full_name: str
    hashed_password: str
    
class SaleCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name:str
    cant:int
    gender:str
    date:str
    
class SaleEdit(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    price:float 
    cant:int

 
