import './fonts';
import './styles/app.css';
import './styles/kit.css';
import './styles/landing.css';

import { applyKitStyle } from './kit/apply';
import { assembleKit } from './kit/assemble';
import { renderPage } from './kit/render';
import { STYLES } from './kit/styles';
import type { KitInput, StyleId } from './kit/types';
import { sanitizeInput } from './lib/validate';

// The page's words are plain HTML so search engines and people without
// JavaScript get all of it. This script draws the sample pages with the same
// renderer as the real kit, and adds motion for visitors who have not asked
// their device to reduce it.

const EXAMPLE_STUDIO = 'Marlowe Brow Studio';

/** The text-logo lettering that suits each style, used when a sample cycles styles. */
const STYLE_FONT: Record<StyleId, string> = {
  minimal: 'hanken',
  'soft-luxury': 'cormorant',
  'modern-bold': 'archivo',
  feminine: 'playfair',
  clinical: 'hanken',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function sampleInput(style: string | undefined, font: string | undefined, studio = EXAMPLE_STUDIO): KitInput {
  return sanitizeInput({
    studio,
    services: ['brows', 'lips', 'liner'],
    style,
    logoFont: font,
    color: 'style',
    tagline: 'Permanent Makeup',
  });
}

function drawSample(el: HTMLElement, input: KitInput): void {
  const pages = assembleKit(input);
  const index = pages.findIndex((p) => p.id === el.dataset.doc);
  const page = pages[index];
  if (!page) return;
  el.innerHTML = renderPage(page, {
    input,
    logoUrl: null,
    pageNo: index + 1,
    pageCount: pages.length,
    watermark: false,
  }).value;
  applyKitStyle(el, input);
}

const samples = Array.from(document.querySelectorAll<HTMLElement>('[data-kit-sample]'));
for (const el of samples) drawSample(el, sampleInput(el.dataset.style, el.dataset.font));

// ---------- Motion ----------

if (!reduceMotion) {
  // Hidden starting states in CSS only apply under this class, so without
  // JavaScript (or with reduced motion) everything is visible and still.
  document.documentElement.classList.add('js-motion');

  // Sections and pictures ease in as they scroll into view.
  const revealables = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  revealables.forEach((el) => observer.observe(el));

  const live = document.querySelector<HTMLElement>('[data-live-sample]');
  if (live) startLiveSample(live);
}

/**
 * The center page of the home page fan: types the studio name onto the page,
 * then shows the same page in each of the five styles in turn.
 */
function startLiveSample(el: HTMLElement): void {
  const label = document.querySelector<HTMLElement>('[data-live-label]');
  const order = STYLES.map((s) => s.id);
  let styleIndex = Math.max(0, order.indexOf((el.dataset.style ?? '') as StyleId));
  let timer = 0;
  let visible = true;

  const setLabel = (id: StyleId) => {
    if (label) label.textContent = `${STYLES.find((s) => s.id === id)?.name ?? ''} style`;
  };

  const show = (id: StyleId, studio = EXAMPLE_STUDIO) => drawSample(el, sampleInput(id, STYLE_FONT[id], studio));

  // Type the name, one letter at a time.
  const style = order[styleIndex] ?? 'soft-luxury';
  setLabel(style);
  const letters = Array.from(EXAMPLE_STUDIO);
  let typed = 0;
  const type = () => {
    typed += 1;
    show(style, letters.slice(0, typed).join('') || ' ');
    if (typed < letters.length) timer = window.setTimeout(type, 70);
    else timer = window.setTimeout(next, 2600);
  };

  const next = () => {
    if (!visible || document.hidden) {
      timer = window.setTimeout(next, 1000);
      return;
    }
    el.classList.add('is-swapping');
    timer = window.setTimeout(() => {
      styleIndex = (styleIndex + 1) % order.length;
      const id = order[styleIndex] ?? 'soft-luxury';
      show(id);
      setLabel(id);
      // Let the new page render hidden for one frame so it fades in.
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-swapping')));
      timer = window.setTimeout(next, 2800);
    }, 260);
  };

  // Pause while the page is scrolled out of view.
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
  }).observe(el);

  window.clearTimeout(timer);
  timer = window.setTimeout(type, 700);
}
