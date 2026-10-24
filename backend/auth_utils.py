
from functools import wraps

import psycopg
from flask import current_app, g, jsonify, session

from repositories.users_repository import get_user_by_id


def roles_required(*allowed_roles):
    """Require an authenticated, active user with an allowed role."""

    def decorator(view_function):
        @wraps(view_function)
        def wrapped_view(*args, **kwargs):
            user_id = session.get("user_id")

            if user_id is None:
                return jsonify({
                    "status": "error",
                    "message": "Authentication required.",
                }), 401

            try:
                user = get_user_by_id(user_id)

            except psycopg.Error:
                current_app.logger.exception(
                    "Failed to verify the authenticated user."
                )

                return jsonify({
                    "status": "error",
                    "message": "Could not verify user permissions.",
                }), 503

            if user is None:
                session.clear()

                return jsonify({
                    "status": "error",
                    "message": "Authentication required.",
                }), 401

            if user["role"] not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": "You do not have permission to perform this action.",
                }), 403

            # Make the authenticated user available to the route.
            g.current_user = user

            return view_function(*args, **kwargs)

        return wrapped_view

    return decorator
