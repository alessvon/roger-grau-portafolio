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

/* ── 3. Animación fade-in con IntersectionObserver ───────── */
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

/* ── 5. Malla de partículas interactiva (canvas) ─────────── */
/* Un único <canvas> fijo al viewport que dibuja una malla del alto   */
/* del documento: los puntos se dibujan en coordenadas de documento   */
/* con offset de scroll, así la malla se desplaza con el contenido.   */
/* Sólo se dibuja lo visible por frame (rinde con miles de puntos).   */
const meshCanvas = document.getElementById('particles-bg');

if (meshCanvas && meshCanvas.getContext) {
  const ctx = meshCanvas.getContext('2d');
  const TAU = Math.PI * 2;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;

  // Parámetros
  const SPACING = 11.5;     // separación entre puntos (px)
  const DOT     = 0.9;      // radio base del punto (px)
  const RADIUS  = 65;       // radio de influencia del cursor (px)
  const LIFT    = 16;       // elevación máxima bajo el cursor (px)
  const GROW    = 1.4;      // crecimiento extra máximo (escala)
  const HUE_EDGE = 300, HUE_SWEEP = 150, HUE_DRIFT = 0.05;
  const ACCENT = '232, 255, 0';

  let dpr = 1, vw = 0, vh = 0, docH = 0;
  let cols = 0, rows = 0, offsetX = 0, offsetY = SPACING / 2;

  // Figura (mano 🖐) animada, anclada al hero (coords de documento)
  const SHAPE_RES = 200;
  let shapeFlags = null;         // Uint8Array(cols*rows): 1 = punto del contorno
  let shapeCandidates = [];      // celdas dentro de la zona de la mano
  let shapeBox = null;           // { x, y, w, h } en coords de documento
  let shapeCanvas = null, shapeCtx = null;

  // Letrero (marquee): banda de ANCHO COMPLETO de la pantalla. El texto entra
  // por el borde derecho y sale por el izquierdo, cruzando todo el viewport.
  const MQ_RES_H = 110;          // resolución vertical del muestreo del texto
  const MQ_TEXT_FRAC = 0.82;     // alto de la letra respecto a la banda (deja margen para tildes)
  let marqueeBand = null;        // { x:0, y, w:vw, h } en coords de documento
  let marqueeCandidates = [];    // celdas dentro de la banda
  let mqCanvas = null, mqCtx = null, mqCanvasW = 0;

  // Punteros de iluminación (coords de pantalla)
  const pointers = [];
  let mouseX = -9999, mouseY = -9999;

  // ── Medición / (re)construcción de la grilla ──────────────
  const measure = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    docH = Math.max(document.documentElement.scrollHeight, vh);

    meshCanvas.width = Math.round(vw * dpr);
    meshCanvas.height = Math.round(vh * dpr);
    meshCanvas.style.width = vw + 'px';
    meshCanvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.max(1, Math.ceil(vw / SPACING) + 1);
    rows = Math.max(1, Math.ceil(docH / SPACING) + 1);
    offsetX = (vw - (cols - 1) * SPACING) / 2;
    shapeFlags = new Uint8Array(cols * rows);
    setupShapeZone();
    renderFrame(performance.now()); // repinta al instante (evita canvas en blanco)
  };

  // Define la zona de la mano (encima del título) en coords de documento
  const setupShapeZone = () => {
    shapeCandidates = [];
    shapeBox = null;
    const title = document.querySelector('#hero h1');
    if (!title) return;
    const rect = title.getBoundingClientRect();
    const topDoc = rect.top + window.scrollY;
    const available = topDoc - 88 - 16;
    if (available < 120) return;
    const boxH = Math.min(available, 560);
    const boxW = boxH;
    const boxX = rect.left + rect.width / 2 - boxW / 2;
    const boxY = topDoc - boxH - 16;
    shapeBox = { x: boxX, y: boxY, w: boxW, h: boxH };

    const c0 = Math.max(0, Math.floor((boxX - offsetX) / SPACING));
    const c1 = Math.min(cols - 1, Math.ceil((boxX + boxW - offsetX) / SPACING));
    const r0 = Math.max(0, Math.floor((boxY - offsetY) / SPACING));
    const r1 = Math.min(rows - 1, Math.ceil((boxY + boxH - offsetY) / SPACING));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const x = offsetX + c * SPACING;
        const y = offsetY + r * SPACING;
        if (x >= boxX && x <= boxX + boxW && y >= boxY && y <= boxY + boxH) {
          shapeCandidates.push({ idx: r * cols + c, x, y });
        }
      }
    }

    if (!shapeCanvas) {
      shapeCanvas = document.createElement('canvas');
      shapeCanvas.width = SHAPE_RES;
      shapeCanvas.height = SHAPE_RES;
      shapeCtx = shapeCanvas.getContext('2d', { willReadFrequently: true });
    }

    // Banda del letrero: ancho completo del viewport, centrada a la altura de
    // la mano. Recoge todas las celdas de la grilla dentro de esa franja.
    const bandH = Math.max(60, Math.round(boxH * 0.42));
    const bandY = boxY + boxH / 2 - bandH / 2;
    marqueeBand = { x: 0, y: bandY, w: vw, h: bandH };
    marqueeCandidates = [];
    const mr0 = Math.max(0, Math.floor((bandY - offsetY) / SPACING));
    const mr1 = Math.min(rows - 1, Math.ceil((bandY + bandH - offsetY) / SPACING));
    for (let r = mr0; r <= mr1; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * SPACING;
        const y = offsetY + r * SPACING;
        if (y >= bandY && y <= bandY + bandH) {
          marqueeCandidates.push({ idx: r * cols + c, x, y });
        }
      }
    }

    // Canvas del letrero: ancho proporcional a la banda para no deformar la
    // letra (píxeles cuadrados respecto al muestreo vertical MQ_RES_H).
    mqCanvasW = Math.max(1, Math.round(vw * (MQ_RES_H / bandH)));
    if (!mqCanvas) {
      mqCanvas = document.createElement('canvas');
      mqCtx = mqCanvas.getContext('2d', { willReadFrequently: true });
    }
    mqCanvas.width = mqCanvasW;
    mqCanvas.height = MQ_RES_H;
  };

  // Cartel de puntos: saluda con la mano (🖐) y luego pasa un letrero LED con
  // las frases, en bucle. La mano se muestrea por CONTORNO (líneas) y el texto
  // por RELLENO (letras sólidas, más legibles).
  //   Ciclo: saluda ~1.5 s  →  pasa el letrero  →  repite.
  // Citas famosas y breves sobre producto. Se muestran de a una; entre cada
  // una vuelve a aparecer el saludo. (Editá libremente este array.)
  const PHRASES = [
    'Enamorate del problema, no de la solución.  — Uri Levine',
    'Enfocate en el usuario y lo demás vendrá solo.  — Google',
    'La simplicidad es la máxima sofisticación.  — Da Vinci',
    'Hacé algo que la gente quiera.  — Y Combinator',
    'El diseño es cómo funciona.  — Steve Jobs',
    'Empezá con el porqué.  — Simon Sinek',
  ];
  const WAVE_MAX = 0.30, WAVE_PERIOD = 850;
  const WAVE_DURATION = 3000;   // ms de saludo entre una frase y la siguiente
  const SCROLL_SPEED = 180;     // px de PANTALLA por segundo (desplazamiento)
  const marqueeFont = () =>
    `700 ${Math.round(MQ_RES_H * MQ_TEXT_FRAC)}px system-ui, "Segoe UI", Arial, sans-serif`;

  // Estado del ciclo (se reinicia solo): saludo → frase[i] → saludo → frase[i+1]…
  let mqPhase = 'wave';         // 'wave' | 'marquee'
  let mqPhaseStart = -1;        // se fija en el 1er frame
  let mqLastT = -1;
  let mqIndex = 0;              // frase actual
  let mqText = '';              // texto de la frase en curso
  let mqScrollX = 0;            // borde izq. del texto (px de pantalla; vw = fuera, a la derecha)
  let mqTextW = 0;              // ancho del texto en px de pantalla

  // Dibuja la mano (rotada) en el canvas oculto
  const drawHand = (sctx, R, angle) => {
    sctx.save();
    const pvx = R / 2, pvy = R * 0.9;
    sctx.translate(pvx, pvy);
    sctx.rotate(angle);
    sctx.translate(-pvx, -pvy);
    sctx.font = `${R * 0.6}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('🖐', R / 2, R * 0.5);
    sctx.restore();
  };

  // Fase saludo: enciende las celdas del CONTORNO de la mano (caja cuadrada)
  const sampleHand = (t) => {
    const R = SHAPE_RES, sctx = shapeCtx;
    sctx.clearRect(0, 0, R, R);
    drawHand(sctx, R, reduceMotion ? 0 : WAVE_MAX * Math.sin((t - mqPhaseStart) / WAVE_PERIOD * TAU));

    let data;
    try { data = sctx.getImageData(0, 0, R, R).data; } catch (e) { return; }

    const { x: bx, y: by, w: bw, h: bh } = shapeBox;
    const k = Math.max(2, Math.round((R / bw) * SPACING));
    const inside = (sx, sy) =>
      sx >= 0 && sy >= 0 && sx < R && sy < R && data[(sy * R + sx) * 4 + 3] > 90;

    for (const cand of shapeCandidates) {
      const sx = Math.min(R - 1, ((cand.x - bx) / bw * R) | 0);
      const sy = Math.min(R - 1, ((cand.y - by) / bh * R) | 0);
      if (inside(sx, sy) &&                     // contorno → sólo el borde
        (!inside(sx - k, sy) || !inside(sx + k, sy) ||
         !inside(sx, sy - k) || !inside(sx, sy + k))) {
        shapeFlags[cand.idx] = 1;
      }
    }
  };

  // Fase letrero: enciende las celdas del RELLENO del texto en la banda de
  // ancho completo. mqScrollX está en px de pantalla; se escala al canvas.
  const sampleMarquee = () => {
    if (!mqCtx || !marqueeBand || !mqCanvasW) return;
    const W = mqCanvasW, H = MQ_RES_H, mctx = mqCtx;
    const { x: bx, y: by, w: bw, h: bh } = marqueeBand;
    const scale = W / bw;                       // px de canvas por px de pantalla

    mctx.clearRect(0, 0, W, H);
    mctx.font = marqueeFont();
    mctx.textAlign = 'left';
    mctx.textBaseline = 'middle';
    mctx.fillText(mqText, mqScrollX * scale, H * 0.5);

    let data;
    try { data = mctx.getImageData(0, 0, W, H).data; } catch (e) { return; }
    const inside = (sx, sy) =>
      sx >= 0 && sy >= 0 && sx < W && sy < H && data[(sy * W + sx) * 4 + 3] > 90;

    for (const cand of marqueeCandidates) {
      const sx = Math.min(W - 1, Math.max(0, ((cand.x - bx) / bw * W) | 0));
      const sy = Math.min(H - 1, Math.max(0, ((cand.y - by) / bh * H) | 0));
      if (inside(sx, sy)) shapeFlags[cand.idx] = 1;   // relleno → letras sólidas
    }
  };

  // Recalcula qué celdas se encienden en este frame (mano o letrero)
  const updateShape = (t) => {
    if (!shapeFlags) return;
    shapeFlags.fill(0);
    if (!shapeBox || !shapeCtx) return;

    if (reduceMotion) { sampleHand(t); return; } // mano estática, sin letrero

    if (mqPhaseStart < 0) { mqPhaseStart = t; mqLastT = t; }
    const dt = Math.min((t - mqLastT) / 1000, 0.1);
    mqLastT = t;

    if (mqPhase === 'wave') {
      sampleHand(t);
      if (t - mqPhaseStart >= WAVE_DURATION && mqCtx && marqueeBand) {
        // Toma la frase actual, la mide (px de pantalla) y la coloca a la derecha
        mqText = PHRASES[mqIndex];
        mqCtx.font = marqueeFont();
        mqTextW = mqCtx.measureText(mqText).width * marqueeBand.w / mqCanvasW;
        mqScrollX = marqueeBand.w;              // = vw → entra desde el borde derecho
        mqPhase = 'marquee';
        mqPhaseStart = t;
      }
    } else {
      sampleMarquee();
      mqScrollX -= SCROLL_SPEED * dt;           // se desplaza hacia la izquierda
      if (mqScrollX <= -mqTextW) {              // salió por completo por la izquierda
        mqIndex = (mqIndex + 1) % PHRASES.length; // siguiente frase
        mqPhase = 'wave';                       // vuelve a saludar 3 s
        mqPhaseStart = t;
      }
    }
  };

  // ── Bucle de dibujo ───────────────────────────────────────
  const r2 = RADIUS * RADIUS;
  let raf = 0;

  const renderFrame = (t) => {
    const scrollY = window.scrollY || window.pageYOffset || 0;

    // Punteros virtuales (móvil / sin hover): recorren la pantalla
    if (!canHover && !reduceMotion && pointers.length) {
      const dt = 1 / 60;
      for (const p of pointers) {
        const sp = Math.hypot(p.vx, p.vy) || 1;
        const a = Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * 0.8 * dt;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        else if (p.x > vw) { p.x = vw; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        else if (p.y > vh) { p.y = vh; p.vy = -Math.abs(p.vy); }
      }
    } else if (canHover && !reduceMotion) {
      pointers.length = 0;
      if (mouseX > -9999) pointers.push({ x: mouseX, y: mouseY });
    }

    // ¿La zona de la mano está visible? Sólo entonces la animamos.
    const shapeVisible = shapeBox &&
      shapeBox.y + shapeBox.h > scrollY && shapeBox.y < scrollY + vh;
    if (shapeVisible) updateShape(t); else if (shapeFlags) shapeFlags.fill(0);

    ctx.clearRect(0, 0, vw, vh);

    const rr0 = Math.max(0, Math.floor((scrollY - offsetY) / SPACING) - 1);
    const rr1 = Math.min(rows - 1, Math.ceil((scrollY + vh - offsetY) / SPACING) + 1);

    // Paso 1: puntos base (tela tenue), todos en un solo trazado
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(${ACCENT}, 0.22)`;
    ctx.beginPath();
    const lit = [];
    const now = t;
    for (let r = rr0; r <= rr1; r++) {
      const sy = offsetY + r * SPACING - scrollY;
      const rowBase = r * cols;
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * SPACING;
        if (shapeFlags[rowBase + c]) { lit.push({ x, y: sy, shape: 1 }); continue; }
        let f = 0;
        for (const p of pointers) {
          const dx = x - p.x, dy = sy - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) { const fi = 1 - Math.sqrt(d2) / RADIUS; if (fi > f) f = fi; }
        }
        if (f > 0) { lit.push({ x, y: sy, f }); continue; }
        ctx.moveTo(x + DOT, sy);
        ctx.arc(x, sy, DOT, 0, TAU);
      }
    }
    ctx.fill();

    // Paso 2: puntos iluminados (cursor y figura)
    for (const p of lit) {
      if (p.shape) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${ACCENT}, 0.9)`;
        ctx.fillStyle = `rgba(${ACCENT}, 1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, DOT * 1.7, 0, TAU);
        ctx.fill();
      } else {
        const f = p.f;
        const hue = ((HUE_EDGE - f * HUE_SWEEP + now * HUE_DRIFT) % 360 + 360) % 360;
        const light = 45 + f * 25;
        const a = Math.min(1, f * 1.25);
        const col = `hsla(${hue.toFixed(0)}, 100%, ${light.toFixed(0)}%, ${a.toFixed(3)})`;
        ctx.shadowBlur = f * 16;
        ctx.shadowColor = col;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(p.x, p.y - f * LIFT, DOT * (1 + f * GROW), 0, TAU);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  };

  const loop = (t) => {
    renderFrame(t);
    raf = requestAnimationFrame(loop);
  };

  // ── Inicio ────────────────────────────────────────────────
  measure();

  if (!canHover && !reduceMotion) {
    for (let i = 0; i < 3; i++) {
      const ang = Math.random() * TAU, sp = 45 + Math.random() * 45;
      pointers.push({ x: Math.random() * vw, y: Math.random() * vh, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp });
    }
  }

  if (canHover && !reduceMotion) {
    window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    document.documentElement.addEventListener('mouseleave', () => { mouseX = mouseY = -9999; });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 200);
  });
  // El alto del documento puede cambiar tras cargar (fuentes, imágenes)
  window.addEventListener('load', () => setTimeout(measure, 100));

  raf = requestAnimationFrame(loop); // arranca el bucle (measure() ya pintó el 1er frame)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(loop);
  });
}


