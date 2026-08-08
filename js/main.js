/* ============================================================
   main.js — Lógica general del portfolio
============================================================ */

/* ── 0. Avatar fallback ─────────────────────────────────── */
const avatarImg = document.getElementById('avatar-img');
if (avatarImg) {
  avatarImg.addEventListener('error', () => {
    avatarImg.classList.add('d-none');
    const fallback = document.getElementById('avatar-fallback');
    if (fallback) fallback.classList.remove('d-none');
  });
}

/* ── 1. Navbar: sombra al hacer scroll ──────────────────── */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(12, 12, 12, 0.97)';
    navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.45)';
  } else {
    navbar.style.background = 'rgba(12, 12, 12, 0.85)';
    navbar.style.boxShadow = 'none';
  }
});

/* ── 2. Cierra el menú móvil al hacer click en un link ──── */
document.querySelectorAll('#navMenu .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const collapseEl = document.getElementById('navMenu');
    const instance = bootstrap.Collapse.getInstance(collapseEl);
    if (instance) instance.hide();
  });
});

/* ── 3. Formulario de contacto ──────────────────────────── */
const form = document.querySelector('.contact-form');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>¡Mensaje enviado!';
    btn.classList.replace('btn-accent', 'btn-success');
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.replace('btn-success', 'btn-accent');
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
}

/* ── 4. Animación fade-in con IntersectionObserver ───────── */
const fadeEls = document.querySelectorAll(
  '.skill-card, .project-card, .contact-info, .contact-form, .avatar-img, .quick-facts'
);

fadeEls.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

fadeEls.forEach(el => observer.observe(el));

/* ── 5. Malla de partículas interactiva — fondo global ───── */
/* Lienzo fijo a nivel de viewport, detrás de todo el contenido.      */
/* Al pasar el cursor (en cualquier parte de la home), los puntos     */
/* cercanos se elevan, crecen y se iluminan con un gradiente neón.    */
const particlesBg = document.getElementById('particles-bg');

