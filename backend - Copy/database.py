import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "gym_attendance")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]

attendance_collection = db["attendance"]
owner_collection = db["owner"]


async def ensure_indexes():
    """Call once at startup to keep lookups/filters fast."""
    await attendance_collection.create_index("date")
    await attendance_collection.create_index("session")
    await attendance_collection.create_index([("name", "text"), ("roll_number", "text")])
    await owner_collection.create_index("email", unique=True)
