from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/api/health")
def health_check():
    return jsonify({
        "status": "ok",
        "application": "CampusRestrooms API"
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)