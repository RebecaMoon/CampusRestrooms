import psycopg
from flask import Blueprint, current_app, jsonify

from repositories.buildings_repository import get_all_buildings


buildings_bp = Blueprint("buildings", __name__)


@buildings_bp.get("/api/buildings")
def list_buildings():
    """Return all active buildings as JSON."""

    try:
        buildings = get_all_buildings()

        return jsonify({
            "status": "ok",
            "count": len(buildings),
            "data": buildings,
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to retrieve buildings from the database."
        )

        return jsonify({
            "status": "error",
            "message": "Could not retrieve buildings.",
        }), 503
