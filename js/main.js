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

/* ── 5. Filtros de proyectos (página proyectos.html) ─────── */
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
