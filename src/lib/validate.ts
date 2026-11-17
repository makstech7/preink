import { COLORS, COUNTRIES, DEFAULT_TIER, LOGO_FONTS, SERVICES, TIERS, US_STATES } from '../kit/catalog';
import { STYLES } from '../kit/styles';
import type { KitInput, LogoCase, LogoMode, ServiceId, StyleId, TierId } from '../kit/types';

// This module is the single gate for anything a visitor types or picks. It has
// no browser dependencies so the server can run the same checks in Phase 2.

export const LIMITS = { studioMin: 2, studioMax: 60, taglineMax: 40 } as const;

export const DEFAULT_INPUT: KitInput = {
  studio: '',
  logoMode: 'text',
  logoFont: 'cormorant',
  logoCase: 'asis',
  tagline: 'Permanent Makeup',
  color: 'style',
  services: ['brows'],
  country: 'US',
  state: '',
  style: 'soft-luxury',
  tier: DEFAULT_TIER,
};

// Control characters, invisible formatting characters (zero-width, soft hyphen,
// byte-order mark, bidirectional overrides) and line or paragraph separators.
// Bidirectional overrides can make printed text read differently from what was typed.
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

/** Plain single-line text: normalised, invisible characters removed, length-limited. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.normalize('NFC').replace(INVISIBLE, ' ').replace(/\s+/g, ' ').trim();
  // Count by code point so an emoji or accented letter is never cut in half.
  return Array.from(cleaned).slice(0, max).join('').trim();
}

export function studioNameError(name: string): string | null {
  if (!name) return 'Add your studio name to see it on every page.';
  if (Array.from(name).length < LIMITS.studioMin) return 'That looks too short for a studio name.';
  if (!/[\p{L}\p{N}]/u.test(name)) return 'A studio name needs at least one letter or number.';
  return null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parseServices(value: unknown): ServiceId[] {
  const picked = new Set(Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);
  // Rebuild from the catalogue so order is fixed and unknown values are dropped.
  return SERVICES.filter((s) => picked.has(s.id)).map((s) => s.id);
}

/**
 * Turn anything (form data, saved state, a tampered request) into a KitInput
 * made only of allow-listed choices and cleaned text.
 */
export function sanitizeInput(raw: unknown): KitInput {
  const src: Record<string, unknown> = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const country = oneOf(src.country, COUNTRIES.map((c) => c.code), DEFAULT_INPUT.country);
  const state = country === 'US' ? oneOf(src.state, US_STATES.map((s) => s.code), '') : '';

  return {
    studio: cleanText(src.studio, LIMITS.studioMax),
    logoMode: oneOf<LogoMode>(src.logoMode, ['text', 'upload'], DEFAULT_INPUT.logoMode),
    logoFont: oneOf(src.logoFont, LOGO_FONTS.map((f) => f.id), DEFAULT_INPUT.logoFont),
    logoCase: oneOf<LogoCase>(src.logoCase, ['asis', 'upper'], DEFAULT_INPUT.logoCase),
    tagline: typeof src.tagline === 'string' ? cleanText(src.tagline, LIMITS.taglineMax) : DEFAULT_INPUT.tagline,
    color: oneOf(src.color, COLORS.map((c) => c.id), DEFAULT_INPUT.color),
    services: 'services' in src ? parseServices(src.services) : [...DEFAULT_INPUT.services],
    country,
    state,
    style: oneOf<StyleId>(src.style, STYLES.map((s) => s.id), DEFAULT_INPUT.style),
    tier: oneOf<TierId>(src.tier, TIERS.map((t) => t.id), DEFAULT_INPUT.tier),
  };
}
