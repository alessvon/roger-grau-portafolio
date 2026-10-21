/* Recurso «Puntos» de Moxen (moxen.cl/recursos/puntos) — animación gratis,
   usada bajo su licencia: libre para proyectos propios y de clientes; no se
   revende ni se republica como recurso propio. Código íntegro del autor. */

/* =====================================================================
   Puntos · Moxen
   La paginación de un carrusel: el punto activo es una píldora que, al
   cambiar de página, se estira hacia la nueva como un gusano —primero la
   punta, luego la cola— y se funde con los puntos por los que pasa.
   Sin dependencias.

     Puntos(document.querySelector('[data-puntos-raiz]'));

   La fusión es un filtro SVG (#pt-funde en el index.html): desenfoca y
   vuelve a cortar el borde, de modo que dos formas cercanas se unen.
   ===================================================================== */
(function () {
  'use strict';

  // la punta es rápida y la cola perezosa: de esa diferencia sale el estirón
  const PUNTA = { k: 520, c: 40 }, COLA = { k: 140, c: 22 };

  function Puntos(raiz, opciones) {
    const caja = raiz.querySelector('[data-puntos]');
    // la píldora mide lo que diga --pt-largo en el CSS
    const o = Object.assign({ largo: parseFloat(getComputedStyle(caja).getPropertyValue('--pt-largo')) || 50, alto: 16 }, opciones);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pista = raiz.querySelector('[data-puntos-pista]');
    const n = pista.children.length;

    const puntos = Array.from({ length: n }, (_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pt-punto';
      b.setAttribute('aria-label', 'Ir a la ' + (i + 1) + '.ª');
      b.addEventListener('click', () => ir(i));
      caja.appendChild(b);
      return b;
    });
    const gusano = document.createElement('span');
    gusano.className = 'pt-gusano';
    caja.appendChild(gusano);

    let actual = 0, raf = 0, antes = 0;
    const centro = i => puntos[i].offsetLeft + puntos[i].offsetWidth / 2;
    const borde = (x) => ({ x, v: 0, meta: x, par: COLA });
    const izq = borde(centro(0) - o.largo / 2), der = borde(centro(0) + o.largo / 2);

    function dibuja() {
      const ancho = der.x - izq.x;
      // cuanto más se estira, más fina: el volumen se conserva a ojo
      const estiron = Math.min(1, Math.max(0, (ancho - o.largo) / (3 * o.largo)));
      const alto = o.alto * (1 - .3 * estiron);
      gusano.style.width = ancho.toFixed(2) + 'px';
      gusano.style.height = alto.toFixed(2) + 'px';
      gusano.style.transform = 'translate(' + izq.x.toFixed(2) + 'px, -50%)';
    }

    function paso(t) {
      raf = 0;
      const dt = antes ? Math.min((t - antes) / 1000, 1 / 30) : 1 / 60;
      antes = t;
      if (dt > 0) {
        const k = Math.ceil(dt / (1 / 240)), h = dt / k;
        [izq, der].forEach(b => {
          for (let s = 0; s < k; s++) {
            b.v += (b.par.k * (b.meta - b.x) - b.par.c * b.v) * h;
            b.x += b.v * h;
          }
        });
        // la cola nunca adelanta a la punta
        if (der.x - izq.x < o.alto) { const m = (der.x + izq.x) / 2; izq.x = m - o.alto / 2; der.x = m + o.alto / 2; }
        dibuja();
      }
      const quieto = [izq, der].every(b => Math.abs(b.meta - b.x) < .05 && Math.abs(b.v) < .05);
      if (quieto) { izq.x = izq.meta; der.x = der.meta; dibuja(); }
      else raf = requestAnimationFrame(paso);
    }

    function ir(i) {
      i = (i + n) % n;
      const sube = i > actual;
      actual = i;
      pista.style.transform = 'translateX(' + (-100 * i) + '%)';
      puntos.forEach((p, j) => p.setAttribute('aria-current', j === i ? 'true' : 'false'));
      // el borde que mira hacia el destino es la punta
      der.par = sube ? PUNTA : COLA;
      izq.par = sube ? COLA : PUNTA;
      izq.meta = centro(i) - o.largo / 2;
      der.meta = centro(i) + o.largo / 2;
      if (reduce) { izq.x = izq.meta; der.x = der.meta; dibuja(); return; }
      if (!raf) { antes = 0; raf = requestAnimationFrame(paso); }
    }

    const ant = raiz.querySelector('[data-puntos-ant]'), sig = raiz.querySelector('[data-puntos-sig]');
    if (ant) ant.addEventListener('click', () => ir(actual - 1));
    if (sig) sig.addEventListener('click', () => ir(actual + 1));
    raiz.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') ir(actual - 1);
      if (e.key === 'ArrowRight') ir(actual + 1);
    });
    // deslizar con el dedo sobre el carrusel
    const visor = raiz.querySelector('[data-puntos-visor]');
    let x0 = null;
    if (visor) {
      visor.addEventListener('pointerdown', e => { x0 = e.clientX; });
      visor.addEventListener('pointerup', e => {
        if (x0 === null) return;
        const dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1));
      });
    }
    addEventListener('resize', () => { izq.x = izq.meta = centro(actual) - o.largo / 2; der.x = der.meta = centro(actual) + o.largo / 2; dibuja(); });

    dibuja();
    ir(0);
    return { ir, actual: () => actual };
  }

  window.Puntos = Puntos;
})();
