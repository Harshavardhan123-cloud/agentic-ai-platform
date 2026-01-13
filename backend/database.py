import sqlite3
import os

DB_NAME = "users.db"

def get_db_connection():
    """Create a database connection."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with users table."""
    conn = get_db_connection()
    with conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        
        # Create default admin if not exists
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = ?", ("admin",))
        if not cur.fetchone():
            cur.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
                       ("admin", "AgenticAI2026!"))
            print("✅ Default admin user created.")
            
    conn.close()

def add_user(username, password):
    """Add a new user."""
    try:
        conn = get_db_connection()
        with conn:
            conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
                        (username, password))
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def verify_user(username, password):
    """Verify user credentials."""
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user and user['password'] == password:
        return True
    return False

# Initialize on module load
if not os.path.exists(DB_NAME):
    init_db()
else:
    init_db() # Ensure table exists
