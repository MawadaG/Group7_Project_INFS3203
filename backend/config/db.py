import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME")

# Don't create client immediately - only when needed
client = None
db = None

def get_client():
    """Lazy load MongoDB client"""
    global client, db
    if client is None and MONGO_URI:
        try:
            client = MongoClient(MONGO_URI)
            db = client[DB_NAME] if DB_NAME else None
        except Exception as e:
            print(f"MongoDB connection error: {e}")
            client = None
            db = None
    return client

def get_db():
    """Get database instance"""
    get_client()
    return db

def test_connection():
    """Test MongoDB connection"""
    if not MONGO_URI:
        print("MONGO_URI not set - skipping connection test")
        return False
    if not DB_NAME:
        print("MONGO_DB_NAME not set - skipping connection test")
        return False
    try:
        get_client()
        if client:
            client.admin.command("ping")
            print("MongoDB connected successfully")
            return True
        return False
    except Exception as e:
        print("MongoDB connection error:", e)
        return False