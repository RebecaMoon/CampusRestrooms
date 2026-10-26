from psycopg.rows import dict_row

from database import get_db_connection


def get_all_buildings():
    """Retrieve all active buildings and their map coordinates."""

    query = """
        SELECT
            id,
            map_id,
            name,
            description,
            map_x,
            map_y
        FROM buildings
        WHERE is_active = TRUE
        ORDER BY name;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query)
            return cursor.fetchall()
