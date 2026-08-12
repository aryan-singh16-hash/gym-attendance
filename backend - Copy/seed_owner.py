"""
Run this ONCE to create the gym owner's admin login.
Usage: python seed_owner.py
Reads OWNER_EMAIL and OWNER_PASSWORD from .env
"""
import os
import asyncio
from dotenv import load_dotenv

from database import owner_collection
from auth import hash_password

load_dotenv()


async def main():
    email = os.getenv("OWNER_EMAIL")
    password = os.getenv("OWNER_PASSWORD")

    if not email or not password:
        print("Set OWNER_EMAIL and OWNER_PASSWORD in your .env file first.")
        return

    existing = await owner_collection.find_one({"email": email})
    if existing:
        print(f"Owner account for {email} already exists. Nothing to do.")
        return

    await owner_collection.insert_one({
        "email": email,
        "password_hash": hash_password(password),
    })
    print(f"Owner account created for {email}. You can now log in from the admin panel.")


if __name__ == "__main__":
    asyncio.run(main())
