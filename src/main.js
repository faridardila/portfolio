import './style.css'
import 'lenis/dist/lenis.css'
import Lenis from 'lenis'
import cvPdf from './assets/cv2.pdf'

// Importación de imágenes de experiencia para empaquetado de producción en Vite
import expImg1 from './assets/1cchampionship.jpg'
import expImg2 from './assets/second_championship.png'
import expImg3 from './assets/hackathon.png'

const cvLink = document.querySelector('.nav-links a[href*="cv"]');
if (cvLink) {
  cvLink.href = cvPdf;
}

// Configuración de Lenis: Scroll con inercia y desaceleración suave (Momentum)
const lenis = new Lenis({
  duration: 1.2, // Duración del planeo en segundos
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva de desaceleración exponencial
  smoothWheel: true,
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Navegación suave con Lenis al hacer clic en enlaces internos (#about, #projects)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const hash = anchor.getAttribute('href');
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: -75 });
    }
  });
});

/* ==========================================================================
   PANTALLA DE INICIO (WELCOME SCREEN) - TYPEWRITER & CORTINA
   ========================================================================== */
function initWelcomeScreen() {
  const welcomeScreen = document.querySelector('#welcome-screen');
  const welcomeText = document.querySelector('.welcome-text');
  const scrollBtn = document.querySelector('.welcome-scroll-btn');
  if (!welcomeScreen || !welcomeText) return;

  // Bloqueamos el scroll mientras la cortina esté activa
  document.body.classList.add('welcome-active');
  lenis.stop();
  window.scrollTo(0, 0);

  // Idiomas para el ciclo infinito (Inglés, Español, Italiano, Francés, Turco)
  const words = ['hi!', '¡hola!', 'ciao!', 'salut!', 'merhaba!'];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timeoutId = null;
  let isDismissed = false;
  let isTransitioning = false;

  function typeLoop() {
    if (isDismissed) return;
    const currentWord = words[wordIndex];

    if (isDeleting) {
      charIndex--;
      welcomeText.textContent = currentWord.substring(0, charIndex);

      if (charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        timeoutId = setTimeout(typeLoop, 350); // Pausa corta antes de escribir la siguiente
        return;
      }
      timeoutId = setTimeout(typeLoop, 75); // Velocidad de borrado
    } else {
      charIndex++;
      welcomeText.textContent = currentWord.substring(0, charIndex);

      if (charIndex === currentWord.length) {
        isDeleting = true;
        timeoutId = setTimeout(typeLoop, 1500); // Pausa con la palabra completa
        return;
      }
      timeoutId = setTimeout(typeLoop, 210); // Velocidad al escribir (más pausada y natural)
    }
  }

  // Pequeña pausa inicial de 400ms antes de empezar a escribir
  timeoutId = setTimeout(typeLoop, 400);

  function dismissWelcome() {
    if (isDismissed) return;
    isDismissed = true;
    isTransitioning = true;
    if (timeoutId) clearTimeout(timeoutId);

    // Aseguramos que el contenido esté firmemente anclado en la parte superior (0, 0)
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    welcomeScreen.classList.add('is-dismissed');

    // Desbloqueamos el scroll solo cuando la cortina ha terminado de subir por completo
    setTimeout(() => {
      document.body.classList.remove('welcome-active');
      isTransitioning = false;
      lenis.start();
      welcomeScreen.style.display = 'none';
      window.scrollTo(0, 0);
    }, 850);
  }

  // Disparadores para levantar la cortina:
  if (scrollBtn) {
    scrollBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissWelcome();
    });
  }
  welcomeScreen.addEventListener('click', dismissWelcome);

  // Al mover la rueda del ratón o trackpad: cancelamos el scroll nativo para no desplazar el contenido
  window.addEventListener('wheel', (e) => {
    if (!isDismissed) {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 5) {
        dismissWelcome();
      }
    } else if (isTransitioning) {
      // Bloqueamos cualquier inercia remanente mientras la cortina se desliza hacia arriba
      e.preventDefault();
    }
  }, { passive: false });

  // Gestos táctiles en móviles
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDismissed) {
      e.preventDefault();
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      if (deltaY > 12) {
        dismissWelcome();
      }
    } else if (isTransitioning) {
      e.preventDefault();
    }
  }, { passive: false });

  // Teclado
  window.addEventListener('keydown', (e) => {
    if (!isDismissed && ['ArrowDown', 'Space', 'PageDown', 'Enter'].includes(e.code)) {
      e.preventDefault();
      dismissWelcome();
    }
  });
}