/* ── 6. Hero: título que se «descifra» (recurso Revuelto de Moxen) ─ */
/* Cada letra pasa por otros alfabetos y cae en su sitio al cargar.    */
const heroTitle = document.getElementById('hero-title');
if (heroTitle && window.Revuelto) {
  const lineas = Array.from(heroTitle.querySelectorAll('.hero-title-line'));
  if (lineas.length) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Cada palabra («Roger», «Grau») se descifra por separado con la misma
        // animación. Los glifos de otros alfabetos (hebreo, chino) usan fuentes
        // de reserva más altas, así que fijamos la altura de cada línea y
        // evitamos el salto de palabra mientras dura el efecto: así ninguna
        // línea reflúye a la de abajo ni al subtítulo.
        lineas.forEach(linea => {
          const texto = linea.textContent.trim();
          linea.style.height = linea.offsetHeight + 'px';
          linea.style.whiteSpace = 'nowrap';
          linea.style.overflow = 'hidden';
          window.Revuelto.cambia(linea, texto, { dura: 1100 }).then(() => {
            linea.style.height = '';
            linea.style.whiteSpace = '';
            linea.style.overflow = '';
          });
        });
      }, 180);
    });
  }
}


/* ── 8. Navbar: subrayado elástico que sigue al cursor ───────────── */
/* Adaptado del recurso «Subrayado» de Moxen (moxen.cl/recursos/        */
/* subrayado): dos resortes mueven cada extremo de la raya, así se      */
/* estira al viajar entre links y se encoge al llegar. Aquí lo guía el  */
/* hover (no una pestaña activa) y se retrae al salir del menú.         */
(function () {
  const lista = document.querySelector('#navMenu .navbar-nav');
  if (!lista) return;
  const soporta = window.matchMedia('(min-width: 992px) and (hover: hover)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = Array.from(lista.querySelectorAll('.nav-link'));
  if (!links.length) return;

  const raya = document.createElement('span');
  raya.className = 'nav-raya';
  raya.setAttribute('aria-hidden', 'true');
  lista.appendChild(raya);

  // cada extremo: posición, velocidad, destino y rigidez (delante tira, detrás arrastra)
  const DELANTE = 340, DETRAS = 110, FRENO = 1.45;
  const izq = { x: 0, v: 0, meta: 0, k: DELANTE }, der = { x: 0, v: 0, meta: 0, k: DELANTE };
  let visible = false, raf = 0, ultimo = null;

  function bordes(el) {
    const l = lista.getBoundingClientRect(), r = el.getBoundingClientRect();
    return [r.left - l.left, r.right - l.left];
  }
  function pinta() {
    raya.style.transform = 'translateX(' + izq.x.toFixed(2) + 'px)';
    raya.style.width = Math.max(0, der.x - izq.x).toFixed(2) + 'px';
    raya.style.opacity = visible ? '1' : '0';
  }
  function paso(ts) {
    if (ultimo === null) ultimo = ts;
    let dt = Math.min(.05, (ts - ultimo) / 1000);
    ultimo = ts;
    for (; dt > 0; dt -= 1 / 240) {
      const h = Math.min(dt, 1 / 240);
      [izq, der].forEach(e => {
        e.v += (-e.k * (e.x - e.meta) - FRENO * Math.sqrt(e.k) * e.v) * h;
        e.x += e.v * h;
      });
    }
    pinta();
    const quieto = [izq, der].every(e => Math.abs(e.x - e.meta) < .1 && Math.abs(e.v) < .1);
    if (quieto) { izq.x = izq.meta; der.x = der.meta; izq.v = der.v = 0; pinta(); raf = 0; ultimo = null; return; }
    raf = requestAnimationFrame(paso);
  }
  function anima() { if (!raf) raf = requestAnimationFrame(paso); }

  function va(el) {
    const [l, r] = bordes(el);
    const derecha = l >= der.meta;            // ¿viaja hacia la derecha?
    if (!visible) { izq.x = der.x = (l + r) / 2; }  // nace en el centro del link
    izq.meta = l; der.meta = r;
    visible = true;
    if (reduce) { izq.x = l; der.x = r; return pinta(); }
    der.k = derecha ? DELANTE : DETRAS;
    izq.k = derecha ? DETRAS : DELANTE;
    anima();
  }
  function esconde() {
    const centro = (izq.meta + der.meta) / 2;
    izq.meta = der.meta = centro;             // los dos extremos se juntan y desaparece
    visible = false;
    if (reduce) return pinta();
    izq.k = der.k = DELANTE;
    anima();
  }

  links.forEach(a => a.addEventListener('pointerenter', () => { if (soporta.matches) va(a); }));
  lista.addEventListener('pointerleave', () => { if (soporta.matches) esconde(); });
  window.addEventListener('resize', () => { if (visible) pinta(); });
})();


/* ── 9. Carrusel de proyectos (recurso «Puntos» de Moxen) ────────── */
/* Reemplaza el stack vertical: una card a la vez, con paginación       */
/* «gusano», flechas y swipe. La lógica vive en vendor/puntos.js.       */
if (window.Puntos) {
  document.querySelectorAll('[data-puntos-raiz]').forEach(raiz => {
    window.Puntos(raiz);
  });
}
