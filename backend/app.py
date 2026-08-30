import os
import re
import sqlite3
from datetime import datetime, timezone

from flask import Flask, g, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")
DB_PATH = os.path.join(BASE_DIR, "database.db")

MAX_LEVEL = 50
MAX_SCORE = 1_000_000
MAX_LIVES = 20
NAME_RE = re.compile(r"^[A-Za-z0-9 _\-]{1,24}$")

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS saves (
            player_name TEXT PRIMARY KEY,
            level INTEGER NOT NULL DEFAULT 0,
            score INTEGER NOT NULL DEFAULT 0,
            lives INTEGER NOT NULL DEFAULT 3,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            level_reached INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()

init_db()

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def clean_player_name(raw):
    """Return a validated, trimmed player name, or None if invalid."""
    name = str(raw).strip() if raw is not None else ""
    if not NAME_RE.match(name):
        return None
    return name


def clean_int(value, minimum, maximum):
    """Return value if it's a plain (non-bool) int within range, else None."""
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    if value < minimum or value > maximum:
        return None
    return value

@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.route("/api/save", methods=["POST"])
def save_progress():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="expected a JSON object"), 400

    player_name = clean_player_name(data.get("player_name"))
    level = clean_int(data.get("level"), 0, MAX_LEVEL)
    score = clean_int(data.get("score"), 0, MAX_SCORE)
    lives = clean_int(data.get("lives"), 0, MAX_LIVES)

    if player_name is None:
        return jsonify(error="player_name must be 1-24 letters/numbers/spaces/-/_"), 400
    if level is None or score is None or lives is None:
        return jsonify(error="level, score, and lives must be non-negative integers in range"), 400

    db = get_db()
    db.execute(
        """
        INSERT INTO saves (player_name, level, score, lives, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(player_name) DO UPDATE SET
            level=excluded.level,
            score=excluded.score,
            lives=excluded.lives,
            updated_at=excluded.updated_at
        """,
        (player_name, level, score, lives, now_iso()),
    )
    db.commit()
    return jsonify(status="ok")

@app.route("/api/load/<player_name>")
def load_progress(player_name):
    name = clean_player_name(player_name)
    if name is None:
        return jsonify(error="invalid player name"), 400

    db = get_db()
    row = db.execute(
        "SELECT player_name, level, score, lives, updated_at FROM saves WHERE player_name = ?",
        (name,),
    ).fetchone()
    if row is None:
        return jsonify(error="no save found"), 404
    return jsonify(dict(row))


@app.route("/api/scores", methods=["GET"])
def leaderboard():
    db = get_db()
    rows = db.execute(
        "SELECT player_name, score, level_reached, created_at "
        "FROM scores ORDER BY score DESC, created_at ASC LIMIT 10"
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/scores", methods=["POST"])
def submit_score():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="expected a JSON object"), 400

    player_name = clean_player_name(data.get("player_name"))
    score = clean_int(data.get("score"), 0, MAX_SCORE)
    level_reached = clean_int(data.get("level_reached"), 0, MAX_LEVEL)

    if player_name is None:
        return jsonify(error="player_name must be 1-24 letters/numbers/spaces/-/_"), 400
    if score is None or level_reached is None:
        return jsonify(error="score and level_reached must be non-negative integers in range"), 400

    db = get_db()
    db.execute(
        "INSERT INTO scores (player_name, score, level_reached, created_at) VALUES (?, ?, ?, ?)",
        (player_name, score, level_reached, now_iso()),
    )
    db.commit()
    return jsonify(status="ok"), 201

@app.after_request
def add_security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "same-origin"
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' https://fonts.googleapis.com; "
        "font-src https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self'"
    )
    return resp

@app.errorhandler(413)
def too_large(_e):
    return jsonify(error="request body too large"), 413


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG") == "1"
    host = os.environ.get("FLASK_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_PORT", "5000"))
    app.run(debug=debug, host=host, port=port)