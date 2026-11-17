import type { ServiceId } from './types';

/**
 * The edition is configuration, not code. A tattoo edition later is a second
 * entry here with its own services and vocabulary.
 */
export const EDITION = {
  id: 'pmu',
  name: 'PMU edition',
  templateVersion: '0.1 draft',
  price: 47,
} as const;

export interface Service {
  id: ServiceId;
  label: string;
  /** Used in document titles: "Brow Procedure Consent". */
  title: string;
  /** Used mid-sentence: "your brows". */
  area: string;
}

export const SERVICES: readonly Service[] = [
  { id: 'brows', label: 'Brows', title: 'Brow', area: 'brows' },
  { id: 'lips', label: 'Lips', title: 'Lip', area: 'lips' },
  { id: 'liner', label: 'Eyeliner', title: 'Eyeliner', area: 'eyeliner' },
];

export interface LogoFont {
  id: string;
  label: string;
}

export const LOGO_FONTS: readonly LogoFont[] = [
  { id: 'cormorant', label: 'Classic' },
  { id: 'playfair', label: 'Editorial' },
  { id: 'italiana', label: 'Fine' },
  { id: 'parisienne', label: 'Script' },
  { id: 'hanken', label: 'Clean' },
  { id: 'archivo', label: 'Bold' },
];

export interface BrandColor {
  id: string;
  label: string;
  /** null means "use whatever the chosen style uses". */
  hex: string | null;
}

// Every swatch is dark enough to carry white text and to print legibly.
export const COLORS: readonly BrandColor[] = [
  { id: 'style', label: 'Match the style', hex: null },
  { id: 'ink', label: 'Ink', hex: '#1E1A18' },
  { id: 'cocoa', label: 'Cocoa', hex: '#5A3E36' },
  { id: 'clay', label: 'Clay rose', hex: '#A2574A' },
  { id: 'mulberry', label: 'Mulberry', hex: '#7A3B52' },
  { id: 'olive', label: 'Olive', hex: '#5C6148' },
  { id: 'teal', label: 'Deep teal', hex: '#2F5D62' },
  { id: 'navy', label: 'Dusk navy', hex: '#33415C' },
];

export const COUNTRIES: readonly { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'ZZ', name: 'Somewhere else' },
];

export const US_STATES: readonly { code: string; name: string }[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([code, name]) => ({ code: code as string, name: name as string }));

export function serviceById(id: ServiceId): Service {
  const found = SERVICES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown service: ${id}`);
  return found;
}
