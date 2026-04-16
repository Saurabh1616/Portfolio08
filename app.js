/* ============================================================
   PORTFOLIO — app.js
   Author: Saurabh Rajpoot
   ============================================================
   TABLE OF CONTENTS:
   1.  Wait for DOM + Libraries
   2.  Lenis Smooth Scroll
   3.  Custom Magnetic Cursor
   4.  Navigation (hide/reveal on scroll)
   5.  Three.js — Interactive Neural Network Hero Background
   6.  GSAP — Hero Entrance Animation
   7.  GSAP — ScrollTrigger: Fade-Up Sections
   8.  GSAP — ScrollTrigger: Skill Card Stagger
   9.  GSAP — ScrollTrigger: Project Panel Background Color Transitions
   10. GSAP — ScrollTrigger: Parallax on Project Images
   11. AI Terminal — Chat Interface Logic
   12. Contact Form — Micro-interactions & Submit
   13. Hover: Cursor expansion on links
   14. Init — Run everything
   ============================================================

   FLASK INTEGRATION NOTES:
   - Terminal: POST to /api/chat with { message: string }
                Expects JSON { reply: string }
   - Contact:   POST to /contact with FormData
                Expects JSON { success: bool, message: string }
   - Static assets served via Flask's url_for('static', filename='...')
   ============================================================ */


/* ─────────────────────────────────────────────
   1. WAIT FOR DOM & LIBRARIES
   CDN scripts are deferred, so we wait for
   DOMContentLoaded + a small tick for GSAP etc.
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Small delay to ensure CDN scripts are parsed */
  requestAnimationFrame(() => {
    init();
  });
});

function init() {
  setupLenis();
  setupCursor();
  setupNav();
  setupThreeJS();
  setupHeroAnimation();
  setupFadeUpAnimations();
  setupSkillCards();
  setupProjectPanels();
  setupParallax();
  setupTerminal();
  setupContactForm();
  setupHoverCursor();
}


/* ─────────────────────────────────────────────
   2. LENIS SMOOTH SCROLL
   Lenis wraps native scroll with lerp interpolation
   for buttery, physics-based scroll feel.
   ───────────────────────────────────────────── */
function setupLenis() {
  if (typeof Lenis === 'undefined') {
    console.warn('Lenis not loaded — check CDN');
    return;
  }

  const lenis = new Lenis({
    lerp: 0.08,           /* Interpolation factor — lower = smoother (0.05–0.15) */
    smoothWheel: true,    /* Smooth mouse wheel */
    syncTouch: false,     /* Keep native touch scroll on mobile (better UX) */
  });

  /* Connect Lenis to GSAP's RAF loop for perfect sync */
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0); /* Prevent GSAP from "catching up" on lag frames */

  /* Expose globally so other functions can pause/resume if needed */
  window._lenis = lenis;
}


/* ─────────────────────────────────────────────
   3. CUSTOM MAGNETIC CURSOR
   ───────────────────────────────────────────── */
function setupCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  const dot  = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');

  /* Track raw mouse position */
  let mouseX = 0, mouseY = 0;

  /* Dot follows mouse instantly; ring follows with lag */
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    /* Move dot immediately */
    gsap.set(dot,  { x: mouseX, y: mouseY });
  });

  /* Ring trails behind dot using GSAP ticker for smooth lerp */
  gsap.ticker.add(() => {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    gsap.set(ring, { x: ringX, y: ringY });
  });

  /* Magnetic effect — elements with [data-magnetic] attract the cursor */
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect   = el.getBoundingClientRect();
      const relX   = e.clientX - rect.left - rect.width  / 2;
      const relY   = e.clientY - rect.top  - rect.height / 2;
      const strength = 0.35; /* Pull strength — 0 to 1 */

      gsap.to(el, {
        x: relX * strength,
        y: relY * strength,
        duration: 0.4,
        ease: 'power2.out',
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}


/* ─────────────────────────────────────────────
   4. NAVIGATION — HIDE/REVEAL ON SCROLL
   ───────────────────────────────────────────── */
function setupNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let lastScrollY = 0;

  ScrollTrigger.create({
    start: 'top -80px',
    end: '99999px',
    onUpdate: (self) => {
      const currentY = self.scroll();

      /* Add "scrolled" class once past hero */
      if (currentY > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      /* Hide on scroll down, show on scroll up */
      if (currentY > lastScrollY && currentY > 200) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }

      lastScrollY = currentY;
    },
  });
}


