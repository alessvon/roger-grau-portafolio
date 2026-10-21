# Roger Grau — Portfolio Personal

Portfolio de Roger Grau, Product Engineer. Proyecto Preentrega 3 — Coderhouse Desarrollo Web.

## Páginas

| Archivo | Descripción |
|---|---|
| `index.html` | Página principal: Hero, Proyectos destacados (carrusel), Contacto |
| `pages/sobre-mi.html` | Perfil y trayectoria |
| `pages/proyecto-*.html` | Páginas de detalle de cada proyecto |

## Tecnologías

- **HTML5** semántico (section, article, address, figure, nav…)
- **Bootstrap 5.3** — grid, componentes, navbar responsiva
- **SCSS/SASS** — arquitectura modular compilada a `css/style.css`
- **CSS3** — custom properties, animaciones, transiciones, Grid, Flexbox
- **JavaScript** vanilla — scroll effects, filtros, fade-in observer
- **Bootstrap Icons 1.11**

## Arquitectura SCSS

```
scss/
  abstracts/
    _variables.scss   → colores, tipografía, espaciado, breakpoints
    _functions.scss   → rem(), strip-unit(), scale-between()
    _mixins.scss      → respond-up/down, flex-center, auto-grid, transition, dot-grid, mono-label
  base/
    _css-vars.scss    → custom properties CSS (:root)
    _reset.scss       → box-sizing, scroll-behavior, ::selection
    _typography.scss  → Syne headings, IBM Plex Mono body, fluid clamp()
    _animations.scss  → keyframes + .fade-in + .hero-animate + prefers-reduced-motion
  components/
    _badges.scss      → .badge-section, .icon-muted
    _buttons.scss     → %btn-base (extend), .btn-accent, .btn-outline-light, .btn-filter
    _cards.scss       → .project-card (BEM), @each para gradientes
    _forms.scss       → .custom-input, .form-label
  layout/
    _header.scss      → #navbar con backdrop-filter y nesting
    _footer.scss      → .footer-dark, .footer-nav, .footer-location
    _grid.scss        → .section-light/dark, .section-heading, @each para utilidades de texto
    _responsive.scss  → breakpoints mobile/tablet/desktop + print
  pages/
    _home.scss        → hero, sobre-mi, skills, contacto
    _projects.scss    → .page-hero, #projects-grid
  main.scss           → importa todo con @use
```

### Características SCSS utilizadas

- **Variables** (`$color-accent`, `$font-display`, `$bp-md`…)
- **Nesting** con `&` para pseudo-clases y modificadores BEM
- **Mixins** reutilizables: `respond-up/down`, `flex-center`, `transition`, `dot-grid`, `mono-label`
- **@extend** con placeholder `%btn-base` compartido entre botones
- **@each** para generar clases dinámicas (gradientes de cards, utilidades de texto)
- **@use** / módulos Sass modernos (sin @import obsoleto)

## Scripts

```bash
# Instalar dependencias (solo primera vez)
npm install

# Compilar SCSS → CSS (una vez)
npm run sass:build

# Compilar SCSS en modo watch (desarrollo)
npm run sass:watch

# Compilar minificado para producción
npm run sass:prod
```

> **Importante**: nunca editar `css/style.css` directamente — siempre editar los archivos `.scss`.

## Estructura de carpetas

```
/
  index.html
  pages/              ← sobre-mí y detalles de proyecto
  css/
    style.css          ← compilado automático (no editar)
  scss/                ← fuente SCSS
  js/
    main.js
  assets/
    images/
  package.json
  .gitignore
  README.md
```

## Desarrollo local

```bash
# Clonar y abrir
git clone https://github.com/alessvon/roger-grau-portafolio
cd roger-grau-portafolio
npm install
npm run sass:watch
# Abrir index.html en el navegador
```

No requiere servidor. Abrir `index.html` directamente en el navegador.

## GitHub Pages

El sitio está disponible en: `https://alessvon.github.io/roger-grau-portafolio`

## Créditos

Algunas animaciones provienen de los recursos gratuitos de **Moxen** ([moxen.cl/recursos](https://moxen.cl/recursos.html)), usados bajo su licencia (libres para proyectos propios y de clientes; no se revenden ni se republican como recursos propios):

- **Revuelto** — título del hero que se «descifra» pasando por otros alfabetos (`js/vendor/revuelto.js`).
- **Puntos** — carrusel de proyectos (home y página de proyectos): las tarjetas se desplazan enteras y la paginación es un «gusano» que se estira y se funde con un filtro SVG (`js/vendor/puntos.js`, `scss/components/_carousel.scss`).
- **Subrayado** — base del subrayado elástico del navbar, adaptado a hover en `js/main.js`.

---

Hecho con HTML, CSS, SCSS, Bootstrap y JavaScript · Coderhouse 2026
