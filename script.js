/* =============================================
   SAURABH PORTFOLIO — JAVASCRIPT
   Full interactivity, animations, effects
   ============================================= */

'use strict';

// ────────────────────────────────────────────
// 1. LOADER
// ────────────────────────────────────────────
(function initLoader() {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loaderFill');
  const counter = document.getElementById('loaderCounter');
  const loaderText = document.getElementById('loaderText');
  const messages = ['INITIALIZING', 'LOADING ASSETS', 'RENDERING UI', 'ALMOST THERE', 'LAUNCHING'];
  let progress = 0;

  document.body.classList.add('loading');

  const interval = setInterval(() => {
    const delta = Math.random() * 12 + 3;
    progress = Math.min(progress + delta, 100);

    fill.style.width = progress + '%';
    counter.textContent = Math.round(progress) + '%';
    loaderText.textContent = messages[Math.floor((progress / 100) * (messages.length - 1))];

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('exit');
        document.body.classList.remove('loading');
        setTimeout(() => { loader.style.display = 'none'; }, 700);
        // Trigger hero animations
        triggerHeroAnimations();
      }, 300);
    }
  }, 60);
})();

// ────────────────────────────────────────────
// 2. CUSTOM CURSOR
// ────────────────────────────────────────────
(function initCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let raf;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    raf = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effect on interactive elements
  const interactiveSelectors = 'a, button, .skill-card, .project-card, .highlight-item, .social-link, .timeline-card';
  document.querySelectorAll(interactiveSelectors).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });

  // Hide on leave
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '0.6';
  });
})();

// ────────────────────────────────────────────
// 3. PARTICLE CANVAS
// ────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null };
  let animationId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.baseAlpha = Math.random() * 0.4 + 0.1;
      this.alpha = this.baseAlpha;
      this.isRed = Math.random() > 0.7;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Mouse repulsion
      if (mouse.x && mouse.y) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          this.x += dx * force * 0.02;
          this.y += dy * force * 0.02;
        }
      }

      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.isRed ? '#e30613' : '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Create particles
  const count = Math.min(120, Math.floor((canvas.width * canvas.height) / 10000));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  // Draw connection lines
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 120) * 0.08;
          ctx.strokeStyle = '#e30613';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animationId = requestAnimationFrame(animate);
  }

  animate();
})();

// ────────────────────────────────────────────
// 4. HERO ANIMATIONS
// ────────────────────────────────────────────
function triggerHeroAnimations() {
  // Animate stat counters
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 20);
  });
}

// ────────────────────────────────────────────
// 5. HEADER SCROLL
// ────────────────────────────────────────────
(function initHeader() {
  const header = document.getElementById('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });
})();

// ────────────────────────────────────────────
// 6. MOBILE MENU
// ────────────────────────────────────────────
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
    });
  });
})();

// ────────────────────────────────────────────
// 7. SCROLL REVEAL
// ────────────────────────────────────────────
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Stagger children
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 0);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  elements.forEach(el => observer.observe(el));
})();

// ────────────────────────────────────────────
// 8. SKILL BAR ANIMATION
// ────────────────────────────────────────────
(function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const fill = bar.querySelector('.skill-fill');
        const width = bar.dataset.width;
        setTimeout(() => {
          fill.style.width = width + '%';
        }, 200);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.4 });

  bars.forEach(bar => observer.observe(bar));
})();

// ────────────────────────────────────────────
// 9. SMOOTH SCROLL
// ────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const headerH = document.getElementById('header').offsetHeight;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  });
});

// ────────────────────────────────────────────
// 10. CONTACT FORM
// ────────────────────────────────────────────
(function initForm() {
  const form = document.getElementById('contactForm');
  const btn = document.getElementById('submitBtn');
  const success = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const message = document.getElementById('messageInput').value.trim();

    if (!name || !email || !message) return;

    // Simulate send
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'SENDING...';

    setTimeout(() => {
      btn.style.display = 'none';
      success.classList.add('show');
      form.reset();

      setTimeout(() => {
        btn.style.display = '';
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'SEND MESSAGE';
        success.classList.remove('show');
      }, 5000);
    }, 1500);
  });
})();

