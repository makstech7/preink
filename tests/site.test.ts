import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TIERS } from '../src/kit/catalog';

// Checks on the two HTML pages: search-engine basics, and that nothing in them
// would be blocked by (or weaken) the Content-Security-Policy.

const home = readFileSync('index.html', 'utf8');
const kit = readFileSync('kit/index.html', 'utf8');
const headers = readFileSync('public/_headers', 'utf8');

const text = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const meta = (page: string, name: string) =>
  page.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`))?.[1] ?? '';

describe.each([
  ['home', home, 'https://getpreink.com/'],
  ['kit', kit, 'https://getpreink.com/kit/'],
])('%s page', (_name, page, canonical) => {
  it('has exactly one h1', () => {
    expect(page.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it('has a title and description of a sensible length', () => {
    const title = text(page.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').replace('&amp;', '&');
    expect(title.length).toBeGreaterThan(25);
    expect(title.length).toBeLessThanOrEqual(65);
    expect(meta(page, 'description').length).toBeGreaterThan(90);
    expect(meta(page, 'description').length).toBeLessThanOrEqual(165);
  });

  it('declares its canonical address on the live domain', () => {
    expect(page).toContain(`<link rel="canonical" href="${canonical}"`);
  });

  it('has no inline styles, inline scripts or event handlers', () => {
    expect(page).not.toMatch(/\sstyle="/);
    expect(page).not.toMatch(/<style[\s>]/);
    expect(page).not.toMatch(/\son[a-z]+="/);
    const scripts = page.match(/<script[^>]*>/g) ?? [];
    for (const tag of scripts) expect(tag).toMatch(/type="(module|application\/ld\+json)"/);
    expect(page).not.toMatch(/https?:\/\/(?!getpreink\.com|schema\.org|www\.w3\.org)/);
  });
});

describe('home page content', () => {
  it('uses the words people search for', () => {
    const body = text(home).toLowerCase();
    for (const phrase of ['consent form', 'aftercare', 'permanent makeup', 'pmu', 'price menu', 'photo and video release']) {
      expect(body).toContain(phrase);
    }
  });

  it('only states prices that exist in the tier configuration', () => {
    const allowed = TIERS.map((t) => `$${t.price}`);
    const prices = home.match(/\$\d+/g) ?? [];
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) expect(allowed).toContain(price);
  });

  it('shows each tier in the price table at its configured price', () => {
    for (const tier of TIERS) {
      const card = home.match(new RegExp(`<article class="tier[^"]*" data-tier="${tier.id}"[\\s\\S]*?</article>`))?.[0] ?? '';
      expect(card).toContain(`<h3>${tier.name}`);
      expect(card).toContain(`<span>$${tier.price}</span>`);
    }
  });

  it('has valid structured data whose questions match the visible ones', () => {
    const json = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '';
    const graph = JSON.parse(json)['@graph'] as { '@type': string; mainEntity?: { name: string; acceptedAnswer: { text: string } }[] }[];
    const faq = graph.find((node) => node['@type'] === 'FAQPage');
    const visible = [...home.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({
      q: text(m[1] ?? ''),
      a: text(m[2] ?? ''),
    }));
    expect(visible.length).toBeGreaterThanOrEqual(5);
    expect(faq?.mainEntity?.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }))).toEqual(visible);
  });

  it('never promises legal cover or that every state is included', () => {
    const body = text(home).toLowerCase();
    expect(body).toContain('not legal advice');
    for (const claim of ['legally compliant', 'guaranteed', 'all 50 states', 'lawyer-approved', 'lawyer approved', 'attorney-approved', 'protects you', 'win the dispute', 'win disputes']) {
      expect(body).not.toContain(claim);
    }
  });

  it('does not mention a gift certificate', () => {
    expect(text(home).toLowerCase()).not.toContain('gift certificate');
  });
});

