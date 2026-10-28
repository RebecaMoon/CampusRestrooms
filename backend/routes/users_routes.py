import psycopg
from psycopg.errors import UniqueViolation
from flask import Blueprint, current_app, jsonify, request
from auth_utils import roles_required

from repositories.users_repository import (
    get_all_users,
    create_custodian,
    update_user_status,
    update_custodian,
    delete_custodian,
)


users_bp = Blueprint("users", __name__)


@users_bp.get("/api/users")
@roles_required("admin", "custodian")
def list_users():
    """Return all user accounts."""

    try:
        users = get_all_users()

        return jsonify({
            "status": "ok",
            "count": len(users),
            "data": users,
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to retrieve user accounts."
        )

        return jsonify({
            "status": "error",
            "message": "Could not retrieve user accounts.",
        }), 503


@users_bp.post("/api/users")
@roles_required("admin")
def add_custodian():
    """Create a new custodian account."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({
            "status": "error",
            "message": "A JSON object is required.",
        }), 400

    username = payload.get("username")
    full_name = payload.get("full_name")
    password = payload.get("password")

    if (
        not isinstance(username, str)
        or not username.strip()
        or len(username.strip()) > 50
    ):
        return jsonify({
            "status": "error",
            "message": "Username is required and must be at most 50 characters.",
        }), 400

    if (
        not isinstance(full_name, str)
        or not full_name.strip()
        or len(full_name.strip()) > 120
    ):
        return jsonify({
            "status": "error",
            "message": "Full name is required and must be at most 120 characters.",
        }), 400

    if not isinstance(password, str) or len(password) < 12:
        return jsonify({
            "status": "error",
            "message": "Password must have at least 12 characters.",
        }), 400

    try:
        user = create_custodian(
            username=username.strip(),
            full_name=full_name.strip(),
            password=password,
        )

        return jsonify({
            "status": "ok",
            "message": "Custodian account created successfully.",
            "data": user,
        }), 201

    except UniqueViolation:
        return jsonify({
            "status": "error",
            "message": "Username already exists.",
        }), 409

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to create custodian account."
        )

        return jsonify({
            "status": "error",
            "message": "Could not create user account.",
        }), 503


@users_bp.patch("/api/users/<int:user_id>/status")
@roles_required("admin")
def change_user_status(user_id):
    """Activate or deactivate a custodian account."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({
            "status": "error",
            "message": "A JSON object is required.",
        }), 400

    is_active = payload.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false.",
        }), 400

    try:
        user = update_user_status(user_id, is_active)

        if user is None:
            return jsonify({
                "status": "error",
                "message": "Custodian account not found.",
            }), 404

        return jsonify({
            "status": "ok",
            "message": "User status updated successfully.",
            "data": user,
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to update user status."
        )

        return jsonify({
            "status": "error",
            "message": "Could not update user status.",
        }), 503



@users_bp.patch("/api/users/<int:user_id>")
@roles_required("admin")
def edit_custodian(user_id):
    """Update a custodian account."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({
            "status": "error",
            "message": "A JSON object is required.",
        }), 400

    username = payload.get("username")
    full_name = payload.get("full_name")
    password = payload.get("password")

    if (
        not isinstance(username, str)
        or not username.strip()
        or len(username.strip()) > 50
    ):
        return jsonify({
            "status": "error",
            "message": "Username is required and must be at most 50 characters.",
        }), 400

    if (
        not isinstance(full_name, str)
        or not full_name.strip()
        or len(full_name.strip()) > 120
    ):
        return jsonify({
            "status": "error",
            "message": "Full name is required and must be at most 120 characters.",
        }), 400

    # Una contraseña vacía significa que se conserva la actual.
    if password is not None:
        if not isinstance(password, str):
            return jsonify({
                "status": "error",
                "message": "Password must be a string.",
            }), 400

        if password and len(password) < 12:
            return jsonify({
                "status": "error",
                "message": "Password must have at least 12 characters.",
            }), 400

    try:
        user = update_custodian(
            user_id=user_id,
            username=username.strip(),
            full_name=full_name.strip(),
            password=password or None,
        )

        if user is None:
            return jsonify({
                "status": "error",
                "message": "Custodian account not found.",
            }), 404

        return jsonify({
            "status": "ok",
            "message": "Custodian account updated successfully.",
            "data": user,
        }), 200

    except UniqueViolation:
        return jsonify({
            "status": "error",
            "message": "Username already exists.",
        }), 409

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to update custodian account."
        )

        return jsonify({
            "status": "error",
            "message": "Could not update custodian account.",
        }), 503



@users_bp.delete("/api/users/<int:user_id>")
@roles_required("admin")
def remove_custodian(user_id):
    """Delete a custodian account."""

    try:
        user = delete_custodian(user_id)

        if user is None:
            return jsonify({
                "status": "error",
                "message": "Custodian account not found.",
            }), 404

        return jsonify({
            "status": "ok",
            "message": "Custodian account deleted successfully.",
            "data": user,
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to delete custodian account."
        )

        return jsonify({
            "status": "error",
            "message": "Could not delete custodian account.",
        }), 503