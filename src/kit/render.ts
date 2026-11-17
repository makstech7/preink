import { html, join, Safe } from '../lib/html';
import { PLACEHOLDER_STUDIO } from './assemble';
import { EDITION } from './catalog';
import { jurisdictionNotice } from './jurisdictions';
import type { Block, KitInput, KitPage } from './types';

// Builds page markup as strings so the same code can run in the browser for
// the preview and on the server for the final PDFs. No inline styles are
// emitted: the site's Content-Security-Policy forbids them.

export const DISCLAIMER = 'Template only, not legal advice. Confirm your state and local requirements.';

export interface RenderContext {
  input: KitInput;
  /** blob: URL of the artist's cleaned logo, or null to use the text logo. */
  logoUrl: string | null;
  pageNo: number;
  pageCount: number;
  watermark: boolean;
}

const GREEK_WIDTHS = ['g1', 'g2', 'g3', 'g4', 'g2'];

function greekLines(count: number): Safe[] {
  return Array.from({ length: count }, (_, i) =>
    html`<i class="${i === count - 1 ? 'g5' : GREEK_WIDTHS[i % GREEK_WIDTHS.length]}"></i>`,
  );
}

export function renderLogo(ctx: RenderContext): Safe {
  const name = ctx.input.studio || PLACEHOLDER_STUDIO;
  if (ctx.logoUrl) {
    return html`<img class="k-logo-img" src="${ctx.logoUrl}" alt="${name} logo">`;
  }
  const length = Array.from(name).length;
  const size = length > 34 ? ' is-xlong' : length > 20 ? ' is-long' : '';
  const upper = ctx.input.logoCase === 'upper' ? ' is-upper' : '';
  return html`<div class="k-logo-text lf-${ctx.input.logoFont}${size}${upper}"><span class="k-logo-name">${name}</span>${
    ctx.input.tagline ? html`<span class="k-logo-tag">${ctx.input.tagline}</span>` : ''
  }</div>`;
}

function renderBlock(block: Block, ctx: RenderContext): Safe {
  switch (block.t) {
    case 'p':
      return html`<p class="k-p">${block.text}</p>`;
    case 'h':
      return html`<h3 class="k-h">${block.text}</h3>`;
    case 'note':
      return html`<p class="k-note">${block.text}</p>`;
    case 'check':
      return html`<ul class="k-check${block.cols === 1 ? ' one' : ''}">${block.items.map((i) => html`<li>${i}</li>`)}</ul>`;
    case 'initials':
      return html`<ul class="k-init">${block.items.map((i) => html`<li>${i}</li>`)}</ul>`;
    case 'fields':
      return html`<div class="k-fields">${block.rows.map(
        (row) => html`<div class="k-row">${row.map((f) => html`<div class="k-field w${f.w ?? 1}"><span>${f.label}</span></div>`)}</div>`,
      )}</div>`;
    case 'sign':
      return html`<div class="k-sign">${block.parties.map(
        (p) => html`<div class="k-sign-row"><span class="sig">${p}</span><span class="date">Date</span></div>`,
      )}</div>`;
    case 'menu':
      return html`<div class="k-menu">${block.groups.map(
        (g) => html`<section><h3 class="k-h">${g.name}</h3><ul>${g.items.map(
          (item) => html`<li><span class="name">${item.name}${item.note ? html` <small>${item.note}</small>` : ''}</span><span class="lead"></span><span class="price">${item.price}</span></li>`,
        )}</ul></section>`,
      )}</div>`;
    case 'steps':
      return html`<dl class="k-steps">${block.items.map((s) => html`<div><dt>${s.label}</dt><dd>${s.text}</dd></div>`)}</dl>`;
    case 'ledger':
      return html`<ul class="k-ledger">${block.items.map((i) => html`<li><span>${i.label}</span><b>${i.unit}</b></li>`)}</ul>`;
    case 'quote':
      return html`<blockquote class="k-quote">${block.text}</blockquote>`;
    case 'greek':
      return html`<section class="k-sec">${block.heading ? html`<h3 class="k-h">${block.heading}</h3>` : ''}<div class="k-greek">${greekLines(block.lines)}</div></section>`;
    case 'slot':
      return html`<p class="k-slot">${block.text}</p>`;
    case 'cover':
      return html`<div class="k-cover">${renderLogo(ctx)}<p class="k-cover-title">Studio Launch Kit</p><p class="k-cover-sum">${block.summary}</p><ol class="k-cover-list">${block.contents.map((c) => html`<li>${c}</li>`)}</ol></div>`;
  }
}

function watermark(): Safe {
  return html`<div class="wm" aria-hidden="true">${Array.from({ length: 15 }, () => html`<span>Preview</span>`)}</div>`;
}

export function renderPage(page: KitPage, ctx: RenderContext): Safe {
  const studio = ctx.input.studio || PLACEHOLDER_STUDIO;
  const notice = page.kind === 'legal' ? jurisdictionNotice(ctx.input) : null;
  const withheld = page.blocks.some((b) => b.t === 'greek');
  const number = String(ctx.pageNo).padStart(2, '0');

  const head =
    page.kind === 'cover'
      ? ''
      : html`<header class="k-head"><div class="k-logo">${renderLogo(ctx)}</div><dl class="k-meta"><div><dt>Doc</dt><dd>${number} / ${ctx.pageCount}</dd></div><div><dt>Version</dt><dd>${EDITION.templateVersion}</dd></div></dl><div class="k-title"><span class="k-kicker">${studio}</span><h2 class="k-doc">${page.title}</h2></div></header>`;

  return html`<article class="page is-${page.kind}" data-doc="${page.id}" aria-label="${page.title}, page ${ctx.pageNo} of ${ctx.pageCount}"><div class="sheet">${head}${
    notice ? html`<p class="k-notice">${notice}</p>` : ''
  }<div class="k-body">${join(page.blocks.map((b) => renderBlock(b, ctx)))}</div><footer class="k-foot"><span>${studio}</span>${
    withheld ? html`<span class="k-withheld">Full wording comes with your kit</span>` : ''
  }<span>${DISCLAIMER}</span></footer></div>${ctx.watermark ? watermark() : ''}</article>`;
}