// ────────────────────────────────────────────
// 11. ACTIVE NAV LINK ON SCROLL
// ────────────────────────────────────────────
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === '#' + id) {
            link.style.color = '#e30613';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();

// ────────────────────────────────────────────
// 12. PARALLAX & TILT on Hero Visual
// ────────────────────────────────────────────
(function initParallax() {
  const heroVisual = document.getElementById('heroVisual');
  if (!heroVisual) return;

  document.addEventListener('mousemove', (e) => {
    const xPct = (e.clientX / window.innerWidth - 0.5) * 20;
    const yPct = (e.clientY / window.innerHeight - 0.5) * 20;
    heroVisual.style.transform = `translateY(-50%) rotateX(${-yPct * 0.3}deg) rotateY(${xPct * 0.3}deg)`;
  });
})();

// ────────────────────────────────────────────
// 13. MAGNETIC BUTTON EFFECT
// ────────────────────────────────────────────
(function initMagnetic() {
  const magneticEls = document.querySelectorAll('.btn-primary, .nav-cta');

  magneticEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.25;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

// ────────────────────────────────────────────
// 14. RANDOM GLITCH on Hover of Project Titles
// ────────────────────────────────────────────
(function initProjectGlitch() {
  const titles = document.querySelectorAll('.project-title');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

  titles.forEach(title => {
    const originalText = title.innerHTML;

    title.closest('.project-card').addEventListener('mouseenter', () => {
      const plainText = title.textContent;
      let iter = 0;
      const interval = setInterval(() => {
        title.querySelectorAll(':not(span)').forEach(() => {});
        // Re-set raw text with scramble effect
        const scrambled = plainText.split('').map((char, idx) => {
          if (idx < iter) return char;
          if (char === '\n' || char === ' ') return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        // Only scramble text nodes
        const redSpan = title.querySelector('.red-text');
        const redContent = redSpan ? redSpan.textContent : '';
        iter += 0.5;
        if (iter >= plainText.length) {
          clearInterval(interval);
        }
      }, 30);
    });
  });
})();

// ────────────────────────────────────────────
// 15. CURSOR TRAIL SPARKS
// ────────────────────────────────────────────
(function initSparks() {
  let lastTime = 0;

  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTime < 80) return;
    lastTime = now;

    const spark = document.createElement('div');
    spark.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9998;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: #e30613;
      border-radius: 50%;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 6px rgba(227,6,19,0.8);
      animation: sparkFade 0.6s ease-out forwards;
    `;
    document.body.appendChild(spark);

    setTimeout(() => spark.remove(), 600);
  });

  // Add spark keyframe dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes sparkFade {
      0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(calc(-50% + ${(Math.random()-0.5)*30}px), calc(-50% - 30px)) scale(0.1); }
    }
  `;
  document.head.appendChild(style);
})();

// ────────────────────────────────────────────
// 16. NAV CTA → Open Contact
// ────────────────────────────────────────────
document.getElementById('navCta')?.addEventListener('click', () => {
  const contact = document.getElementById('contact');
  if (contact) {
    const headerH = document.getElementById('header').offsetHeight;
    window.scrollTo({ top: contact.offsetTop - headerH, behavior: 'smooth' });
  }
});

// ────────────────────────────────────────────
// 17. BACK TO TOP 3D Rotate on hover
// ────────────────────────────────────────────
const backBtn = document.getElementById('backToTop');
if (backBtn) {
  backBtn.addEventListener('mouseenter', () => {
    backBtn.querySelector('i').style.transform = 'rotate(-45deg)';
  });
  backBtn.addEventListener('mouseleave', () => {
    backBtn.querySelector('i').style.transform = '';
  });
}

// ────────────────────────────────────────────
// 18. CONSOLE EASTER EGG
// ────────────────────────────────────────────
console.log(
  '%c⚠ SAURABH.DEV\n%cHey recruiter 👋 — if you\'re reading this, you already know I pay attention to detail.\nLet\'s talk: saurabh@example.com',
  'color: #e30613; font-size: 20px; font-weight: bold; font-family: monospace;',
  'color: #888; font-size: 12px; font-family: monospace;'
);

console.log(
  '%c[ STACK: React · Node · Python · MongoDB · AI ]',
  'color: #e30613; font-family: monospace; font-size: 11px; letter-spacing: 2px;'
);
