import { describe, expect, it } from 'vitest';
import { cleanText, DEFAULT_INPUT, LIMITS, parseServices, sanitizeInput, studioNameError } from '../src/lib/validate';

describe('cleanText', () => {
  it('trims, collapses whitespace and limits length', () => {
    expect(cleanText('  Marlowe   Brow\n\tStudio  ', 60)).toBe('Marlowe Brow Studio');
    expect(cleanText('a'.repeat(200), LIMITS.studioMax)).toHaveLength(LIMITS.studioMax);
  });

  it('removes control, zero-width and direction-override characters', () => {
    expect(cleanText('Lu​x‮e\u0000 Brows', 60)).toBe('Lu x e Brows');
  });

  it('never cuts a character in half', () => {
    const out = cleanText('💄'.repeat(10), 3);
    expect(Array.from(out)).toHaveLength(3);
    expect(out).toBe('💄💄💄');
  });

  it('returns an empty string for anything that is not text', () => {
    for (const value of [null, undefined, 42, {}, ['x']]) expect(cleanText(value, 60)).toBe('');
  });
});

describe('studioNameError', () => {
  it('accepts ordinary and accented names', () => {
    expect(studioNameError('Marlowe Brow Studio')).toBeNull();
    expect(studioNameError('Élan & Co.')).toBeNull();
  });

  it('rejects empty, too-short and symbol-only names', () => {
    expect(studioNameError('')).not.toBeNull();
    expect(studioNameError('A')).not.toBeNull();
    expect(studioNameError('***')).not.toBeNull();
  });
});

describe('parseServices', () => {
  it('keeps known services once each, in catalogue order', () => {
    expect(parseServices(['liner', 'brows', 'brows', 'teeth', 7])).toEqual(['brows', 'liner']);
  });

  it('treats a non-list as nothing selected', () => {
    expect(parseServices('brows')).toEqual([]);
  });
});

describe('sanitizeInput', () => {
  it('falls back to safe defaults for junk', () => {
    for (const junk of [null, undefined, 'x', 3, []]) expect(sanitizeInput(junk)).toEqual(DEFAULT_INPUT);
  });

  it('only lets allow-listed choices through', () => {
    const out = sanitizeInput({
      studio: '<script>alert(1)</script>',
      logoMode: 'url(javascript:1)',
      logoFont: '"; background:url(//evil)',
      logoCase: 'UPPER',
      color: '#ff0000',
      services: ['brows', '<img>'],
      country: 'XX',
      state: 'TX',
      style: '../../etc',
    });
    expect(out.logoMode).toBe('text');
    expect(out.logoFont).toBe(DEFAULT_INPUT.logoFont);
    expect(out.logoCase).toBe('asis');
    expect(out.color).toBe('style');
    expect(out.services).toEqual(['brows']);
    expect(out.country).toBe('US');
    expect(out.state).toBe('TX');
    expect(out.style).toBe(DEFAULT_INPUT.style);
    // Text is kept as text. Escaping happens when it is rendered.
    expect(out.studio).toBe('<script>alert(1)</script>');
  });

  it('drops the state when the country is not the US', () => {
    expect(sanitizeInput({ country: 'CA', state: 'TX' }).state).toBe('');
  });

  it('respects an explicitly empty tagline and service list', () => {
    const out = sanitizeInput({ tagline: '', services: [] });
    expect(out.tagline).toBe('');
    expect(out.services).toEqual([]);
  });
});