describe('search and staging rules', () => {
  it('points crawlers at the sitemap, which lists both pages', () => {
    expect(readFileSync('public/robots.txt', 'utf8')).toContain('Sitemap: https://getpreink.com/sitemap.xml');
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');
    expect(sitemap).toContain('<loc>https://getpreink.com/</loc>');
    expect(sitemap).toContain('<loc>https://getpreink.com/kit/</loc>');
  });

  it('keeps the staging site out of search results', () => {
    expect(headers).toMatch(/https:\/\/preink\.dev\/\*\n\s+X-Robots-Tag: noindex/);
  });

  it('keeps the strict policy: no inline or third-party script or style', () => {
    const csp = headers.match(/Content-Security-Policy: (.*)/)?.[1] ?? '';
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self';");
    expect(csp).toContain("style-src 'self';");
    expect(csp).not.toContain('unsafe');
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe.each(['privacy', 'terms', 'refunds'])('%s page', (slug) => {
  const page = readFileSync(`${slug}/index.html`, 'utf8');

  it('is linked from the footer of every page, as a real link', () => {
    for (const other of [home, kit, page]) expect(other).toContain(`<a href="/${slug}/">`);
  });

  it('has one h1, a description and its own canonical address', () => {
    expect(page.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(meta(page, 'description').length).toBeGreaterThan(60);
    expect(page).toContain(`<link rel="canonical" href="https://getpreink.com/${slug}/"`);
  });

  it('is marked as a draft and kept out of search until a lawyer has reviewed it', () => {
    expect(page).toContain('data-draft');
    expect(meta(page, 'robots')).toBe('noindex');
    expect(readFileSync('public/sitemap.xml', 'utf8')).not.toContain(`/${slug}/`);
  });

  it('has no inline styles, inline scripts or event handlers', () => {
    expect(page).not.toMatch(/\sstyle="/);
    expect(page).not.toMatch(/\son[a-z]+="/);
    for (const tag of page.match(/<script[^>]*>/g) ?? []) expect(tag).toContain('type="module"');
  });
});

describe('legal page promises', () => {
  const privacy = text(readFileSync('privacy/index.html', 'utf8'));
  const refunds = text(readFileSync('refunds/index.html', 'utf8'));
  const terms = text(readFileSync('terms/index.html', 'utf8'));

  it('says client data is never collected and files are deleted after 30 days', () => {
    expect(privacy).toContain('does not collect, see or store anything about your clients');
    expect(privacy).toContain('deleted automatically 30 days');
  });

  it('says a refund switches off the download link', () => {
    expect(refunds).toContain('download link is switched off');
  });

  it('says the kit is a template and not legal advice', () => {
    expect(terms).toMatch(/not a law firm/);
    expect(terms).toMatch(/legal, medical or professional advice/);
  });
});

describe('share image', () => {
  it('is a 1200 by 630 JPEG served from the live domain', () => {
    const bytes = readFileSync('public/og.jpg');
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xff, 0xd8, 0xff]);
    expect(bytes.byteLength).toBeLessThan(300 * 1024);
    expect(home).toContain('<meta property="og:image" content="https://getpreink.com/og.jpg"');
    expect(home).toContain('<meta property="og:image:width" content="1200"');
    expect(home).toContain('<meta property="og:image:height" content="630"');
    expect(home).toContain('content="summary_large_image"');
  });
});

describe('microblading consent form page', () => {
  const page = readFileSync('microblading-consent-form/index.html', 'utf8');
  const body = text(page).toLowerCase();

  it('has one h1, a good title and description, and its canonical address', () => {
    expect(page.match(/<h1[\s>]/g)).toHaveLength(1);
    const title = text(page.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
    expect(title.toLowerCase()).toContain('microblading consent form');
    expect(title.length).toBeLessThanOrEqual(65);
    expect(meta(page, 'description').length).toBeGreaterThan(90);
    expect(meta(page, 'description').length).toBeLessThanOrEqual(165);
    expect(page).toContain('<link rel="canonical" href="https://getpreink.com/microblading-consent-form/"');
  });

  it('covers the phrases in its keyword group', () => {
    for (const phrase of ['microblading consent form', 'powder', 'ombre', 'combo brows', 'health history', 'photo and video release']) {
      expect(body).toContain(phrase);
    }
  });

  it('links to the kit builder and is linked from every other page', () => {
    expect(page).toContain('href="/kit/"');
    for (const other of [home, kit, readFileSync('privacy/index.html', 'utf8')]) {
      expect(other).toContain('href="/microblading-consent-form/"');
    }
  });

  it('has structured data whose questions match the visible ones', () => {
    const json = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '';
    const graph = JSON.parse(json)['@graph'] as { '@type': string; mainEntity?: { name: string; acceptedAnswer: { text: string } }[] }[];
    const faq = graph.find((node) => node['@type'] === 'FAQPage');
    const visible = [...page.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({
      q: text(m[1] ?? '').replace(/&rsquo;|’/g, '’'),
      a: text(m[2] ?? ''),
    }));
    expect(visible.length).toBeGreaterThanOrEqual(4);
    expect(faq?.mainEntity?.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }))).toEqual(visible);
    expect(graph.some((node) => node['@type'] === 'BreadcrumbList')).toBe(true);
  });

  it('makes no compliance promises and states no specific state rule', () => {
    expect(body).toContain('not legal advice');
    for (const claim of ['legally compliant', 'guaranteed', 'all 50 states', 'lawyer-approved', 'attorney-approved', 'meets all']) {
      expect(body).not.toContain(claim);
    }
    // A specific age or retention period would be a rule stated from memory.
    expect(body).not.toMatch(/\b(1[68]|21) years\b|\b\d+ years?\b/);
  });

  it('has no inline styles, inline scripts or event handlers', () => {
    expect(page).not.toMatch(/\sstyle="/);
    expect(page).not.toMatch(/\son[a-z]+="/);
    for (const tag of page.match(/<script[^>]*>/g) ?? []) expect(tag).toMatch(/type="(module|application\/ld\+json)"/);
  });
});

describe('every page is built and listed', () => {
  const config = readFileSync('vite.config.ts', 'utf8');
  const sitemap = readFileSync('public/sitemap.xml', 'utf8');

  it('builds every page in the sitemap', () => {
    const urls = [...sitemap.matchAll(/<loc>https:\/\/getpreink\.com\/([^<]*)<\/loc>/g)].map((m) => m[1] ?? '');
    for (const path of urls) expect(config).toContain(`'${path}index.html'`);
  });
});

describe('photos and motion', () => {
  const css = readFileSync('src/styles/landing.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    // Keyframes only run under .js-motion selectors, so leave them out of the check.
    .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '');
  const pages = { home, guide: readFileSync('microblading-consent-form/index.html', 'utf8') };

  it('every photo has a size, a description, lazy loading and both file sizes on disk', () => {
    let count = 0;
    for (const page of Object.values(pages)) {
      for (const tag of page.match(/<img [^>]*>/g) ?? []) {
        count += 1;
        expect(tag).toMatch(/\swidth="\d+"/);
        expect(tag).toMatch(/\sheight="\d+"/);
        expect(tag).toMatch(/\salt="[^"]{20,}"/);
        expect(tag).toContain('loading="lazy"');
        for (const [, src] of tag.matchAll(/(\/photos\/[a-z-]+-\d+\.jpg)/g)) {
          const bytes = readFileSync(`public${src}`);
          expect(bytes.byteLength).toBeLessThan(160 * 1024);
        }
      }
    }
    expect(count).toBe(4);
  });

  it('only hides content for animation when the script has switched motion on', () => {
    const hiding = css.match(/[^{}]*\{[^}]*opacity:\s*0[;\s][^}]*\}/g) ?? [];
    for (const rule of hiding) {
      const selector = rule.slice(0, rule.indexOf('{')).trim();
      if (/(^|\s)from$/.test(selector) || selector.includes('is-swapping')) continue;
      expect(selector).toContain('.js-motion');
    }
  });
});

describe('caching', () => {
  it('caches hashed build files for a year and photos for a day', () => {
    expect(headers).toMatch(/\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
    expect(headers).toMatch(/\/photos\/\*\n\s+Cache-Control: public, max-age=86400/);
  });
});
