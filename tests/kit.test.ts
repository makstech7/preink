import { describe, expect, it } from 'vitest';
import { assembleKit } from '../src/kit/assemble';
import { US_STATES } from '../src/kit/catalog';
import { jurisdictionNotice, jurisdictionStatus } from '../src/kit/jurisdictions';
import { DISCLAIMER, renderPage, type RenderContext } from '../src/kit/render';
import { STYLES } from '../src/kit/styles';
import type { KitInput } from '../src/kit/types';
import { esc, html } from '../src/lib/html';
import { sanitizeInput } from '../src/lib/validate';

function kit(overrides: Partial<KitInput> = {}): KitInput {
  return { ...sanitizeInput({ studio: 'Marlowe Brow Studio', state: 'TX' }), ...overrides };
}

function renderAll(input: KitInput, logoUrl: string | null = null): string[] {
  const pages = assembleKit(input);
  return pages.map((page, i) => {
    const ctx: RenderContext = { input, logoUrl, pageNo: i + 1, pageCount: pages.length, watermark: true };
    return renderPage(page, ctx).value;
  });
}

describe('html escaping', () => {
  it('escapes interpolated values and leaves nested markup intact', () => {
    const inner = html`<b>${'<i>'}</b>`;
    expect(html`<p title="${'"><script>'}">${inner}</p>`.value).toBe(
      '<p title="&quot;&gt;&lt;script&gt;"><b>&lt;i&gt;</b></p>',
    );
    expect(esc("a'b`c")).toBe('a&#39;b&#96;c');
  });
});

describe('assembleKit', () => {
  it('builds one consent form and one aftercare sheet per service', () => {
    const ids = assembleKit(kit({ services: ['brows', 'lips', 'liner'] })).map((p) => p.id);
    expect(ids.filter((id) => id.startsWith('consent-'))).toEqual(['consent-brows', 'consent-lips', 'consent-liner']);
    expect(ids.filter((id) => id.startsWith('aftercare-'))).toEqual(['aftercare-brows', 'aftercare-lips', 'aftercare-liner']);
  });

  it('leaves out forms for services the artist does not offer', () => {
    const ids = assembleKit(kit({ services: ['lips'] })).map((p) => p.id);
    expect(ids).toContain('consent-lips');
    expect(ids).not.toContain('consent-brows');
    expect(ids).not.toContain('aftercare-liner');
  });

  it('always includes the shared documents, cover first', () => {
    const ids = assembleKit(kit({ services: [] })).map((p) => p.id);
    expect(ids[0]).toBe('cover');
    for (const id of ['medical-history', 'photo-release', 'policies', 'price-menu',
      'pricing-calculator', 'model-call', 'first-ten-clients', 'launch-checklist']) {
      expect(ids).toContain(id);
    }
  });

  it('does not include a gift certificate', () => {
    const pages = assembleKit(kit({ services: ['brows', 'lips', 'liner'] }));
    expect(pages.map((p) => p.id)).not.toContain('gift-certificate');
    expect(JSON.stringify(pages)).not.toMatch(/gift certificate/i);
  });

  it('has unique page ids and lists every document on the cover', () => {
    const pages = assembleKit(kit({ services: ['brows', 'lips', 'liner'] }));
    expect(new Set(pages.map((p) => p.id)).size).toBe(pages.length);
    const cover = pages[0]?.blocks[0];
    expect(cover?.t === 'cover' && cover.contents).toEqual(pages.slice(1).map((p) => p.title));
  });

  it('is identical for every style: wording never depends on the look', () => {
    const base = JSON.stringify(assembleKit(kit({ style: 'minimal' })));
    for (const style of STYLES) expect(JSON.stringify(assembleKit(kit({ style: style.id })))).toBe(base);
  });
});

describe('renderPage', () => {
  it('prints the not-legal-advice line on every page', () => {
    for (const page of renderAll(kit({ services: ['brows', 'lips', 'liner'] }))) expect(page).toContain(esc(DISCLAIMER));
  });

  it('watermarks every preview page', () => {
    for (const page of renderAll(kit())) expect(page).toContain('class="wm"');
  });

  it('labels legal forms as the general version when the state is not verified', () => {
    const pages = assembleKit(kit());
    const rendered = renderAll(kit());
    pages.forEach((page, i) => {
      const hasNotice = rendered[i]?.includes('class="k-notice"');
      expect(hasNotice).toBe(page.kind === 'legal');
    });
    expect(rendered.join('')).toContain('PreInk has not verified Texas requirements');
  });

  it('never lets a studio name or tagline become markup', () => {
    const hostile = kit({ studio: '"><img src=x onerror=alert(1)>', tagline: '<script>x</script>' });
    const out = renderAll(hostile).join('');
    expect(out).not.toContain('<img src=x');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('emits no inline styles or event handlers, so the CSP can forbid them', () => {
    const out = renderAll(kit({ services: ['brows', 'lips', 'liner'] }), 'blob:http://localhost/abc').join('');
    expect(out).not.toMatch(/\sstyle=/);
    expect(out).not.toMatch(/\son[a-z]+=/);
    expect(out).not.toContain('javascript:');
  });

  it('uses the uploaded logo when there is one, otherwise the text logo', () => {
    expect(renderAll(kit(), 'blob:http://localhost/abc')[1]).toContain('<img class="k-logo-img" src="blob:http://localhost/abc"');
    expect(renderAll(kit())[1]).toContain('k-logo-text lf-cormorant');
  });

  it('holds back wording: withheld sections carry no text', () => {
    const out = renderAll(kit()).join('');
    const greek = out.match(/<div class="k-greek">.*?<\/div>/g) ?? [];
    expect(greek.length).toBeGreaterThan(10);
    for (const block of greek) expect(block.replace(/<[^>]+>/g, '')).toBe('');
  });
});

describe('jurisdictions', () => {
  it('marks nothing as verified until a person has approved it', () => {
    for (const state of US_STATES) expect(jurisdictionStatus('US', state.code)).toBe('not_covered');
  });

  it('always gives unverified places a notice telling the artist to check locally', () => {
    for (const input of [{ country: 'US', state: 'FL' }, { country: 'US', state: '' }, { country: 'CA', state: '' }, { country: 'ZZ', state: '' }]) {
      const notice = jurisdictionNotice(input);
      expect(notice).toMatch(/^General version\./);
      expect(notice).toMatch(/[Cc]onfirm/);
    }
  });
});