/* ─────────────────────────────────────────────
   5. THREE.JS — INTERACTIVE NEURAL NETWORK
   Renders a particle mesh (nodes + edges) in the hero.
   Nodes drift slowly; the mesh tilts toward mouse position.
   ───────────────────────────────────────────── */
function setupThreeJS() {
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded');
    return;
  }

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  /* ── Scene Setup ────────────────────────────── */
  const scene    = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,        /* Transparent background — CSS bg shows through */
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setClearColor(0x000000, 0);

  /* ── Camera ─────────────────────────────────── */
  const camera = new THREE.PerspectiveCamera(
    60,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    1000
  );
  camera.position.z = 300;

  /* ── Neural Network Nodes ────────────────────── */
  const NODE_COUNT = 120;    /* Increase for denser network (impacts perf) */
  const SPREAD     = 400;    /* XY spread in units */
  const DEPTH      = 200;    /* Z spread */

  /* Store node positions for edge calculation */
  const nodePositions = [];

  /* Particle geometry — each node is a point */
  const nodeGeometry = new THREE.BufferGeometry();
  const positions     = new Float32Array(NODE_COUNT * 3);

  for (let i = 0; i < NODE_COUNT; i++) {
    const x = (Math.random() - 0.5) * SPREAD;
    const y = (Math.random() - 0.5) * SPREAD * 0.6;
    const z = (Math.random() - 0.5) * DEPTH;

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    nodePositions.push(new THREE.Vector3(x, y, z));
  }

  nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  /* Point material */
  const nodeMaterial = new THREE.PointsMaterial({
    color: 0x3b82f6,    /* --accent blue */
    size: 3,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });

  const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
  scene.add(nodes);

  /* ── Neural Network Edges ────────────────────── */
  /* Draw lines between nodes that are within MAX_DIST of each other */
  const MAX_DIST      = 90;
  const edgePositions = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const dist = nodePositions[i].distanceTo(nodePositions[j]);
      if (dist < MAX_DIST) {
        edgePositions.push(
          nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
          nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
        );
      }
    }
  }

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(edgePositions), 3)
  );

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.12,      /* Subtle — nodes are the focus */
  });

  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  scene.add(edges);

  /* Group both so we can rotate them together */
  const network = new THREE.Group();
  network.add(nodes);
  network.add(edges);
  scene.add(network);

  /* Remove the original scene adds */
  scene.remove(nodes);
  scene.remove(edges);

  /* ── Mouse Tracking ─────────────────────────── */
  /* Normalized mouse position: -1 to +1 */
  let targetRotX = 0;
  let targetRotY = 0;

  document.addEventListener('mousemove', (e) => {
    /* Only react when over hero section */
    if (e.clientY > window.innerHeight) return;

    targetRotY =  (e.clientX / window.innerWidth  - 0.5) * 0.4; /* Tilt left/right */
    targetRotX = -(e.clientY / window.innerHeight - 0.5) * 0.25; /* Tilt up/down */
  });

  /* ── Node Animation ─────────────────────────── */
  /* Each node drifts slowly via sine waves for organic feel */
  const nodeSpeeds  = Array.from({ length: NODE_COUNT }, () => Math.random() * 0.3 + 0.1);
  const nodeOffsets = Array.from({ length: NODE_COUNT }, () => Math.random() * Math.PI * 2);

  /* ── Render Loop ────────────────────────────── */
  const posAttr = nodeGeometry.attributes.position;

  function animate() {
    requestAnimationFrame(animate);

    const t = Date.now() * 0.001; /* Time in seconds */

    /* Drift nodes */
    for (let i = 0; i < NODE_COUNT; i++) {
      const offset = nodeOffsets[i];
      const speed  = nodeSpeeds[i];
      posAttr.array[i * 3 + 1] = nodePositions[i].y + Math.sin(t * speed + offset) * 8;
    }

    posAttr.needsUpdate = true;

    /* Smoothly rotate network toward mouse */
    network.rotation.x += (targetRotX - network.rotation.x) * 0.04;
    network.rotation.y += (targetRotY - network.rotation.y) * 0.04;

    /* Slow continuous drift rotation */
    network.rotation.z += 0.0005;

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize Handler ─────────────────────────── */
  const onResize = () => {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  window.addEventListener('resize', onResize);
}


/* ─────────────────────────────────────────────
   6. GSAP — HERO ENTRANCE ANIMATION
   Staggered reveal: eyebrow → title words → subtitle → buttons
   Runs once on page load (not scroll-triggered).
   ───────────────────────────────────────────── */
function setupHeroAnimation() {
  if (typeof gsap === 'undefined') return;

  const tl = gsap.timeline({ delay: 0.3 });

  /* Eyebrow */
  tl.fromTo('.hero__eyebrow',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
  );

  /* Title words — staggered per word */
  tl.fromTo('.hero__title .word',
    { opacity: 0, y: 60, skewY: 4 },
    {
      opacity: 1, y: 0, skewY: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.1,
    },
    '-=0.3'  /* Overlap slightly with eyebrow */
  );

  /* Subtitle */
  tl.fromTo('.hero__subtitle',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
    '-=0.4'
  );

  /* CTA buttons */
  tl.fromTo('.hero__actions',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
    '-=0.3'
  );

  /* Scroll indicator */
  tl.fromTo('.hero__scroll',
    { opacity: 0 },
    { opacity: 1, duration: 1 },
    '-=0.2'
  );
}


/* ─────────────────────────────────────────────
   7. GSAP — FADE-UP ON SCROLL
   Any element with [data-animate="fade-up"]
   fades in + rises as it enters the viewport.
   ───────────────────────────────────────────── */
function setupFadeUpAnimations() {
  if (typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('[data-animate="fade-up"]').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',  /* Trigger when top of element is 88% down viewport */
          once: true,        /* Only play once — don't reverse on scroll up */
        },
      }
    );
  });
}


