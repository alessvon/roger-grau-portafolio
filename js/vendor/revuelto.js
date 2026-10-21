/* Recurso «Revuelto» de Moxen (moxen.cl/recursos/revuelto) — animación gratis,
   usada bajo su licencia: libre para proyectos propios y de clientes; no se
   revende ni se republica como recurso propio. Código íntegro del autor. */

/* =====================================================================
   Revuelto · Moxen
   Cambia un texto por otro haciendo pasar cada letra por alfabetos
   ajenos —turco, griego, hebreo, chino— hasta asentarse, de izquierda a
   derecha y con un poco de azar. Pensado para cambiar de idioma, pero
   sirve para cualquier cambio de texto.

     Revuelto.cambia(elemento, 'Texto nuevo')          → Promise
     Revuelto.cambia(elemento, html, { dura: 900 })

   Lo que llega puede traer HTML (un <br>, un enlace): durante el efecto
   se anima solo el texto y al terminar entra el HTML de verdad.
   ===================================================================== */
(function () {
  'use strict';

  /* Los alfabetos por los que pasan las letras. Se pueden cambiar o
     ampliar con Revuelto.alfabetos. */
  const ALFABETOS = {
    turco:  'ÇĞİÖŞÜçğışöüâîû',
    griego: 'ΔΘΛΞΠΣΦΨΩαβγδλμπσφω',
    hebreo: 'אבגדהוזחטיכלמנסעפצקרשת',
    chino:  '数据系统设计网页应用流程库存订单',
  };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plano = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

  function cambia(el, html, opciones) {
    const o = Object.assign({ dura: null, alfabetos: Object.keys(ALFABETOS) }, opciones);
    const glifos = o.alfabetos.map(a => ALFABETOS[a] || a).join('');
    const glifo = () => glifos[(Math.random() * glifos.length) | 0];

    if (el.__revuelto) cancelAnimationFrame(el.__revuelto);
    if (reduce) { el.innerHTML = html; return Promise.resolve(); }

    const destino = plano(html), origen = el.textContent;
    const n = Math.max(destino.length, origen.length);
    // los textos largos tardan algo más, pero nunca más de poco más de un segundo
    const dura = o.dura || Math.min(1150, 520 + n * 4);
    // cuándo se asienta cada letra: de izquierda a derecha, con algo de azar
    const asienta = Array.from({ length: n }, (_, i) =>
      .3 + .62 * (i / Math.max(1, n - 1)) + Math.random() * .08);
    const t0 = performance.now();

    return new Promise(listo => {
      const paso = ahora => {
        const p = (ahora - t0) / dura;
        if (p >= 1) { el.__revuelto = 0; el.innerHTML = html; listo(); return; }
        let s = '';
        for (let i = 0; i < n; i++) {
          const fin = destino[i], antes = origen[i];
          if (p >= asienta[i]) { s += fin || ''; continue; }
          const ref = fin != null ? fin : antes;
          // los espacios se respetan: así las palabras no se mezclan
          s += !ref || /\s/.test(ref) ? (ref || '') : glifo();
        }
        el.textContent = s;
        el.__revuelto = requestAnimationFrame(paso);
      };
      el.__revuelto = requestAnimationFrame(paso);
    });
  }

  window.Revuelto = { cambia, alfabetos: ALFABETOS };
})();
