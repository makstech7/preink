import './fonts';
import './styles/app.css';
import './styles/kit.css';

import { applyKitStyle } from './kit/apply';
import { assembleKit, PLACEHOLDER_STUDIO } from './kit/assemble';
import { COLORS, COUNTRIES, EDITION, LOGO_FONTS, SERVICES, US_STATES } from './kit/catalog';
import { jurisdictionSummary } from './kit/jurisdictions';
import { renderPage } from './kit/render';
import { STYLES, styleById } from './kit/styles';
import type { KitInput, KitPage } from './kit/types';
import { html } from './lib/html';
import { LogoError, processLogoUpload } from './lib/logo';
import { LIMITS, sanitizeInput, studioNameError } from './lib/validate';

const STORE_KEY = 'preink.kit.v1';

function must<T extends Element>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

const form = must<HTMLFormElement>('#kit-form');
const rail = must<HTMLElement>('#rail');
const zoomStage = must<HTMLElement>('#zoom-stage');
const zoomDialog = must<HTMLDialogElement>('#zoom-dialog');
const buyDialog = must<HTMLDialogElement>('#buy-dialog');
const stylePicker = must<HTMLElement>('#style-picker');
const prevBtn = must<HTMLButtonElement>('#prev');
const nextBtn = must<HTMLButtonElement>('#next');

// ---------- State ----------

function loadSaved(): KitInput {
  try {
    return sanitizeInput(JSON.parse(sessionStorage.getItem(STORE_KEY) ?? 'null'));
  } catch {
    return sanitizeInput(null);
  }
}

function save(input: KitInput): void {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(input));
  } catch {
    // Private browsing or full storage: the preview still works, it just won't survive a reload.
  }
}

let input = loadSaved();
// The uploaded logo lives only in memory as a blob: URL. It is never saved or sent anywhere in the preview.
let logoUrl: string | null = null;
let pages: KitPage[] = [];
let current = 0;
let studioTouched = input.studio.length > 0;

// ---------- Form ----------