if (particlesBg) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPACING = 34;   // separación entre puntos (px) — menor = más densa
  const RADIUS  = 130;  // radio de influencia del cursor (px)
  const LIFT    = 16;   // elevación máxima del punto (px)
  const GROW    = 1.4;  // crecimiento extra máximo (escala)

  let dots = [];

  // Construye/reconstruye la grilla que cubre el viewport
  const buildGrid = () => {
    particlesBg.innerHTML = '';
    dots = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cols = Math.ceil(w / SPACING);
    const rows = Math.ceil(h / SPACING);
    const offsetX = (w - (cols - 1) * SPACING) / 2;
    const offsetY = (h - (rows - 1) * SPACING) / 2;
    const fragment = document.createDocumentFragment();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * SPACING;
        const y = offsetY + r * SPACING;
        const el = document.createElement('span');
        el.className = 'particle';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        fragment.appendChild(el);
        dots.push({ el, x, y, active: false });
      }
    }
    particlesBg.appendChild(fragment);
  };

  buildGrid();

  // Reconstruye la malla al redimensionar (con debounce)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildGrid, 200);
  });

  // Interacción (se omite si el usuario reduce movimiento)
  if (!reduceMotion) {
    const r2 = RADIUS * RADIUS;
    const HUE_EDGE = 300;  // tono en el borde de la zona (magenta)
    const HUE_SWEEP = 150; // cuánto varía el tono hacia el centro (→ cian)
    const HUE_DRIFT = 0.05; // velocidad de deriva del gradiente en el tiempo

    // Ilumina la malla según uno o varios "punteros" {x, y}.
    // Cada punto usa la mayor influencia (f) de todos los punteros.
    const render = (pointers) => {
      const now = performance.now();
      for (const d of dots) {
        let f = 0;
        for (const p of pointers) {
          const dx = d.x - p.x;
          const dy = d.y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < r2) {
            const fi = 1 - Math.sqrt(dist2) / RADIUS;
            if (fi > f) f = fi;
          }
        }
        const st = d.el.style;
        if (f > 0) {
          st.transform =
            `translate(-50%, calc(-50% - ${(f * LIFT).toFixed(1)}px)) scale(${(1 + f * GROW).toFixed(3)})`;
          const hue = (HUE_EDGE - f * HUE_SWEEP + now * HUE_DRIFT) % 360;
          const light = 45 + f * 25; // más brillante hacia el centro
          st.background = `hsl(${hue.toFixed(0)}, 100%, ${light.toFixed(0)}%)`;
          st.boxShadow = `0 0 ${(f * 11).toFixed(1)}px hsl(${hue.toFixed(0)}, 100%, 65%)`;
          d.active = true;
        } else if (d.active) {
          st.transform = 'translate(-50%, -50%) scale(1)';
          st.background = '';
          st.boxShadow = '';
          d.active = false;
        }
      }
    };

    const canHover = window.matchMedia('(hover: hover)').matches;

    if (canHover) {
      // Escritorio: un único puntero = el cursor (event-driven, ahorra CPU).
      // El lienzo es fijo, así que clientX/clientY mapean a la grilla.
      let mouseX = -9999, mouseY = -9999, ticking = false;
      const tick = () => { ticking = false; render([{ x: mouseX, y: mouseY }]); };

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!ticking) { ticking = true; requestAnimationFrame(tick); }
      });

      document.documentElement.addEventListener('mouseleave', () => {
        mouseX = mouseY = -9999;
        requestAnimationFrame(tick);
      });
    } else {
      // Móvil / sin hover: varios punteros virtuales recorren la pantalla
      // en bucle, para que la animación se muestre sin necesidad de cursor.
      const COUNT = 3;
      const SPEED_MIN = 45, SPEED_MAX = 90; // px/segundo

      const seed = (p) => {
        p.x = Math.random() * window.innerWidth;
        p.y = Math.random() * window.innerHeight;
        const ang = Math.random() * Math.PI * 2;
        const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
        p.vx = Math.cos(ang) * speed;
        p.vy = Math.sin(ang) * speed;
      };

      const pointers = Array.from({ length: COUNT }, () => { const p = {}; seed(p); return p; });

      let last = performance.now();
      let rafId = 0;

      const loop = (t) => {
        const dt = Math.min((t - last) / 1000, 0.05); // clamp por si hubo pausa
        last = t;
        const w = window.innerWidth, h = window.innerHeight;

        for (const p of pointers) {
          // Deriva suave (wander) para que el recorrido no sea recto
          const sp = Math.hypot(p.vx, p.vy);
          const ang = Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * 0.8 * dt;
          p.vx = Math.cos(ang) * sp;
          p.vy = Math.sin(ang) * sp;

          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Rebote en los bordes del viewport
          if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
          else if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx); }
          if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
          else if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy); }
        }

        render(pointers);
        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);

      // Pausa el bucle cuando la pestaña no está visible (ahorra batería)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(rafId);
        } else {
          last = performance.now();
          rafId = requestAnimationFrame(loop);
        }
      });
    }
  }
}

/* ── 6. Filtros de proyectos (página proyectos.html) ─────── */
const filterBtns = document.querySelectorAll('.btn-filter');
const projectItems = document.querySelectorAll('.project-item');

if (filterBtns.length > 0) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      /* Actualiza botón activo */
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      projectItems.forEach(item => {
        const category = item.dataset.category || '';
        const matches = filter === 'all' || category.includes(filter);

        /* Aplica transición de visibilidad */
        if (matches) {
          item.style.display = '';
          item.style.opacity = '0';
          requestAnimationFrame(() => {
            item.style.transition = 'opacity 0.3s ease';
            item.style.opacity = '1';
          });
        } else {
          item.style.transition = 'opacity 0.2s ease';
          item.style.opacity = '0';
          setTimeout(() => { item.style.display = 'none'; }, 200);
        }
      });
    });
  });
}
