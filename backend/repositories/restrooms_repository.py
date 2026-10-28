from psycopg.rows import dict_row

from database import get_db_connection


def get_all_restrooms():
    """Retrieve all active restrooms and their building information."""

    query = """
        SELECT
            r.id,
            r.building_id,
            b.name AS building_name,
            r.name,
            r.description,
            r.map_x,
            r.map_y,
            r.status,
            r.updated_at
        FROM restrooms AS r
        JOIN buildings AS b
            ON b.id = r.building_id
        WHERE r.is_active = TRUE
          AND b.is_active = TRUE
        ORDER BY b.name, r.name;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query)
            return cursor.fetchall()


def update_restroom_status(restroom_id, new_status, changed_by=None): # changed_by is temporarily None because authentication has not been implemented yet.
                                                                    # Once authentication is available, it will contain the ID of the logged-in custodian.
    """Update a restroom status and record the change in history."""

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT id, status
                FROM restrooms
                WHERE id = %s
                  AND is_active = TRUE
                FOR UPDATE;
                """,
                (restroom_id,),
            )

            restroom = cursor.fetchone()

            if restroom is None:
                return None

            previous_status = restroom["status"]

            if previous_status == new_status:
                return {
                    "id": restroom_id,
                    "previous_status": previous_status,
                    "new_status": new_status,
                    "updated_at": None,
                    "changed": False,
                }

            cursor.execute(
                """
                UPDATE restrooms
                SET status = %s
                WHERE id = %s
                RETURNING updated_at;
                """,
                (new_status, restroom_id),
            )

            updated = cursor.fetchone()

            cursor.execute(
                """
                INSERT INTO restroom_status_history (
                    restroom_id,
                    changed_by,
                    previous_status,
                    new_status
                )
                VALUES (%s, %s, %s, %s);
                """,
                (
                    restroom_id,
                    changed_by,
                    previous_status,
                    new_status,
                ),
            )

            return {
                "id": restroom_id,
                "previous_status": previous_status,
                "new_status": new_status,
                "updated_at": updated["updated_at"],
                "changed": True,
            }


def create_restroom(
    building_id,
    name,
    description,
    map_x,
    map_y,
    status="available",
):
    """Create a restroom in an active building."""

    query = """
        INSERT INTO restrooms (
            building_id,
            name,
            description,
            map_x,
            map_y,
            status
        )
        SELECT
            b.id,
            %s,
            %s,
            %s,
            %s,
            %s
        FROM buildings AS b
        WHERE b.id = %s
          AND b.is_active = TRUE
        RETURNING
            id,
            building_id,
            name,
            description,
            map_x,
            map_y,
            status,
            created_at,
            updated_at;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                query,
                (
                    name,
                    description,
                    map_x,
                    map_y,
                    status,
                    building_id,
                ),
            )

            restroom = cursor.fetchone()

            if restroom is None:
                return None

            cursor.execute(
                """
                SELECT name
                FROM buildings
                WHERE id = %s;
                """,
                (building_id,),
            )

            building = cursor.fetchone()
            restroom["building_name"] = building["name"]

            return restroom



def get_restroom_by_id(restroom_id):
    """Retrieve one active restroom by its ID."""

    query = """
        SELECT
            r.id,
            r.building_id,
            b.name AS building_name,
            r.name,
            r.description,
            r.map_x,
            r.map_y,
            r.status,
            r.created_at,
            r.updated_at
        FROM restrooms AS r
        JOIN buildings AS b
            ON b.id = r.building_id
        WHERE r.id = %s
          AND r.is_active = TRUE
          AND b.is_active = TRUE;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (restroom_id,))
            return cursor.fetchone()


def get_restroom_status_history(restroom_id):
    """Retrieve the status change history for one restroom."""

    query = """
        SELECT
            id,
            restroom_id,
            changed_by,
            previous_status,
            new_status,
            changed_at,
            notes
        FROM restroom_status_history
        WHERE restroom_id = %s
        ORDER BY changed_at DESC, id DESC;
    """

    with get_db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(query, (restroom_id,))
            return cursor.fetchall()