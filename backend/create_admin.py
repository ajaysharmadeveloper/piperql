"""Create an admin user interactively from the terminal."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password


def main():
    username = input("Username: ").strip()
    if not username:
        print("Username cannot be empty.")
        sys.exit(1)

    email = input("Email: ").strip()
    if not email:
        print("Email cannot be empty.")
        sys.exit(1)

    password = input("Password: ").strip()
    if not password:
        print("Password cannot be empty.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        if existing:
            print(f"User with username '{username}' or email '{email}' already exists.")
            sys.exit(1)

        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role="admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Admin user created: {user.username} ({user.email}) — id: {user.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
