from psycopg.rows import dict_row
from database import get_db_connection
from psycopg.errors import UniqueViolation
from werkzeug.security import generate_password_hash

def get_user_by_username(username):
    """Retrieve a user by username for authentication."""

    query = """
        SELECT
            id,
            username,
            password_hash,
            full_name,
            role,
            is_active
        FROM users
        WHERE username = %s;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (username,))
            return cursor.fetchone()


def get_user_by_id(user_id):
    """Retrieve an active user by ID."""

    query = """
        SELECT
            id,
            username,
            full_name,
            role,
            is_active
        FROM users
        WHERE id = %s
          AND is_active = TRUE;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (user_id,))
            return cursor.fetchone()


def get_all_users():
    """Retrieve user accounts without password hashes."""

    query = """
        SELECT
            id,
            username,
            full_name,
            role,
            is_active,
            created_at
        FROM users
        ORDER BY created_at DESC;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query)
            return cursor.fetchall()


def create_custodian(username, full_name, password):
    """Create a new custodian account."""

    password_hash = generate_password_hash(password)

    query = """
        INSERT INTO users (
            username,
            password_hash,
            full_name,
            role,
            is_active
        )
        VALUES (%s, %s, %s, 'custodian', TRUE)
        RETURNING
            id,
            username,
            full_name,
            role,
            is_active,
            created_at;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (username, password_hash, full_name),
            )
            return cursor.fetchone()


def update_user_status(user_id, is_active):
    """Activate or deactivate a user account."""

    query = """
        UPDATE users
        SET is_active = %s
        WHERE id = %s
          AND role = 'custodian'
        RETURNING
            id,
            username,
            full_name,
            role,
            is_active,
            created_at;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (is_active, user_id))
            return cursor.fetchone()
