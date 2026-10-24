import os
from getpass import getpass
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.errors import UniqueViolation
from werkzeug.security import generate_password_hash


PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def create_initial_admin():
    """Create the initial administrator account."""

    username = input("Admin username: ").strip()
    full_name = input("Admin full name: ").strip()

    if not username or not full_name:
        print("Error: Username and full name are required.")
        return

    password = getpass("Admin password: ")
    confirm_password = getpass("Confirm password: ")

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    if len(password) < 12:
        print("Error: Password must have at least 12 characters.")
        return

    database_config = {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME", "campusrestrooms"),
        "user": os.getenv("DB_USER", "campus_admin"),
        "password": os.getenv("DB_PASSWORD", ""),
        "connect_timeout": 5,
    }

    try:
        with psycopg.connect(**database_config) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM users
                        WHERE role = 'admin'
                    );
                    """
                )

                admin_exists = cursor.fetchone()[0]

                if admin_exists:
                    print(
                        "Error: An administrator already exists. "
                        "No account was created."
                    )
                    return

                password_hash = generate_password_hash(password)

                cursor.execute(
                    """
                    INSERT INTO users (
                        username,
                        password_hash,
                        full_name,
                        role,
                        is_active
                    )
                    VALUES (%s, %s, %s, 'admin', TRUE)
                    RETURNING id, username, full_name, role;
                    """,
                    (
                        username,
                        password_hash,
                        full_name,
                    ),
                )

                admin = cursor.fetchone()

        print("\nAdministrator created successfully.")
        print(f"ID: {admin[0]}")
        print(f"Username: {admin[1]}")
        print(f"Full name: {admin[2]}")
        print(f"Role: {admin[3]}")

    except UniqueViolation:
        print(
            "Error: This username already exists. "
            "No account was created."
        )

    except psycopg.Error:
        print("Error: Could not create the administrator.")
        print("Check the database connection and users table.")


if __name__ == "__main__":
    create_initial_admin()
