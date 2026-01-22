import sqlite3
import os
from datetime import datetime

# Use persistent storage in backend/data instead of temp directory
DB_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DB_DIR, exist_ok=True)
DB_NAME = os.path.join(DB_DIR, "users.db")

def get_db_connection():
    """Create a database connection."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with users and sessions tables."""
    try:
        conn = get_db_connection()
        with conn:
            # Users table with is_blocked column
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT,
                    phone TEXT,
                    country TEXT,
                    subscription_plan TEXT DEFAULT 'free',
                    payment_status TEXT DEFAULT 'none',
                    is_blocked INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Active sessions table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS active_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    username TEXT,
                    login_time TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            # Migrations for existing tables
            try:
                conn.execute("ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT 'free'")
            except: pass
            
            try:
                conn.execute("ALTER TABLE users ADD COLUMN payment_status TEXT DEFAULT 'none'")
            except: pass
            
            try:
                conn.execute("ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0")
            except: pass
            
            try:
                conn.execute("ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP")
            except: pass
            
            # Create or Update default admin for Demo
            try:
                cur = conn.cursor()
                cur.execute("INSERT OR REPLACE INTO users (id, username, password, name, phone, country, is_blocked, subscription_plan) VALUES ((SELECT id FROM users WHERE username = 'admin'), 'admin', 'admin', 'Admin User', '0000000000', 'US', 0, 'pro')")
                print("✅ Default admin user (admin/admin) ensured.")
            except Exception as e:
                print(f"Admin seed warning: {e}")
                
        conn.close()
    except Exception as e:
        print(f"DB Init Error: {e}")

def add_user(username, password, name, phone, country, subscription_plan='free', payment_status='none'):
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
            conn.execute("INSERT INTO users (username, password, name, phone, country, subscription_plan, payment_status, is_blocked) VALUES (?, ?, ?, ?, ?, ?, ?, 0)", 
                        (username, password, name, phone, country, subscription_plan, payment_status))
        conn.close()
        return {"success": True}
    except sqlite3.IntegrityError as e:
        return {"success": False, "error": "Email or phone already registered"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def verify_user(username, password):
    """Verify user credentials and check if blocked."""
    # HARDCODED FAILSAFE FOR DEMO
    if username == "admin" and password == "admin":
        return {"valid": True, "blocked": False}

    try:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
        
        if user and user['password'] == password:
            if user['is_blocked']:
                return {"valid": True, "blocked": True}
            return {"valid": True, "blocked": False}
    except Exception:
        pass
        
    return {"valid": False, "blocked": False}

# ===== Admin Functions =====

def get_all_users():
    """Get all registered users."""
    try:
        conn = get_db_connection()
        users = conn.execute("SELECT id, username, name, phone, country, is_blocked, created_at FROM users WHERE username != 'admin'").fetchall()
        conn.close()
        return [dict(u) for u in users]
    except Exception as e:
        print(f"Error getting users: {e}")
        return []

def get_active_sessions():
    """Get all active sessions."""
    try:
        conn = get_db_connection()
        sessions = conn.execute("SELECT * FROM active_sessions").fetchall()
        conn.close()
        return [dict(s) for s in sessions]
    except Exception as e:
        print(f"Error getting sessions: {e}")
        return []

def add_session(user_id, username):
    """Add a new login session."""
    try:
        conn = get_db_connection()
        # Remove existing session for this user
        conn.execute("DELETE FROM active_sessions WHERE username = ?", (username,))
        # Add new session
        conn.execute("INSERT INTO active_sessions (user_id, username, login_time) VALUES (?, ?, ?)",
                    (user_id, username, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error adding session: {e}")
        return False

def remove_session(username):
    """Remove a user's session (logout)."""
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM active_sessions WHERE username = ?", (username,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error removing session: {e}")
        return False

def block_user(user_id):
    """Block a user by ID."""
    try:
        conn = get_db_connection()
        conn.execute("UPDATE users SET is_blocked = 1 WHERE id = ?", (user_id,))
        # Also remove their active session
        conn.execute("DELETE FROM active_sessions WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error blocking user: {e}")
        return False

def unblock_user(user_id):
    """Unblock a user by ID."""
    try:
        conn = get_db_connection()
        conn.execute("UPDATE users SET is_blocked = 0 WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error unblocking user: {e}")
        return False

def get_user_count():
    """Get total user count."""
    try:
        conn = get_db_connection()
        count = conn.execute("SELECT COUNT(*) as count FROM users WHERE username != 'admin'").fetchone()
        conn.close()
        return count['count'] if count else 0
    except:
        return 0

def get_session_count():
    """Get active session count."""
    try:
        conn = get_db_connection()
        count = conn.execute("SELECT COUNT(*) as count FROM active_sessions").fetchone()
        conn.close()
        return count['count'] if count else 0
    except:
        return 0

# ===== Payment Functions =====

def add_payment_record(username, order_id, payment_id, amount, plan, status):
    """Record a payment transaction."""
    try:
        conn = get_db_connection()
        # Create payments table if not exists
        conn.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                order_id TEXT,
                payment_id TEXT,
                amount INTEGER,
                plan TEXT,
                status TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute(
            "INSERT INTO payments (username, order_id, payment_id, amount, plan, status) VALUES (?, ?, ?, ?, ?, ?)",
            (username, order_id, payment_id, amount, plan, status)
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error adding payment: {e}")
        return False

def update_user_subscription(username, plan, status):
    """Update user's subscription plan and status."""
    try:
        conn = get_db_connection()
        conn.execute(
            "UPDATE users SET subscription_plan = ?, payment_status = ? WHERE username = ?",
            (plan, status, username)
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating subscription: {e}")
        return False

def get_user_subscription(username):
    """Get user's current subscription details."""
    try:
        conn = get_db_connection()
        user = conn.execute(
            "SELECT subscription_plan, payment_status FROM users WHERE username = ?",
            (username,)
        ).fetchone()
        conn.close()
        if user:
            return {"plan": user['subscription_plan'], "status": user['payment_status']}
        return {"plan": "free", "status": "none"}
    except Exception as e:
        print(f"Error getting subscription: {e}")
        return {"plan": "free", "status": "none"}

def get_payment_history(username):
    """Get user's payment history."""
    try:
        conn = get_db_connection()
        payments = conn.execute(
            "SELECT * FROM payments WHERE username = ? ORDER BY created_at DESC",
            (username,)
        ).fetchall()
        conn.close()
        return [dict(p) for p in payments]
    except Exception as e:
        print(f"Error getting payments: {e}")
        return []

# Initialize on module load
try:
    init_db()
except Exception as e:
    print(f"Startup DB Error: {e}")
