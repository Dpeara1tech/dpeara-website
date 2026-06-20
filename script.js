(() => {
  'use strict';

  /* ============ Footer year ============ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============ Sticky nav background on scroll ============ */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 12) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ============ Mobile menu ============ */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  const closeMenu = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.classList.toggle('is-open', !isOpen);
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  /* ============ FAQ accordion ============ */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-item__q');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ============ Contact form (mailto handoff) ============ */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const reason = form.reason.value;
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      status.textContent = 'Please fill in your name, email, and message.';
      return;
    }

    const subject = encodeURIComponent(`Dpeara — ${reason} (from ${name})`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nReason: ${reason}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:dpeara.tech@gmail.com?subject=${subject}&body=${body}`;
    status.textContent = 'Opening your email client to send this message…';
  });

  /* ============ Signature visual: Noise → Signal ============
     A field of scattered particles (information noise) that
     periodically converges into a clean horizontal waveform
     (the signal), then drifts apart again. Respects
     prefers-reduced-motion by rendering a single static frame.
  */
  const canvas = document.getElementById('signalCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let particles = [];
  const PARTICLE_COUNT_BASE = 90;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  }

  function buildParticles() {
    const count = width < 700 ? Math.round(PARTICLE_COUNT_BASE * 0.55) : PARTICLE_COUNT_BASE;
    particles = new Array(count).fill(0).map((_, i) => {
      const signalX = (i / (count - 1)) * width;
      const signalY = height * 0.52 + Math.sin(i * 0.45) * height * 0.06;
      return {
        noiseX: Math.random() * width,
        noiseY: Math.random() * height,
        signalX,
        signalY,
        r: Math.random() * 1.4 + 0.6,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.2,
      };
    });
  }

  // Cycle: 0 -> 1 -> 0 controls blend between noise (0) and signal (1)
  let cycle = 0;
  let lastTime = 0;
  const CYCLE_DURATION = 7000; // ms for one noise->signal->noise loop

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function draw(time) {
    if (!lastTime) lastTime = time;
    const elapsed = time % CYCLE_DURATION;
    const t = elapsed / CYCLE_DURATION; // 0..1
    // triangle wave 0->1->0
    const tri = t < 0.5 ? t * 2 : (1 - t) * 2;
    cycle = easeInOutCubic(tri);

    ctx.clearRect(0, 0, width, height);

    // draw connecting signal line when mostly converged
    if (cycle > 0.55) {
      const lineAlpha = (cycle - 0.55) / 0.45;
      ctx.beginPath();
      particles.forEach((p, i) => {
        const x = p.signalX;
        const y = p.signalY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = `rgba(79, 182, 255, ${0.35 * lineAlpha})`;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(79,182,255,0.6)';
      ctx.shadowBlur = 8 * lineAlpha;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    particles.forEach((p) => {
      const wobbleX = Math.sin(time * 0.0006 * p.speed + p.phase) * (1 - cycle) * 14;
      const wobbleY = Math.cos(time * 0.0007 * p.speed + p.phase) * (1 - cycle) * 14;

      const x = p.noiseX + (p.signalX - p.noiseX) * cycle + wobbleX;
      const y = p.noiseY + (p.signalY - p.noiseY) * cycle + wobbleY;

      const alpha = 0.25 + cycle * 0.55;
      const radius = p.r * (0.8 + cycle * 0.6);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${110 + cycle * 40}, ${190 + cycle * 20}, 255, ${alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  function drawStatic() {
    // Reduced motion: render particles settled into the signal line once.
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    particles.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.signalX, p.signalY);
      else ctx.lineTo(p.signalX, p.signalY);
    });
    ctx.strokeStyle = 'rgba(79, 182, 255, 0.3)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.signalX, p.signalY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(140, 205, 255, 0.7)';
      ctx.fill();
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (reduceMotion) drawStatic();
    }, 150);
  });

  resize();

  if (reduceMotion) {
    drawStatic();
  } else {
    requestAnimationFrame(draw);
  }
})();