/* ─────────────────────────────────────────────
   8. GSAP — SKILL CARDS STAGGER
   Cards in the skills grid stagger in with
   a wave effect as the grid enters viewport.
   ───────────────────────────────────────────── */
function setupSkillCards() {
  if (typeof ScrollTrigger === 'undefined') return;

  const cards = document.querySelectorAll('[data-animate="skill-card"]');
  if (!cards.length) return;

  gsap.fromTo(cards,
    { opacity: 0, y: 50, scale: 0.95 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      stagger: {
        amount: 0.6,     /* Total stagger duration across all cards */
        from: 'start',
        grid: 'auto',
      },
      scrollTrigger: {
        trigger: '.skills-grid',
        start: 'top 80%',
        once: true,
      },
    }
  );
}


/* ─────────────────────────────────────────────
   9. GSAP — PROJECT PANEL BACKGROUND TRANSITIONS
   As the user scrolls into each project panel,
   GSAP smoothly changes the section background color.
   Each panel has data-project-color on its element.
   ───────────────────────────────────────────── */
function setupProjectPanels() {
  if (typeof ScrollTrigger === 'undefined') return;

  const panels = document.querySelectorAll('.project-panel');

  panels.forEach((panel) => {
    const targetColor = panel.getAttribute('data-project-color');

    /* Animate background color of the entire .projects section
       as each panel scrolls into view */
    ScrollTrigger.create({
      trigger: panel,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => {
        gsap.to('.projects', {
          backgroundColor: targetColor,
          duration: 0.8,
          ease: 'power2.inOut',
        });
      },
      onEnterBack: () => {
        gsap.to('.projects', {
          backgroundColor: targetColor,
          duration: 0.8,
          ease: 'power2.inOut',
        });
      },
    });

    /* Panel content slides in from slight offset */
    const content = panel.querySelector('.project-panel__content');
    const meta    = panel.querySelector('.project-panel__meta');
    const visual  = panel.querySelector('.project-panel__visual');

    if (content) {
      gsap.fromTo(content,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 75%',
            once: true,
          },
        }
      );
    }

    if (meta) {
      gsap.fromTo(meta,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: {
            trigger: panel,
            start: 'top 75%',
            once: true,
          },
        }
      );
    }

    if (visual) {
      gsap.fromTo(visual,
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.2,
          scrollTrigger: {
            trigger: panel,
            start: 'top 75%',
            once: true,
          },
        }
      );
    }
  });

  /* Reset bg color when leaving all projects */
  ScrollTrigger.create({
    trigger: '#projects',
    start: 'bottom bottom',
    onLeave: () => {
      gsap.to('.projects', { backgroundColor: 'var(--bg)', duration: 0.5 });
    },
    onEnterBack: () => {
      /* Re-trigger last panel color when scrolling back in */
    },
  });
}


