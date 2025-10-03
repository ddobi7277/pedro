from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
#from database import Base,engine
from  database import Base
from database import engine


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username=  Column(String, unique=True, index=True)
    full_name = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    
    items = relationship("Item", back_populates="owner")
    sales= relationship("Sales", back_populates="owner")
    category= relationship("Category", back_populates="owner")
    
    
class Item(Base):
    __tablename__ = "items"

    id = Column(String, primary_key=True)
    name = Column(String, index=True)
    cost = Column(Float, index=True)
    price = Column(Float, index=True)
    tax = Column(Float, index=True)
    price_USD = Column(Float, index=True)
    cant= Column(Integer, index= True)
    images = Column(String, nullable=True)  # JSON string to store multiple image paths
    category= Column(String,index= True)
    seller = Column(String, ForeignKey("users.username"))
    detalles = Column(String, nullable=True)

    owner = relationship("User", back_populates="items")
    
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String, primary_key= True)
    name= Column(String)
    category_of= Column(String, ForeignKey("users.username"))
    
    owner= relationship('User', back_populates='category')
    
    
class Sales(Base):
    __tablename__ = "sales"
    id = Column(String, primary_key=True)
    name = Column(String, index=True)
    cost = Column(Float, index=True)
    price = Column(Float, index=True)
    price_USD = Column(Float, index=True)
    cant= Column(Integer, index= True)
    revenue= Column(Float, index= True)
    revenue_USD= Column(Float, index= True)
    gender= Column(String, index= True)
    date= Column(String, index= True)
    category= Column(String,index= True)
    seller = Column(String, ForeignKey("users.username"))

    owner = relationship("User", back_populates="sales")
    

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True)
    name = Column(String, index=True)
    gender = Column(String, index=True)
    address = Column(String)
    payment_method = Column(String)
    email = Column(String, unique=True, index=True)
    created_at = Column(String, index=True)

    orders = relationship('Order', back_populates='customer')


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey('customers.id'))
    item_id = Column(String, ForeignKey('items.id'), nullable=True)
    item_name = Column(String)
    total_cost = Column(Float)
    thumbnail = Column(String, nullable=True)
    date = Column(String, index=True)
    status = Column(String, index=True)
    seller = Column(String, ForeignKey('users.username'), index=True)

    customer = relationship('Customer', back_populates='orders')

User.metadata.create_all(bind=engine)
