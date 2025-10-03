#!/usr/bin/env python3
"""
Script to migrate single image field to multiple images field
"""
import sqlite3
import json
import os

def migrate_images():
    """Migrate from single image field to multiple images JSON field"""
    
    # Connect to database
    conn = sqlite3.connect('data.db')
    cursor = conn.cursor()
    
    try:
        # Add new images column if it doesn't exist
        cursor.execute("ALTER TABLE items ADD COLUMN images TEXT")
        print("Added images column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Images column already exists")
        else:
            raise e
    
    # Get all items with single image
    cursor.execute("SELECT id, image FROM items WHERE image IS NOT NULL")
    items_with_images = cursor.fetchall()
    
    print(f"Found {len(items_with_images)} items with images")
    
    # Migrate each item
    for item_id, old_image_path in items_with_images:
        if old_image_path:
            # Convert single image to array
            images_array = [old_image_path]
            images_json = json.dumps(images_array)
            
            # Update the item with the new images field
            cursor.execute(
                "UPDATE items SET images = ? WHERE id = ?",
                (images_json, item_id)
            )
            print(f"Migrated item {item_id}: {old_image_path} -> {images_json}")
    
    # Remove old image column (optional - comment out if you want to keep it for safety)
    # cursor.execute("ALTER TABLE items DROP COLUMN image")
    # print("Removed old image column")
    
    # Commit changes
    conn.commit()
    print(f"Successfully migrated {len(items_with_images)} items")
    
    conn.close()

if __name__ == "__main__":
    migrate_images()