initWelcomeScreen();

const expSection = document.querySelector('.experience');
const timelineItems = document.querySelectorAll('.timeline-item');
const expImg = document.querySelector('#current-exp-img');

// Asignamos las URLs empaquetadas por Vite a cada ítem del timeline
const expImages = [expImg1, expImg2, expImg3];
timelineItems.forEach((item, index) => {
  if (expImages[index]) {
    item.dataset.image = expImages[index];
  }
});

if (expImg && expImages[0]) {
  expImg.src = expImages[0];
}

let activeIndex = -1;

function updateExperienceScroll() {
  if (!expSection || timelineItems.length === 0) return;

  const rect = expSection.getBoundingClientRect();
  const topStickyOffset = 85;
  const totalTravel = rect.height - window.innerHeight;

  if (totalTravel <= 0) return;

  // Calculamos el progreso del scroll dentro de la sección (de 0.0 a 1.0)
  const scrolled = topStickyOffset - rect.top;
  const progress = Math.max(0, Math.min(1, scrolled / totalTravel));

  const count = timelineItems.length;
  // Mapeamos el progreso al índice del trabajo (0, 1, 2, 3...)
  const targetIndex = Math.min(count - 1, Math.floor(progress * count));

  if (targetIndex !== activeIndex) {
    activeIndex = targetIndex;
    
    timelineItems.forEach((item, index) => {
      if (index === targetIndex) {
        item.classList.add('active');
        
        // Cambiar la foto suavemente con fundido
        const newImgSrc = item.dataset.image;
        if (newImgSrc && expImg && expImg.src !== newImgSrc) {
          expImg.style.opacity = '0.3';
          setTimeout(() => {
            expImg.src = newImgSrc;
            expImg.style.opacity = '1';
          }, 150);
        }
      } else {
        item.classList.remove('active');
      }
    });
  }
}

// Conectamos el evento de Lenis para sincronizar la animación frame por frame
lenis.on('scroll', updateExperienceScroll);
window.addEventListener('scroll', updateExperienceScroll, { passive: true });

// Ejecutar una vez al cargar para activar el primer ítem
updateExperienceScroll();

/* ==========================================================================
   CONEXIONES DE LA CONSTELACIÓN DE IDIOMAS
   ========================================================================== */
function initLanguagesConstellation() {
  const container = document.querySelector('.languages-container');
  const svg = document.querySelector('.constellation-svg');
  const hub = document.querySelector('.languages-hub');
  if (!container || !svg || !hub) return;

  function updateLines() {
    const cRect = container.getBoundingClientRect();
    const hRect = hub.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    svg.setAttribute('viewBox', `0 0 ${cRect.width} ${cRect.height}`);
    svg.innerHTML = '';

    const titleEl = hub.querySelector('.languages-title');
    const descEl = hub.querySelector('.languages-desc');
    const tRect = titleEl ? titleEl.getBoundingClientRect() : hRect;
    const dRect = descEl ? descEl.getBoundingClientRect() : hRect;

    const flagNodes = container.querySelectorAll('.flag-node');
    flagNodes.forEach(node => {
      const flagKey = node.dataset.flag;
      const circle = node.querySelector('.flag-circle');
      if (!circle) return;

      const fRect = circle.getBoundingClientRect();
      const fx = fRect.left - cRect.left + fRect.width / 2;
      const fy = fRect.top - cRect.top + fRect.height / 2;
      const r = fRect.width / 2;

      // Determinamos el punto objetivo en el texto (centrado armonioso)
      let hx, hy;
      if (flagKey === 'turkey') {
        hx = tRect.left - cRect.left + 40;
        hy = tRect.top - cRect.top + tRect.height * 0.72;
      } else if (flagKey === 'usa') {
        hx = tRect.left - cRect.left + tRect.width * 0.45;
        hy = tRect.top - cRect.top;
      } else if (flagKey === 'italy') {
        hx = tRect.left - cRect.left + tRect.width * 0.85;
        hy = tRect.top - cRect.top + 12;
      } else if (flagKey === 'france') {
        hx = dRect.left - cRect.left + 28;
        hy = dRect.bottom - cRect.top;
      } else if (flagKey === 'spain') {
        hx = dRect.right - cRect.left - 28;
        hy = dRect.bottom - cRect.top;
      } else {
        hx = hRect.left - cRect.left + hRect.width / 2;
        hy = hRect.top - cRect.top + hRect.height / 2;
      }

      // Ángulo desde la bandera hacia el texto
      const angle = Math.atan2(hy - fy, hx - fx);

      // Punto inicial: borde exterior del círculo de la bandera
      const dotX = fx + r * Math.cos(angle);
      const dotY = fy + r * Math.sin(angle);

      // Margen de separación para que la línea no quede pegada al texto
      const textGap = 22;
      const endX = hx - Math.cos(angle) * textGap;
      const endY = hy - Math.sin(angle) * textGap;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('constellation-connection');
      g.dataset.for = flagKey;

      // Línea punteada
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', dotX);
      line.setAttribute('y1', dotY);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', endY);
      line.setAttribute('stroke', '#C52929');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '4 5');
      line.setAttribute('stroke-linecap', 'round');

      // Punto rojo sólido en el borde de la bandera
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', dotX);
      dot.setAttribute('cy', dotY);
      dot.setAttribute('r', '3.8');
      dot.setAttribute('fill', '#C52929');

      g.appendChild(line);
      g.appendChild(dot);
      svg.appendChild(g);

      // Microinteracción al pasar el mouse por la bandera
      node.onmouseenter = () => g.classList.add('highlight');
      node.onmouseleave = () => g.classList.remove('highlight');
    });
  }

  window.updateLanguagesConstellation = updateLines;
  updateLines();
  window.addEventListener('resize', updateLines);
  window.addEventListener('load', updateLines);
  if (document.fonts) {
    document.fonts.ready.then(updateLines);
  }
}

