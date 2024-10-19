from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
#from database import Base,engine
from  .database import Base
from .database import engine

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username=  Column(String, unique=True, index=True)
    full_name = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
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
    category= Column(String,index= True)
    seller = Column(String, ForeignKey("users.username"))

    owner = relationship("User", back_populates="items")
    
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String, primary_key= True)
    name= Column(String, primary_key= True)
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
    

User.metadata.create_all(bind=engine)
