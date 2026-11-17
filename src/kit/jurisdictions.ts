import { COUNTRIES, US_STATES } from './catalog';
import type { KitInput } from './types';

export type JurisdictionStatus = 'verified' | 'needs_review' | 'not_covered';

/**
 * Which places get state-specific forms. In Phase 3 this moves to the rules
 * table in the database. A jurisdiction is listed as 'verified' only after a
 * person has approved the researched rules, so this starts empty on purpose.
 */
const STATUS: Readonly<Record<string, JurisdictionStatus>> = {};

export function jurisdictionKey(country: string, state: string): string {
  return country === 'US' && state ? `US-${state}` : country;
}

export function jurisdictionStatus(country: string, state: string): JurisdictionStatus {
  return STATUS[jurisdictionKey(country, state)] ?? 'not_covered';
}

export function placeName(country: string, state: string): string {
  if (country === 'US') {
    return US_STATES.find((s) => s.code === state)?.name ?? '';
  }
  return COUNTRIES.find((c) => c.code === country && c.code !== 'ZZ')?.name ?? '';
}

/** The notice printed on legal forms. Null only when the jurisdiction is verified. */
export function jurisdictionNotice(input: Pick<KitInput, 'country' | 'state'>): string | null {
  if (jurisdictionStatus(input.country, input.state) === 'verified') return null;
  const place = placeName(input.country, input.state);

  if (input.country !== 'US') {
    const where = place ? `PreInk does not cover ${place} yet.` : 'PreInk does not cover your country yet.';
    return `General version. ${where} Confirm your national and local requirements before you use this form.`;
  }
  if (!place) {
    return 'General version. Confirm what your state, county or city requires before you use this form.';
  }
  return `General version. PreInk has not verified ${place} requirements for this form yet. Confirm what your state, county or city requires before you use it.`;
}

/** The shorter line shown under the state picker in the app. */
export function jurisdictionSummary(input: Pick<KitInput, 'country' | 'state'>): string {
  const place = placeName(input.country, input.state);
  if (jurisdictionStatus(input.country, input.state) === 'verified') {
    return `${place} forms include the state-specific statements found in official sources.`;
  }
  if (input.country !== 'US') {
    return 'Outside the US you get the general version. It tells you what to confirm locally.';
  }
  if (!place) return 'Pick your state so the kit can tell you what to confirm locally.';
  return `${place} gets the general version for now. State-specific forms switch on once its rules have been verified.`;
}
