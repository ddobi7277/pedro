#!/usr/bin/env python3
"""
Fixed and optimized FastAPI endpoints for image management
"""

# Add these imports to main.py if not already present
import json
import os
import uuid as _uuid
from fastapi import UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

# Optimized image management functions
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

# Example of how the optimized endpoint should look:
"""
@app.post("/creat/item", tags=["Item Management"])
async def create_items(
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
    # Authorization check
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authorized")
    
    # Check if item exists
    old_item = await get_item_by_name(db=db, name=name)
    if old_item:
        raise HTTPException(status_code=400, detail="Item already exists")
    
    # Handle image uploads
    image_urls = await save_uploaded_images(images, current_user.username, name)
    
    # Create item with image URLs
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
        images=image_urls  # List of URLs, not files
    )
    
    return await create_item(db, item_data, current_user.username)
"""