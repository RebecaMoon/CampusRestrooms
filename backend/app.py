import os
from pathlib import Path

from database import get_db_connection
import psycopg
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

# Routes and blueprints
from routes.buildings_routes import buildings_bp
from routes.auth_routes import auth_bp
from routes.restrooms_routes import restrooms_bp
from routes.users_routes import users_bp

# Locate the project root and load environment variables.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def create_app():
    """Create and configure the Flask application."""

    app = Flask(__name__)

    app.config.update(
    SECRET_KEY=os.getenv("FLASK_SECRET_KEY"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,
    )

    # Configure CORS to allow requests from the local React frontend.
   # Configure CORS for local frontend development.
# In production, Nginx serves the frontend and proxies /api.
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": os.getenv(
                    "CORS_ORIGINS",
                    "http://localhost:5173"
                ).split(",")
            }
        },
        supports_credentials=True,
    )

    # Load database configuration from environment variables.
    app.config["DATABASE"] = {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME", "campusrestrooms"),
        "user": os.getenv("DB_USER", "campus_admin"),
        "password": os.getenv("DB_PASSWORD", ""),
        "connect_timeout": 5,
    }

    @app.get("/api")
    def api_info():
        """Return basic information about the API."""

        return jsonify({
            "application": "CampusRestrooms API",
            "status": "running",
            "version": "1.0.0",
        }), 200

    @app.get("/api/health")
    def health_check():
        """Check whether the API is responding."""

        return jsonify({
            "status": "ok",
            "application": "CampusRestrooms API",
        }), 200

    @app.get("/api/health/db")
    def database_health_check():
        """Check whether the application can connect to PostgreSQL."""

        try:
            # Open a connection and execute a simple test query.
            with get_db_connection() as connection:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()

            return jsonify({
                "status": "ok",
                "database": "connected",
            }), 200

        except psycopg.Error:
            # Avoid exposing database credentials or internal error details.
            app.logger.exception("Database health check failed.")

            return jsonify({
                "status": "error",
                "database": "unavailable",
                "message": "Could not connect to the database.",
            }), 503

    @app.errorhandler(404)
    def not_found(error):
        """Return a JSON response when an endpoint does not exist."""

        return jsonify({
            "status": "error",
            "message": "Endpoint not found.",
        }), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        """Return a generic JSON response for unexpected server errors."""

        app.logger.error("An internal server error occurred.")

        return jsonify({
            "status": "error",
            "message": "Internal server error.",
        }), 500

    return app


# Create the application instance used by Flask.
app = create_app()

# Blueprints
app.register_blueprint(restrooms_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(buildings_bp)



if __name__ == "__main__":
    # Enable debug mode only when explicitly configured.
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Keep the development server accessible only from this computer.
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=debug_mode,
    )