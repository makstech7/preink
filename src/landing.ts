import './fonts';
import './styles/app.css';
import './styles/kit.css';
import './styles/landing.css';

import { applyKitStyle } from './kit/apply';
import { assembleKit } from './kit/assemble';
import { renderPage } from './kit/render';
import { sanitizeInput } from './lib/validate';

// The landing page's words are plain HTML so search engines and people without
// JavaScript get all of it. This script only draws the sample pages, using the
// same renderer as the real kit so the pictures can never drift from the product.

const EXAMPLE_STUDIO = 'Marlowe Brow Studio';

document.querySelectorAll<HTMLElement>('[data-kit-sample]').forEach((el) => {
  const input = sanitizeInput({
    studio: EXAMPLE_STUDIO,
    services: ['brows', 'lips', 'liner'],
    style: el.dataset.style,
    logoFont: el.dataset.font,
    color: el.dataset.color ?? 'style',
  });
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
});