initLanguagesConstellation();

/* ==========================================================================
   ANIMACIÓN TYPEWRITER EN TÍTULOS ("WORK", "EXPERIENCE", "LANGUAGES")
   ========================================================================== */
function createTitleTypewriter({ selector, sectionSelector, words, initialDelay = 1200 }) {
  const el = document.querySelector(selector);
  const section = document.querySelector(sectionSelector);
  if (!el || !words.length) return;

  let wordIndex = 0;
  let charIndex = words[0].length;
  let isDeleting = true;
  let timeoutId = null;
  let isVisible = false;

  function typeLoop() {
    if (!isVisible) return;
    const currentWord = words[wordIndex];

    if (isDeleting) {
      charIndex--;
      el.textContent = currentWord.substring(0, charIndex);

      if (charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        timeoutId = setTimeout(typeLoop, 350); // Pausa corta antes de la siguiente palabra
        return;
      }
      timeoutId = setTimeout(typeLoop, 75); // Velocidad de borrado
    } else {
      charIndex++;
      el.textContent = currentWord.substring(0, charIndex);

      if (charIndex === currentWord.length) {
        isDeleting = true;
        timeoutId = setTimeout(typeLoop, 1600); // Pausa con la palabra completa
        return;
      }
      timeoutId = setTimeout(typeLoop, 210); // Velocidad de escritura coordinada
    }
  }

  // Activar cuando la sección correspondiente entra al campo visual
  if (section && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            timeoutId = setTimeout(typeLoop, initialDelay);
          }
        } else {
          isVisible = false;
          if (timeoutId) clearTimeout(timeoutId);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(section);
  } else {
    isVisible = true;
    timeoutId = setTimeout(typeLoop, initialDelay);
  }
}

function initAllTitleTypewriters() {
  // Proyectos: Check out my [work]
  createTitleTypewriter({
    selector: '.project-typewriter',
    sectionSelector: '#projects',
    words: ['work', 'trabajo', 'lavoro', 'travail'],
    initialDelay: 1200,
  });

  // Experiencia: My humble [experience]
  createTitleTypewriter({
    selector: '.exp-typewriter',
    sectionSelector: '#experience',
    words: ['experience', 'experiencia', 'esperienza', 'expérience'],
    initialDelay: 1200,
  });

  // Idiomas: bored? learn [languages]
  createTitleTypewriter({
    selector: '.lang-typewriter',
    sectionSelector: '#languages',
    words: ['languages', 'idiomas', 'lingue', 'langues'],
    initialDelay: 1200,
  });
}

initAllTitleTypewriters();

/* ==========================================================================
   ANIMACIONES DE ENTRADA AL HACER SCROLL (SCROLL REVEAL OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target); // Solo se activa la primera vez que se hace scroll

        if (entry.target.id === 'languages' && window.updateLanguagesConstellation) {
          setTimeout(window.updateLanguagesConstellation, 100);
          setTimeout(window.updateLanguagesConstellation, 850);
        }
      }
    });
  }, {
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => observer.observe(el));
}

initScrollReveal();