# Saurabh Rajpoot — Portfolio

Premium animated portfolio built with Flask, Three.js, GSAP, and Lenis.

---

## Folder Structure

```
portfolio/
│
├── app.py                        ← Flask application + SQLite routes
├── portfolio.db                  ← Auto-created SQLite database (git-ignored)
├── requirements.txt
│
├── templates/
│   └── index.html                ← Main portfolio page (Jinja2 template)
│
└── static/
    ├── css/
    │   └── style.css             ← Full design system + all component styles
    │
    ├── js/
    │   └── app.js                ← Lenis + GSAP + Three.js + Terminal logic
    │
    └── assets/
        ├── img/                  ← Project thumbnails, OG image
        │   └── .gitkeep
        └── resume.pdf            ← Your resume (served at /resume)
```

---

## Tech Stack

| Layer        | Technology                      |
|-------------|----------------------------------|
| Backend     | Python · Flask · SQLite          |
| 3D / Canvas | Three.js r128                    |
| Animations  | GSAP 3.12 + ScrollTrigger        |
| Scroll      | Lenis 1.0                        |
| Fonts       | Syne (display) + DM Sans (body)  |
| Deployment  | Render / Railway / Vercel (Flask)|

---

## Quick Start

```bash
# 1. Install Python dependencies
pip install flask flask-cors

# 2. Run Flask dev server
python app.py

# 3. Open http://localhost:5000
```

---

## Connecting the AI Terminal

In `app.py`, find the `/api/chat` route and uncomment the Anthropic block:

```python
import anthropic
client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
```

Set your key:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Then in `static/js/app.js`, inside `sendMessage()`, uncomment the fetch block
and remove the `simulateAIResponse()` call.

---

## Adding Projects via SQLite

```python
import sqlite3, json
conn = sqlite3.connect('portfolio.db')
conn.execute('''
    INSERT INTO projects (title, description, tags, demo_url, github_url, color, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
''', (
    'BunkMaster',
    'Flask attendance planner with AI bunk advice.',
    json.dumps(['Flask', 'SQLite', 'Claude API']),
    'https://bunkmaster.vercel.app',
    'https://github.com/Saurabh1616/bunkmaster',
    '#0d1b2a',
    1
))
conn.commit()
```

---

## Replacing Placeholder Mockups with Real Screenshots

In `index.html`, each `.project-panel__img-placeholder` div can be
replaced with a real `<img>` tag:

```html
<!-- Replace this: -->
<div class="project-panel__img-placeholder glass" ...>...</div>

<!-- With this: -->
<img
  src="{{ url_for('static', filename='assets/img/bunkmaster.png') }}"
  alt="BunkMaster screenshot"
  class="project-panel__real-img"
  loading="lazy"
/>
```

Add to CSS:
```css
.project-panel__real-img {
  width: 100%;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}
```

---

## Environment Variables

| Variable             | Purpose                        |
|---------------------|--------------------------------|
| `ANTHROPIC_API_KEY` | Powers the AI Terminal         |
| `SECRET_KEY`        | Flask session security         |
| `MAIL_SERVER`       | Optional email notifications   |

---

## Deployment (Render.com)

1. Push to GitHub
2. Create new Web Service on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add environment variables in Render dashboard

---

Built by Saurabh Rajpoot · VIT Bhopal · 2025
