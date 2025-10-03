#!/usr/bin/env python3
"""
Script para verificar usuarios en la base de datos
"""
import sys
import os

# Add current directory to path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

def check_users():
    """Check all users in the database"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"📊 Total users in database: {len(users)}")
        
        for user in users:
            print(f"👤 User ID: {user.id}")
            print(f"   Username: {repr(user.username)}")
            print(f"   Full Name: {repr(user.full_name)}")
            print(f"   Is Admin: {user.is_admin}")
            print(f"   Password Hash: {user.hashed_password[:20]}..." if user.hashed_password else "   Password Hash: None")
            print("   ---")
            
        # Check for NULL usernames
        null_users = db.query(User).filter(User.username == None).all()
        if null_users:
            print(f"⚠️  Found {len(null_users)} users with NULL username!")
            for user in null_users:
                print(f"   - User ID: {user.id}, Full Name: {user.full_name}")
        else:
            print("✅ No users with NULL username found")
            
    except Exception as e:
        print(f"❌ Error checking users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()