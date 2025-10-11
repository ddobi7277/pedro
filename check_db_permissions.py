#!/usr/bin/env python3
"""
Script para verificar permisos de la base de datos
"""
import os
import stat

def check_database_permissions():
    """Verificar permisos de la base de datos"""
    db_path = "files/data.db"
    files_dir = "files/"
    
    print("🔍 Checking database permissions...")
    
    # Verificar si existe
    if not os.path.exists(db_path):
        print(f"❌ Database file does not exist: {db_path}")
        return
    
    # Información del archivo
    file_stat = os.stat(db_path)
    file_mode = stat.filemode(file_stat.st_mode)
    
    print(f"📁 Database file: {db_path}")
    print(f"📋 File permissions: {file_mode}")
    print(f"📋 Octal permissions: {oct(file_stat.st_mode)[-3:]}")
    print(f"👤 Owner UID: {file_stat.st_uid}")
    print(f"👥 Group GID: {file_stat.st_gid}")
    print(f"📏 File size: {file_stat.st_size} bytes")
    
    # Verificar permisos de escritura
    if os.access(db_path, os.W_OK):
        print("✅ File is writable by current process")
    else:
        print("❌ File is NOT writable by current process")
    
    # Verificar directorio
    dir_stat = os.stat(files_dir)
    dir_mode = stat.filemode(dir_stat.st_mode)
    
    print(f"\n📁 Directory: {files_dir}")
    print(f"📋 Directory permissions: {dir_mode}")
    print(f"📋 Octal permissions: {oct(dir_stat.st_mode)[-3:]}")
    
    if os.access(files_dir, os.W_OK):
        print("✅ Directory is writable by current process")
    else:
        print("❌ Directory is NOT writable by current process")
    
    # Información del proceso actual
    print(f"\n🔧 Current process info:")
    print(f"👤 Current UID: {os.getuid()}")
    print(f"👥 Current GID: {os.getgid()}")
    
    # Sugerencias
    print(f"\n💡 Suggested fixes:")
    print(f"chmod 664 {db_path}")
    print(f"chmod 775 {files_dir}")
    if hasattr(os, 'getlogin'):
        try:
            username = os.getlogin()
            print(f"chown {username}:{username} {db_path}")
        except:
            print(f"chown <user>:<group> {db_path}")

if __name__ == "__main__":
    check_database_permissions()