"""
Portfolio Backend — Flask + SQLite
Author: Saurabh Rajpoot

ROUTES:
  GET  /                → Renders portfolio homepage
  POST /api/chat        → AI terminal (wire to LLM API)
  POST /contact         → Contact form handler
  GET  /resume          → Serve resume PDF
  GET  /api/projects    → JSON list of projects (CMS)

SETUP:
  pip install flask flask-cors
  python app.py
"""

import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# ── Database ───────────────────────────────────────────────────────────────────

DB_PATH = 'portfolio.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS projects (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            description TEXT,
            tags        TEXT,       -- JSON array: ["Flask","Python"]
            demo_url    TEXT,
            github_url  TEXT,
            thumbnail   TEXT,       -- Path under /static/assets/img/
            color       TEXT,       -- Hex bg color for panel
            order_index INTEGER DEFAULT 0,
            created_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS contacts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL,
            email      TEXT    NOT NULL,
            message    TEXT    NOT NULL,
            created_at TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS chat_logs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role       TEXT,        -- "user" | "assistant"
            content    TEXT,
            created_at TEXT    DEFAULT (datetime('now'))
        );
    ''')
    conn.commit()
    conn.close()

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Render main portfolio page. Pass projects from DB to template."""
    conn = get_db()
    projects = conn.execute(
        'SELECT * FROM projects ORDER BY order_index ASC'
    ).fetchall()
    conn.close()

    # Parse JSON tags field for each project
    projects_list = []
    for p in projects:
        d = dict(p)
        d['tags'] = json.loads(d.get('tags') or '[]')
        projects_list.append(d)

    return render_template('index.html', projects=projects_list)


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    AI Terminal endpoint.
    Receives: { message: string, history: [{ role, content }] }
    Returns:  { reply: string }

    Wire this to your LLM API of choice:
    - Anthropic Claude: pip install anthropic
    - Google Gemini:    pip install google-generativeai
    - OpenAI:           pip install openai
    """
    data    = request.get_json()
    message = data.get('message', '').strip()
    history = data.get('history', [])

    if not message:
        return jsonify({'error': 'Empty message'}), 400

    # ── ANTHROPIC CLAUDE EXAMPLE ────────────────────────────────────────────
    # Uncomment and set ANTHROPIC_API_KEY env variable to activate:
    #
    # import anthropic
    # client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
    #
    # SYSTEM_PROMPT = """You are an AI assistant embedded in Saurabh Rajpoot's
    # portfolio website. You have full context about his background, skills,
    # and projects. Answer questions about him concisely and helpfully.
    # Saurabh is a first-year BTech CSE (AI & ML) student at VIT Bhopal.
    # His projects include: BunkMaster (Flask attendance planner with Claude API),
    # Computer Vision Air Tracing (OpenCV + MediaPipe), VibeCheck (Gemini 2.0
    # campus mood tracker), and more. His GitHub is Saurabh1616."""
    #
    # messages_for_api = [{'role': m['role'], 'content': m['content']} for m in history]
    # messages_for_api.append({'role': 'user', 'content': message})
    #
    # response = client.messages.create(
    #     model='claude-sonnet-4-20250514',
    #     max_tokens=300,
    #     system=SYSTEM_PROMPT,
    #     messages=messages_for_api,
    # )
    # reply = response.content[0].text
    # ────────────────────────────────────────────────────────────────────────

    # Placeholder until LLM is wired in
    reply = (
        f"[Placeholder] You asked: '{message}'. "
        "Wire /api/chat to your LLM API (Claude/Gemini/OpenAI) to activate this."
    )

    # Log conversation to DB
    conn = get_db()
    session_id = request.headers.get('X-Session-ID', 'anonymous')
    conn.execute(
        'INSERT INTO chat_logs (session_id, role, content) VALUES (?, ?, ?)',
        (session_id, 'user', message)
    )
    conn.execute(
        'INSERT INTO chat_logs (session_id, role, content) VALUES (?, ?, ?)',
        (session_id, 'assistant', reply)
    )
    conn.commit()
    conn.close()

    return jsonify({'reply': reply})


@app.route('/contact', methods=['POST'])
def contact():
    """Save contact form submission to DB."""
    data    = request.get_json()
    name    = (data.get('name') or '').strip()
    email   = (data.get('email') or '').strip()
    message = (data.get('message') or '').strip()

    if not all([name, email, message]):
        return jsonify({'success': False, 'message': 'All fields required'}), 400

    conn = get_db()
    conn.execute(
        'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
        (name, email, message)
    )
    conn.commit()
    conn.close()

    # TODO: Send email notification here (use smtplib or sendgrid)

    return jsonify({'success': True, 'message': 'Message received!'})


@app.route('/api/projects')
def api_projects():
    """JSON API endpoint for projects — useful for headless CMS."""
    conn     = get_db()
    projects = conn.execute('SELECT * FROM projects ORDER BY order_index ASC').fetchall()
    conn.close()

    result = []
    for p in projects:
        d = dict(p)
        d['tags'] = json.loads(d.get('tags') or '[]')
        result.append(d)

    return jsonify(result)


@app.route('/resume')
def resume():
    """Serve resume PDF. Place your resume.pdf in /static/assets/"""
    return send_from_directory('static/assets', 'resume.pdf')


# ── Init & Run ─────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
