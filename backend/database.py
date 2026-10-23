import psycopg
# Psycopg is a PostgreSQL adapter for connecting Python applications to PostgreSQL databases.
from flask import current_app


def get_db_connection():
    """Create a PostgreSQL connection using the application configuration."""

    database_config = current_app.config["DATABASE"]

    return psycopg.connect(**database_config)