function buildForm(): void {
  form.innerHTML = html`
    <fieldset class="step">
      <legend><span class="num">01</span>Studio name</legend>
      <input class="text-input" id="studio" name="studio" type="text" maxlength="${LIMITS.studioMax}"
        value="${input.studio}" placeholder="Marlowe Brow Studio" autocapitalize="words" spellcheck="false"
        enterkeyhint="done" aria-describedby="studio-hint studio-error">
      <p class="hint" id="studio-hint">Spelled the way you want it printed.</p>
      <p class="error" id="studio-error" role="alert"></p>
    </fieldset>

    <fieldset class="step">
      <legend><span class="num">02</span>Logo</legend>
      <div class="seg">
        <label><input type="radio" name="logoMode" value="text" ${input.logoMode === 'text' ? 'checked' : ''}>Use my name</label>
        <label><input type="radio" name="logoMode" value="upload" ${input.logoMode === 'upload' ? 'checked' : ''}>Upload a logo</label>
      </div>

      <div class="panel" id="panel-text">
        <div class="fontgrid">
          ${LOGO_FONTS.map(
            (f) => html`<label class="fontopt">
              <input type="radio" name="logoFont" value="${f.id}" ${input.logoFont === f.id ? 'checked' : ''}>
              <span class="sample lf-${f.id}" data-sample></span>
              <span class="tag">${f.label}</span>
            </label>`,
          )}
        </div>
        <label class="tick"><input type="checkbox" name="logoCase" value="upper" ${input.logoCase === 'upper' ? 'checked' : ''}>Spaced capitals</label>
        <label class="label" for="tagline">Line under the name (optional)</label>
        <input class="text-input" id="tagline" name="tagline" type="text" maxlength="${LIMITS.taglineMax}" value="${input.tagline}" spellcheck="false">
      </div>

      <div class="panel" id="panel-upload" hidden>
        <label class="drop">
          <input type="file" id="logo-file" accept="image/png,image/jpeg,image/webp">
          <strong>Choose your logo file</strong>
          <span>PNG, JPG or WebP, up to 2 MB</span>
        </label>
        <div class="uploaded" id="uploaded" hidden>
          <img id="uploaded-img" alt="Your uploaded logo">
          <span>Shown on every page</span>
          <button type="button" class="link" id="logo-remove">Remove</button>
        </div>
        <p class="error" id="logo-error" role="alert"></p>
      </div>
    </fieldset>

    <fieldset class="step">
      <legend><span class="num">03</span>Brand color</legend>
      <div class="swatches">
        ${COLORS.map(
          (c) => html`<label class="swatch${c.hex ? '' : ' is-auto'}" title="${c.label}" data-hex="${c.hex ?? ''}">
            <input type="radio" name="color" value="${c.id}" aria-label="${c.label}" ${input.color === c.id ? 'checked' : ''}>
          </label>`,
        )}
      </div>
      <p class="hint" id="color-hint"></p>
    </fieldset>

    <fieldset class="step">
      <legend><span class="num">04</span>What you offer</legend>
      <div class="chips">
        ${SERVICES.map(
          (s) => html`<label class="chip"><input type="checkbox" name="services" value="${s.id}" ${input.services.includes(s.id) ? 'checked' : ''}>${s.label}</label>`,
        )}
      </div>
      <p class="error" id="services-error" role="alert"></p>
    </fieldset>

    <fieldset class="step">
      <legend><span class="num">05</span>Where you work</legend>
      <label class="label" for="country">Country</label>
      <select class="select" id="country" name="country">
        ${COUNTRIES.map((c) => html`<option value="${c.code}" ${input.country === c.code ? 'selected' : ''}>${c.name}</option>`)}
      </select>
      <div id="state-wrap">
        <label class="label" for="state">State</label>
        <select class="select" id="state" name="state">
          <option value="">Choose your state</option>
          ${US_STATES.map((s) => html`<option value="${s.code}" ${input.state === s.code ? 'selected' : ''}>${s.name}</option>`)}
        </select>
      </div>
      <p class="status" id="place-status" aria-live="polite"></p>
    </fieldset>
  `.value;

  // Swatch colours are set through the CSSOM, not style attributes, so the CSP can forbid inline styles.
  form.querySelectorAll<HTMLElement>('.swatch[data-hex]').forEach((el) => {
    if (el.dataset.hex) el.style.setProperty('--sw', el.dataset.hex);
  });

  stylePicker.innerHTML = html`${STYLES.map(
    (s) => html`<label class="style-opt" title="${s.blurb}"><input type="radio" name="style" value="${s.id}" ${input.style === s.id ? 'checked' : ''}>${s.name}</label>`,
  )}`.value;
}

function readForm(): KitInput {
  const data = new FormData(form);
  return sanitizeInput({
    studio: data.get('studio'),
    logoMode: data.get('logoMode'),
    logoFont: data.get('logoFont'),
    logoCase: data.get('logoCase') === 'upper' ? 'upper' : 'asis',
    tagline: data.get('tagline'),
    color: data.get('color'),
    services: data.getAll('services'),
    country: data.get('country'),
    state: data.get('state'),
    style: input.style,
  });
}

// ---------- Preview ----------

function pageMarkup(index: number): string {
  const page = pages[index];
  if (!page) return '';
  return renderPage(page, {
    input,
    logoUrl: input.logoMode === 'upload' ? logoUrl : null,
    pageNo: index + 1,
    pageCount: pages.length,
    watermark: true,
  }).value;
}

function renderPreview(): void {
  pages = assembleKit(input);
  current = Math.min(current, pages.length - 1);
  rail.innerHTML = pages.map((_, i) => pageMarkup(i)).join('');
  applyKitStyle(rail, input);
  updatePager();

  const count = `${pages.length - 1} documents`;
  must('#preview-sub').textContent = `${count}, ${styleById(input.style).name.toLowerCase()} style`;
  must('#buy-count').textContent = `${count} for your studio`;
}

function updateFormHints(): void {
  const name = input.studio || PLACEHOLDER_STUDIO;
  form.querySelectorAll<HTMLElement>('[data-sample]').forEach((el) => {
    el.textContent = name;
  });

  must('#studio-error').textContent = studioTouched ? (studioNameError(input.studio) ?? '') : '';
  must('#services-error').textContent = input.services.length ? '' : 'Pick at least one so your consent and aftercare forms are included.';
  must('#place-status').textContent = jurisdictionSummary(input);
  must('#color-hint').textContent = COLORS.find((c) => c.id === input.color)?.label ?? '';

  must<HTMLElement>('#panel-text').hidden = input.logoMode !== 'text';
  must<HTMLElement>('#panel-upload').hidden = input.logoMode !== 'upload';
  must<HTMLElement>('#state-wrap').hidden = input.country !== 'US';
  must<HTMLElement>('#uploaded').hidden = !logoUrl;
}

