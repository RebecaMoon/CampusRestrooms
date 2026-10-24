from flask import Blueprint, current_app, jsonify, request, session
from werkzeug.security import check_password_hash
import psycopg

from repositories.users_repository import (
    get_user_by_username,
    get_user_by_id,
)


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/api/auth/login")
def login():
    """Authenticate a user and start a session."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({
            "status": "error",
            "message": "A JSON object is required.",
        }), 400

    username = payload.get("username")
    password = payload.get("password")

    if (
        not isinstance(username, str)
        or not username.strip()
        or not isinstance(password, str)
        or not password
    ):
        return jsonify({
            "status": "error",
            "message": "Username and password are required.",
        }), 400

    try:
        user = get_user_by_username(username.strip())

        if (
            user is None
            or not user["is_active"]
            or not check_password_hash(
                user["password_hash"],
                password,
            )
        ):
            return jsonify({
                "status": "error",
                "message": "Invalid username or password.",
            }), 401

        session.clear()
        session["user_id"] = user["id"]

        return jsonify({
            "status": "ok",
            "message": "Login successful.",
            "data": {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "role": user["role"],
            },
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Login failed because of a database error."
        )

        return jsonify({
            "status": "error",
            "message": "Authentication service unavailable.",
        }), 503


@auth_bp.post("/api/auth/logout")
def logout():
    """End the current session."""

    session.clear()

    return jsonify({
        "status": "ok",
        "message": "Logout successful.",
    }), 200


@auth_bp.get("/api/auth/me")
def current_user():
    """Return the authenticated user's information."""

    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({
            "status": "error",
            "message": "Authentication required.",
        }), 401

    try:
        user = get_user_by_id(user_id)

        if user is None:
            session.clear()

            return jsonify({
                "status": "error",
                "message": "Authentication required.",
            }), 401

        return jsonify({
            "status": "ok",
            "data": {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "role": user["role"],
            },
        }), 200

    except psycopg.Error:
        current_app.logger.exception(
            "Failed to retrieve the current user."
        )

        return jsonify({
            "status": "error",
            "message": "Authentication service unavailable.",
        }), 503