/* ─────────────────────────────────────────────
   10. GSAP — PARALLAX ON PROJECT IMAGES
   Project visual cards move at a slightly
   different rate than scroll for depth effect.
   ───────────────────────────────────────────── */
function setupParallax() {
  if (typeof ScrollTrigger === 'undefined') return;

  document.querySelectorAll('[data-parallax]').forEach((el) => {
    gsap.fromTo(el,
      { y: -20 },
      {
        y: 20,
        ease: 'none',   /* Linear — parallax should not ease */
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,   /* Scrub: 1.5s lag behind scroll */
        },
      }
    );
  });
}


/* ─────────────────────────────────────────────
   11. AI TERMINAL — CHAT INTERFACE LOGIC
   Handles user input, suggestion chips, and
   AI API calls.

   FLASK INTEGRATION:
   POST /api/chat
   Body: JSON { message: string, history: Array }
   Response: JSON { reply: string }

   To wire up: Replace simulateAIResponse() with
   the actual fetch call to your Flask route.
   ───────────────────────────────────────────── */
function setupTerminal() {
  const input       = document.getElementById('terminal-input');
  const sendBtn     = document.getElementById('terminal-send');
  const output      = document.getElementById('terminal-output');
  const suggestions = document.querySelectorAll('.suggestion-chip');

  if (!input || !sendBtn || !output) return;

  /* Conversation history for multi-turn context */
  const history = [];

  /* ── Send a message ─────────────────────────── */
  async function sendMessage(messageText) {
    const msg = (messageText || input.value).trim();
    if (!msg) return;

    /* Append user line to terminal */
    appendLine('user', msg);
    input.value = '';

    /* Show typing indicator */
    const typingEl = appendTypingIndicator();

    try {
      /* ── ACTUAL FETCH — Flask Integration ────── */
      /* Uncomment and adjust when Flask is ready:
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await response.json();
      const reply = data.reply;
      */

      /* ── PLACEHOLDER — Simulated response ────── */
      /* Remove this when Flask /api/chat is live: */
      const reply = await simulateAIResponse(msg);

      /* Update history for next turn */
      history.push({ role: 'user',      content: msg   });
      history.push({ role: 'assistant', content: reply });

      /* Remove typing indicator and append reply */
      typingEl.remove();
      appendLine('ai', reply);

    } catch (err) {
      typingEl.remove();
      appendLine('ai', `Error: Could not reach the server. (${err.message})`);
    }

    /* Auto-scroll to bottom */
    output.scrollTop = output.scrollHeight;
  }

  /* ── DOM helpers ────────────────────────────── */
  function appendLine(role, text) {
    const lineEl = document.createElement('div');
    lineEl.className = 'terminal__line' + (role === 'ai' ? ' terminal__line--response' : '');

    if (role === 'user') {
      lineEl.innerHTML = `
        <span class="terminal__prompt" aria-hidden="true">~/portfolio $</span>
        <span class="terminal__text terminal__text--typed">${escapeHtml(text)}</span>
      `;
    } else {
      lineEl.innerHTML = `
        <span class="terminal__text">
          <span class="terminal__tag accent-text">[AI]</span> ${escapeHtml(text)}
        </span>
      `;
    }

    output.appendChild(lineEl);
    output.scrollTop = output.scrollHeight;
    return lineEl;
  }

  function appendTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'terminal__line terminal__line--response';
    el.innerHTML = `
      <span class="terminal__text">
        <span class="terminal__tag accent-text">[AI]</span>
        <span class="terminal__typing" aria-label="AI is thinking">
          <span></span><span></span><span></span>
        </span>
      </span>
    `;
    output.appendChild(el);
    output.scrollTop = output.scrollHeight;
    return el;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Event Listeners ────────────────────────── */
  sendBtn.addEventListener('click', () => sendMessage());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  /* Suggestion chips autofill input */
  suggestions.forEach((chip) => {
    chip.addEventListener('click', () => {
      const suggestion = chip.getAttribute('data-suggestion');
      sendMessage(suggestion);
    });
  });

  /* ── PLACEHOLDER AI Response ─────────────────
     Replace this entire function with your actual
     Flask /api/chat fetch when backend is ready.
  ───────────────────────────────────────────── */
  async function simulateAIResponse(msg) {
    /* Simulate network latency */
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

    const m = msg.toLowerCase();

    if (m.includes('project') || m.includes('built') || m.includes('work')) {
      return "Saurabh has built: BunkMaster (Flask + Claude API attendance planner), Computer Vision Air Tracing (OpenCV + MediaPipe), VibeCheck (Gemini-powered campus mood tracker), a VIT Faculty Directory with 306+ real entries, and more. Want details on any specific project?";
    }
    if (m.includes('stack') || m.includes('tech') || m.includes('skill')) {
      return "Core stack: Python, Flask, SQLite, OpenCV, MediaPipe, HTML/CSS/JS. He integrates Claude API, Gemini 2.0, and other LLMs. Favors single-file self-contained builds with dark premium UI aesthetics.";
    }
    if (m.includes('intern') || m.includes('available') || m.includes('hire') || m.includes('opportunit')) {
      return "Yes — Saurabh is actively looking for internship opportunities in AI/ML engineering, computer vision, or full-stack development. Best way to reach him: LinkedIn (saurabhrajpoot08) or the contact form on this site.";
    }
    if (m.includes('ml') || m.includes('ai') || m.includes('machine learning')) {
      return "Saurabh studies CSE with AI & ML specialization at VIT Bhopal (BTech, 2025 batch). Beyond coursework, he applies ML practically: real-time CV systems, LLM integrations, and AI-powered web apps.";
    }
    if (m.includes('contact') || m.includes('email') || m.includes('reach')) {
      return "You can reach Saurabh via: the contact form below, LinkedIn at saurabhrajpoot08, GitHub at Saurabh1616, or Instagram @oyeeee.saurabh. He typically responds within 24 hours.";
    }

    /* Default fallback */
    return "Great question! I have context about Saurabh's projects, skills, and background. Could you be more specific? Try asking about his tech stack, a particular project, or his availability for opportunities.";
  }
}


