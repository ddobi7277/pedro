from pydantic import BaseModel,ConfigDict



class ItemCreate(BaseModel):
    #
    #model_config = ConfigDict(from_attributes=True)
    name: str
    cost:float
    price: float
    tax: float | None = 0
    price_USD:float
    cant:int
    images: list[str] | None = None
    category:str| None= None
    seller:str | None= None
    detalles: str | None = None

class ItemEdit(BaseModel):
    """Esquema para edición de items - sin campo images"""
    name: str
    cost:float
    price: float
    tax: float | None = 0
    price_USD:float
    cant:int
    category:str| None= None
    seller:str | None= None
    detalles: str | None = None
    
class CategoryCreate(BaseModel):
    name: str
        

class UserCreate(BaseModel):
    #model_config = ConfigDict(from_attributes=True)
    username:str
    full_name: str
    hashed_password: str
    is_admin: bool = False

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    full_name: str
    is_admin: bool

class UserUpdate(BaseModel):
    username: str | None = None
    full_name: str | None = None
    is_admin: bool | None = None
    
class SaleCreate(BaseModel):
    #model_config = ConfigDict(from_attributes=True)
    name:str
    cant:int
    gender:str
    date:str
    revenue:float
    revenue_USD:float
    
class SaleEdit(BaseModel):
    #model_config = ConfigDict(from_attributes=True)
    price:float 
    cant:int
    price_USD:float
    revenue:float
    revenue_USD:float


class CustomerCreate(BaseModel):
    name: str
    gender: str | None = None
    address: str | None = None
    payment_method: str | None = None
    email: str


class CustomerRead(BaseModel):
    id: str
    name: str
    gender: str | None = None
    address: str | None = None
    payment_method: str | None = None
    email: str
    created_at: str | None = None


class OrderCreate(BaseModel):
    customer_id: str
    item_id: str | None = None
    item_name: str
    total_cost: float
    thumbnail: str | None = None
    date: str
    status: str | None = 'pending'
    seller: str | None = None


class OrderRead(BaseModel):
    id: str
    customer_id: str
    item_id: str | None = None
    item_name: str
    total_cost: float
    thumbnail: str | None = None
    date: str
    status: str
    seller: str | None = None

class PublicItemResponse(BaseModel):
    """Modelo de respuesta para la vista pública de items - solo muestra información necesaria para los clientes"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str
    price: float
    cant: int
    image: str | None = None
    detalles: str | None = None

class ImageRemove(BaseModel):
    """Modelo para eliminar una imagen específica"""
    image_url: str

 