function refresh(): void {
  save(input);
  updateFormHints();
  renderPreview();
}

// ---------- Paging ----------

function pageEls(): HTMLElement[] {
  return Array.from(rail.querySelectorAll<HTMLElement>('.page'));
}

function updatePager(): void {
  const page = pages[current];
  must('#page-title').textContent = page?.title ?? '';
  must('#page-count').textContent = `${current + 1} of ${pages.length}`;
  prevBtn.disabled = current <= 0;
  nextBtn.disabled = current >= pages.length - 1;
}

function goTo(index: number): void {
  const target = pageEls()[Math.max(0, Math.min(index, pages.length - 1))];
  if (!target) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
  rail.scrollTo({ left: target.offsetLeft - rail.offsetLeft - pad, behavior: reduced ? 'auto' : 'smooth' });
}

let scrollFrame = 0;
rail.addEventListener('scroll', () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    const els = pageEls();
    const edge = rail.getBoundingClientRect().left + (parseFloat(getComputedStyle(rail).paddingLeft) || 0);
    let best = 0;
    let bestDistance = Infinity;
    els.forEach((el, i) => {
      const distance = Math.abs(el.getBoundingClientRect().left - edge);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    if (best !== current) {
      current = best;
      updatePager();
    }
  });
});

prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));
rail.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') goTo(current + 1);
  if (event.key === 'ArrowLeft') goTo(current - 1);
});

// ---------- Enlarge a page ----------

rail.addEventListener('click', (event) => {
  const page = (event.target as HTMLElement).closest<HTMLElement>('.page');
  if (!page) return;
  const index = pageEls().indexOf(page);
  if (index < 0) return;
  zoomStage.innerHTML = pageMarkup(index);
  applyKitStyle(zoomStage, input);
  zoomDialog.showModal();
});

zoomDialog.addEventListener('close', () => {
  zoomStage.innerHTML = '';
});

// ---------- Events ----------

let typingTimer = 0;
form.addEventListener('input', (event) => {
  const target = event.target as HTMLElement;
  if (target.id === 'logo-file') return;
  input = readForm();
  // Typing re-renders on a short delay; picks and ticks re-render at once.
  window.clearTimeout(typingTimer);
  if (target instanceof HTMLInputElement && target.type === 'text') {
    updateFormHints();
    typingTimer = window.setTimeout(refresh, 90);
  } else {
    refresh();
  }
});

form.addEventListener('focusout', (event) => {
  if ((event.target as HTMLElement).id === 'studio') {
    studioTouched = true;
    updateFormHints();
  }
});

form.addEventListener('submit', (event) => event.preventDefault());

stylePicker.addEventListener('change', (event) => {
  const picked = (event.target as HTMLInputElement).value;
  input = sanitizeInput({ ...input, style: picked });
  refresh();
});

form.addEventListener('change', async (event) => {
  const target = event.target as HTMLInputElement;
  if (target.id !== 'logo-file') return;
  const file = target.files?.[0];
  const errorEl = must('#logo-error');
  errorEl.textContent = '';
  if (!file) return;
  try {
    const url = await processLogoUpload(file);
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    logoUrl = url;
    must<HTMLImageElement>('#uploaded-img').src = url;
  } catch (error) {
    errorEl.textContent = error instanceof LogoError ? error.message : 'That file could not be used. Try a PNG.';
  } finally {
    target.value = '';
    refresh();
  }
});

form.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).id !== 'logo-remove') return;
  if (logoUrl) URL.revokeObjectURL(logoUrl);
  logoUrl = null;
  refresh();
});

must('#buy').addEventListener('click', () => buyDialog.showModal());

// ---------- Start ----------

must('#buy-price').textContent = `· $${EDITION.price}`;
buildForm();
refresh();