/* ─────────────────────────────────────────────
   12. CONTACT FORM — MICRO-INTERACTIONS & SUBMIT
   ───────────────────────────────────────────── */
function setupContactForm() {
  const submitBtn = document.getElementById('contact-submit');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async () => {
    const name    = document.getElementById('name')?.value.trim();
    const email   = document.getElementById('email')?.value.trim();
    const message = document.getElementById('message')?.value.trim();

    if (!name || !email || !message) {
      /* Shake the empty fields */
      document.querySelectorAll('.form-input').forEach((input) => {
        if (!input.value.trim()) {
          gsap.fromTo(input, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        }
      });
      return;
    }

    /* Loading state */
    const btnText  = submitBtn.querySelector('.btn__text');
    const original = btnText.textContent;
    btnText.textContent = 'Sending...';
    submitBtn.disabled  = true;

    try {
      /* ── FLASK INTEGRATION ─────────────────────
         Uncomment when Flask contact route is live:
      const res  = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      ─────────────────────────────────────────── */

      /* Placeholder — simulate success */
      await new Promise(r => setTimeout(r, 1200));

      /* Success animation */
      btnText.textContent = '✓ Sent!';
      gsap.to(submitBtn, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });

      /* Reset after delay */
      setTimeout(() => {
        btnText.textContent  = original;
        submitBtn.disabled   = false;
        document.getElementById('name').value    = '';
        document.getElementById('email').value   = '';
        document.getElementById('message').value = '';
      }, 3000);

    } catch (err) {
      btnText.textContent = 'Error — try again';
      submitBtn.disabled  = false;
      setTimeout(() => { btnText.textContent = original; }, 2500);
    }
  });
}


/* ─────────────────────────────────────────────
   13. HOVER: CURSOR EXPANSION ON INTERACTIVE ELS
   When hovering links, buttons, inputs — the
   cursor ring expands (CSS handles the expansion,
   JS toggles the class on body).
   ───────────────────────────────────────────── */
function setupHoverCursor() {
  const interactiveSelectors = 'a, button, input, textarea, [data-magnetic], .suggestion-chip, .skill-card, .contact__social';

  document.querySelectorAll(interactiveSelectors).forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor--link'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor--link'));
  });
}
