import psycopg
from flask import Blueprint, current_app, jsonify, request
from flask import g
from auth_utils import roles_required

from repositories.restrooms_repository import (
    get_all_restrooms,
    update_restroom_status,
    get_restroom_by_id,
    create_restroom,
)


restrooms_bp = Blueprint("restrooms", __name__)

ALLOWED_STATUSES = {
    "available",
    "maintenance",
    "out_of_service",
}


@restrooms_bp.get("/api/restrooms")
def list_restrooms():
    """Return all active restrooms as JSON."""

    try:
        restrooms = get_all_restrooms()

        return jsonify({
            "status": "ok",
            "count": len(restrooms),
            "data": restrooms,
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to retrieve restrooms from the database."
        )

        return jsonify({
            "status": "error",
            "message": "Could not retrieve restrooms.",
        }), 503


@restrooms_bp.patch("/api/restrooms/<int:restroom_id>/status")
@roles_required("admin", "custodian")
def change_restroom_status(restroom_id):
    """Update a restroom status and record the change."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({
            "status": "error",
            "message": "A JSON object is required.",
        }), 400

    new_status = payload.get("status")

    if not isinstance(new_status, str) or new_status not in ALLOWED_STATUSES:
        return jsonify({
            "status": "error",
            "message": "Invalid status.",
            "allowed_statuses": sorted(ALLOWED_STATUSES),
        }), 400

    try:
        result = update_restroom_status(
            restroom_id=restroom_id,
            new_status=new_status,
            changed_by=g.current_user["id"],
        )

        if result is None:
            return jsonify({
                "status": "error",
                "message": "Restroom not found.",
            }), 404

        return jsonify({
            "status": "ok",
            "message": (
                "Restroom status updated."
                if result["changed"]
                else "Restroom already has this status."
            ),
            "data": result,
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to update restroom status."
        )

        return jsonify({
            "status": "error",
            "message": "Could not update restroom status.",
        }), 503


@restrooms_bp.post("/api/restrooms")
@roles_required("admin", "custodian")
def add_restroom():
    """Create a new restroom."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({
            "status": "error",
            "message": "A JSON object is required.",
        }), 400

    building_id = payload.get("building_id")
    name = payload.get("name")
    description = payload.get("description")
    map_x = payload.get("map_x")
    map_y = payload.get("map_y")
    new_status = payload.get("status", "available")

    if (
        not isinstance(building_id, int)
        or isinstance(building_id, bool)
        or building_id <= 0
    ):
        return jsonify({
            "status": "error",
            "message": "A valid building_id is required.",
        }), 400

    if not isinstance(name, str) or not name.strip():
        return jsonify({
            "status": "error",
            "message": "A non-empty name is required.",
        }), 400

    if description is not None and not isinstance(description, str):
        return jsonify({
            "status": "error",
            "message": "Description must be a string or null.",
        }), 400

    if (
        not isinstance(map_x, int)
        or isinstance(map_x, bool)
        or not isinstance(map_y, int)
        or isinstance(map_y, bool)
    ):
        return jsonify({
            "status": "error",
            "message": "map_x and map_y must be integers.",
        }), 400

    if (
        not isinstance(new_status, str)
        or new_status not in ALLOWED_STATUSES
    ):
        return jsonify({
            "status": "error",
            "message": "Invalid status.",
            "allowed_statuses": sorted(ALLOWED_STATUSES),
        }), 400

    try:
        restroom = create_restroom(
            building_id=building_id,
            name=name.strip(),
            description=description.strip() if description else None,
            map_x=map_x,
            map_y=map_y,
            status=new_status,
        )

        if restroom is None:
            return jsonify({
                "status": "error",
                "message": "Active building not found.",
            }), 404

        return jsonify({
            "status": "ok",
            "message": "Restroom created successfully.",
            "data": restroom,
        }), 201

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to create restroom."
        )

        return jsonify({
            "status": "error",
            "message": "Could not create restroom.",
        }), 503



@restrooms_bp.get("/api/restrooms/<int:restroom_id>")
def get_restroom(restroom_id):
    """Return one active restroom by its ID."""

    try:
        restroom = get_restroom_by_id(restroom_id)

        if restroom is None:
            return jsonify({
                "status": "error",
                "message": "Restroom not found.",
            }), 404

        return jsonify({
            "status": "ok",
            "data": restroom,
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to retrieve restroom details."
        )

        return jsonify({
            "status": "error",
            "message": "Could not retrieve restroom.",
        }), 503