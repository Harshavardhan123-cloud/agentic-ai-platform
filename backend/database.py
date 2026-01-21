import sqlite3
import os

import tempfile

DB_NAME = os.path.join(tempfile.gettempdir(), "users.db")

def get_db_connection():
    """Create a database connection."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with users table."""
    try:
        conn = get_db_connection()
        with conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT,
                    phone TEXT,
                    country TEXT
                )
            ''')
            
            # Create or Update default admin for Demo
            try:
                cur = conn.cursor()
                cur.execute("INSERT OR REPLACE INTO users (id, username, password, name, phone, country) VALUES ((SELECT id FROM users WHERE username = 'admin'), 'admin', 'admin', 'Admin User', '0000000000', 'US')")
                print("✅ Default admin user (admin/admin) ensured.")
            except Exception as e:
                print(f"Admin seed warning: {e}")
                
        conn.close()
    except Exception as e:
        print(f"DB Init Error: {e}")

def add_user(username, password, name, phone, country):
    """Add a new user with duplicate checking."""
    try:
        conn = get_db_connection()
        
        # Check for existing email/username
        existing_email = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing_email:
            conn.close()
            return {"success": False, "error": "Email already registered"}
        
        # Check for existing phone
        existing_phone = conn.execute("SELECT id FROM users WHERE phone = ?", (phone,)).fetchone()
        if existing_phone:
            conn.close()
            return {"success": False, "error": "Phone number already registered"}
        
        # Insert new user
        with conn:
            conn.execute("INSERT INTO users (username, password, name, phone, country) VALUES (?, ?, ?, ?, ?)", 
                        (username, password, name, phone, country))
        conn.close()
        return {"success": True}
    except sqlite3.IntegrityError as e:
        return {"success": False, "error": "Email or phone already registered"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def verify_user(username, password):
    """Verify user credentials."""
    # HARDCODED FAILSAFE FOR DEMO
    if username == "admin" and password == "admin":
        return True

    try:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
        
        if user and user['password'] == password:
            return True
    except Exception:
        pass
        
    return False

# Initialize on module load
try:
    init_db()
except Exception as e:
    print(f"Startup DB Error: {e}")
