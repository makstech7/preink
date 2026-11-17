import { describe, expect, it } from 'vitest';
import { assembleKit } from '../src/kit/assemble';
import { TIERS, US_STATES } from '../src/kit/catalog';
import { jurisdictionNotice, jurisdictionStatus } from '../src/kit/jurisdictions';
import { DISCLAIMER, renderPage, type RenderContext } from '../src/kit/render';
import { STYLES } from '../src/kit/styles';
import type { KitInput } from '../src/kit/types';
import { esc, html } from '../src/lib/html';
import { sanitizeInput } from '../src/lib/validate';

// The full kit unless a test picks a smaller tier.
function kit(overrides: Partial<KitInput> = {}): KitInput {
  return { ...sanitizeInput({ studio: 'Marlowe Brow Studio', state: 'TX', tier: 'launch' }), ...overrides };
}

describe('tiers', () => {
  const ids = (tier: KitInput['tier']) => assembleKit(kit({ tier, services: ['brows', 'lips'] })).map((p) => p.id);
  const safety = ['consent-brows', 'consent-lips', 'medical-history', 'precare-brows', 'precare-lips', 'aftercare-brows', 'aftercare-lips', 'photo-release'];

  it('puts the client safety forms in every tier', () => {
    for (const tier of TIERS) for (const id of safety) expect(ids(tier.id)).toContain(id);
  });

  it('adds policies and pricing from Studio, and the launch plan only in Launch', () => {
    expect(ids('essentials')).not.toContain('policies');
    expect(ids('essentials')).not.toContain('price-menu');
    expect(ids('studio')).toEqual(expect.arrayContaining(['policies', 'price-menu', 'pricing-calculator']));
    expect(ids('studio')).not.toContain('launch-checklist');
    expect(ids('launch')).toEqual(expect.arrayContaining(['model-call', 'first-ten-clients', 'launch-checklist']));
  });

  it('each tier contains everything in the cheaper ones and costs more', () => {
    for (let i = 1; i < TIERS.length; i++) {
      const [lower, higher] = [TIERS[i - 1]!, TIERS[i]!];
      expect(ids(higher.id)).toEqual(expect.arrayContaining(ids(lower.id)));
      expect(higher.price).toBeGreaterThan(lower.price);
    }
  });

  it('gives each service its own pre-care sheet, placed before its aftercare card', () => {
    const pages = assembleKit(kit({ tier: 'essentials', services: ['brows', 'lips', 'liner'] }));
    const order = pages.map((p) => p.id);
    for (const s of ['brows', 'lips', 'liner']) {
      expect(order.indexOf(`precare-${s}`)).toBeGreaterThan(-1);
      expect(order.indexOf(`precare-${s}`)).toBeLessThan(order.indexOf(`aftercare-${s}`));
    }
    const lips = JSON.stringify(pages.find((p) => p.id === 'precare-lips'));
    expect(lips).toContain('cold sores');
  });

  it('uses booking-fee wording with a signed acknowledgment, plus a guide for the artist', () => {
    const pages = assembleKit(kit({ tier: 'studio' }));
    const policy = pages.find((p) => p.id === 'policies');
    const text = JSON.stringify(policy);
    expect(text).toContain('non-refundable booking fee');
    expect(text).not.toMatch(/\bdeposit\b/i);
    expect(policy?.blocks.some((b) => b.t === 'initials')).toBe(true);
    expect(policy?.blocks.at(-1)?.t).toBe('sign');
    const guide = JSON.stringify(pages.find((p) => p.id === 'policy-guide'));
    expect(guide).toContain('not a guarantee');
    expect(guide).not.toMatch(/you will win|guaranteed/i);
    expect(assembleKit(kit({ tier: 'essentials' })).map((p) => p.id)).not.toContain('policy-guide');
  });

  it('falls back to Studio for an unknown tier', () => {
    expect(sanitizeInput({ tier: 'free' }).tier).toBe('studio');
  });
});

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

describe('style colors', () => {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
  };

  it.each(STYLES.map((s) => [s.name, s.tokens] as const))('%s keeps small grey text readable (4.5:1)', (_name, tokens) => {
    expect(contrast(tokens['--k-muted'] as string, tokens['--k-paper'] as string)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens['--k-ink'] as string, tokens['--k-paper'] as string)).toBeGreaterThanOrEqual(4.5);
  });
});
