export type ServiceId = 'brows' | 'lips' | 'liner';
export type StyleId = 'minimal' | 'soft-luxury' | 'modern-bold' | 'feminine' | 'clinical';
export type LogoMode = 'text' | 'upload';
export type LogoCase = 'asis' | 'upper';
export type TierId = 'essentials' | 'studio' | 'launch';

/** Everything the artist tells us. Nothing about their clients, ever. */
export interface KitInput {
  studio: string;
  logoMode: LogoMode;
  logoFont: string;
  logoCase: LogoCase;
  tagline: string;
  color: string;
  services: ServiceId[];
  country: string;
  state: string;
  style: StyleId;
  tier: TierId;
}

export type DocKind = 'cover' | 'legal' | 'policy' | 'business';

export interface Field {
  label: string;
  /** Relative width within its row: 1, 2 or 3. */
  w?: 1 | 2 | 3;
}

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'note'; text: string }
  | { t: 'check'; items: string[]; cols?: 1 | 2 }
  | { t: 'initials'; items: string[] }
  | { t: 'fields'; rows: Field[][] }
  | { t: 'sign'; parties: string[] }
  | { t: 'menu'; groups: { name: string; items: { name: string; note?: string; price: string }[] }[] }
  | { t: 'steps'; items: { label: string; text: string }[] }
  | { t: 'ledger'; items: { label: string; unit: string }[] }
  | { t: 'quote'; text: string }
  /** Wording held back until purchase. Only the heading is sent to the browser. */
  | { t: 'greek'; heading?: string; lines: number }
  /** Where state-required statements are inserted once a jurisdiction is verified. */
  | { t: 'slot'; text: string }
  | { t: 'cover'; contents: string[]; summary: string };

export interface KitPage {
  id: string;
  title: string;
  kind: DocKind;
  blocks: Block[];
}
