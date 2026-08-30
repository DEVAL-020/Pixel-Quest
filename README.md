# Pixel Quest

A 2D platformer built with **Python (Flask)** on the backend and
**HTML / CSS / JavaScript (Canvas)** on the frontend.

## Features

- 3 hand-built levels (Grasslands → Caverns → Sky Fortress), each harder than the last
- Physics-based movement: run, jump, gravity, solid-platform collision
- Patrolling enemies — stomp them from above, or lose a heart on side contact
- Coins, score, and a 3-heart health system with brief invincibility after a hit
- Simple procedural animation (walk cycle, bob, pulsing goal flag) — no image assets required
- Sound effects synthesized live with the Web Audio API (jump, coin, stomp, hit, level clear)
- Pause menu (resume / restart level / save / quit)
- **Save & Continue**, stored locally in the browser so it works without a server
- **Leaderboard** — submit your final score and see the top 10 scores stored on the device

## Project structure

```
Pixel-Quest/
├── frontend/
│   ├── index.html      # menus, HUD, game screen
│   ├── style.css        # pixel-arcade UI theme
│   ├── game.js           # game engine (physics, levels, rendering, API calls)
│   └── assets/           # (reserved — game currently draws everything with canvas shapes)
├── backend/
│   ├── app.py            # Flask app: serves frontend + JSON API
│   ├── database.db       # SQLite database (created automatically on first run)
│   └── requirements.txt
├── frontend/assets/       # favicon.ico, favicon-32.png, apple-touch-icon.png
├── README.md
└── .gitignore
```

## Running it

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000** in your browser.

The database file is created automatically the first time the server starts —
you don't need to set anything up manually.

By default the server only listens on `127.0.0.1` (your own machine) with
debug mode off, which is the safe setting. If you deliberately want to reach
it from another device on your network during development, opt in explicitly:

```bash
FLASK_HOST=0.0.0.0 FLASK_DEBUG=1 python app.py
```

Don't run with `FLASK_DEBUG=1` on anything reachable from the internet —
Flask's debug mode includes an interactive in-browser debugger that can
execute arbitrary code.

## Controls

| Action | Keys |
|---|---|
| Move | `←` `→` or `A` `D` |
| Jump | `Space`, `↑`, or `W` |
| Pause | `Esc` or `P` |

## Optional API reference

The browser game is intentionally local-first: it does not make API calls when
opened from a static server or directly from the project files. The Flask API
remains available for future server-backed integrations.

| Method | Route | Purpose |
|---|---|---|
| `GET`  | `/api/load/<player_name>` | Fetch a player's saved progress (404 if none) |
| `POST` | `/api/save` | Save `{player_name, level, score, lives}` |
| `GET`  | `/api/scores` | Top 10 leaderboard, highest score first |
| `POST` | `/api/scores` | Submit `{player_name, score, level_reached}` |

## Security notes

- All API inputs are validated server-side: player names are restricted to
  `A-Z a-z 0-9 space - _` (max 24 chars), and level/score/lives must be
  plain non-negative integers within sane bounds — booleans, strings, and
  out-of-range numbers are rejected with a `400`.
- All SQL uses parameterized queries (no string-built SQL), so there's no
  SQL-injection surface.
- Static files are served with Flask's `send_from_directory`, which refuses
  any path that would escape the `frontend/` folder (path traversal is
  blocked even if attempted via `../` or URL-encoded variants).
- Leaderboard names are HTML-escaped before being inserted into the page.
- Request bodies are capped at 16 KB, and the server sends
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a
  `Content-Security-Policy` header on every response.
- Debug mode and binding to all network interfaces are both **off** by
  default; see "Running it" above for how to opt in for local network
  testing only.

## Notes / possible extensions

- Swap the canvas-drawn sprites for real spritesheets in `frontend/assets/` and
  update the `drawPlayer()` / enemy drawing code in `game.js`.
- Add background music by dropping an audio file in `assets/` and wiring up an
  `<audio>` element — sound effects currently use synthesized tones so the
  project has zero binary dependencies out of the box.
- Add real accounts / auth if you want saves to be private per-user rather than
  keyed by display name.
