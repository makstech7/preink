import type { StyleId } from './types';

/**
 * A visual style is data: a handful of layout switches and a set of design
 * tokens. The wording of every document is identical across styles. Adding a
 * sixth style means adding one entry here.
 */
export interface KitStyle {
  id: StyleId;
  name: string;
  blurb: string;
  layout: {
    header: 'left' | 'center' | 'band' | 'ledger';
    frame: 'none' | 'double' | 'arch';
    field: 'line' | 'box';
    title: 'plain' | 'rule' | 'block' | 'italic' | 'tag';
  };
  tokens: Record<`--k-${string}`, string>;
}

const SANS = "'Hanken Grotesk', system-ui, sans-serif";

export const STYLES: readonly KitStyle[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    blurb: 'Quiet, lots of white',
    layout: { header: 'left', frame: 'none', field: 'line', title: 'plain' },
    tokens: {
      '--k-font-head': SANS,
      '--k-font-body': SANS,
      '--k-font-label': SANS,
      '--k-ink': '#161616',
      '--k-muted': '#6B6B6B',
      '--k-paper': '#FFFFFF',
      '--k-accent': '#161616',
      '--k-rule': '#D8D8D8',
      '--k-head-weight': '500',
      '--k-head-style': 'normal',
      '--k-head-case': 'none',
      '--k-head-track': '-0.01em',
      '--k-label-case': 'uppercase',
      '--k-label-track': '0.12em',
      '--k-radius': '0',
    },
  },
  {
    id: 'soft-luxury',
    name: 'Soft luxury',
    blurb: 'Cream paper, fine serif',
    layout: { header: 'center', frame: 'double', field: 'line', title: 'rule' },
    tokens: {
      '--k-font-head': "'Cormorant Garamond', Georgia, serif",
      '--k-font-body': "'Jost', system-ui, sans-serif",
      '--k-font-label': "'Jost', system-ui, sans-serif",
      '--k-ink': '#2B2420',
      '--k-muted': '#7A6C61',
      '--k-paper': '#FBF8F3',
      '--k-accent': '#8C6D43',
      '--k-rule': '#DCCFBD',
      '--k-head-weight': '500',
      '--k-head-style': 'normal',
      '--k-head-case': 'uppercase',
      '--k-head-track': '0.14em',
      '--k-label-case': 'uppercase',
      '--k-label-track': '0.16em',
      '--k-radius': '0',
    },
  },
  {
    id: 'modern-bold',
    name: 'Modern bold',
    blurb: 'Heavy type, strong color',
    layout: { header: 'band', frame: 'none', field: 'box', title: 'block' },
    tokens: {
      '--k-font-head': "'Archivo', system-ui, sans-serif",
      '--k-font-body': "'Archivo', system-ui, sans-serif",
      '--k-font-label': "'Archivo', system-ui, sans-serif",
      '--k-ink': '#111111',
      '--k-muted': '#5C5C5C',
      '--k-paper': '#FFFFFF',
      '--k-accent': '#B4472A',
      '--k-rule': '#111111',
      '--k-head-weight': '800',
      '--k-head-style': 'normal',
      '--k-head-case': 'uppercase',
      '--k-head-track': '-0.02em',
      '--k-label-case': 'uppercase',
      '--k-label-track': '0.06em',
      '--k-radius': '0',
    },
  },
  {
    id: 'feminine',
    name: 'Feminine',
    blurb: 'Blush tones, italic serif',
    layout: { header: 'center', frame: 'arch', field: 'line', title: 'italic' },
    tokens: {
      '--k-font-head': "'Playfair Display', Georgia, serif",
      '--k-font-body': "'Karla', system-ui, sans-serif",
      '--k-font-label': "'Karla', system-ui, sans-serif",
      '--k-ink': '#3A2A2E',
      '--k-muted': '#7E676D',
      '--k-paper': '#FFFBFA',
      '--k-accent': '#A8566B',
      '--k-rule': '#EBD3D8',
      '--k-head-weight': '400',
      '--k-head-style': 'italic',
      '--k-head-case': 'none',
      '--k-head-track': '0',
      '--k-label-case': 'none',
      '--k-label-track': '0.02em',
      '--k-radius': '0.5em',
    },
  },
  {
    id: 'clinical',
    name: 'Clinical',
    blurb: 'Structured, medical-office feel',
    layout: { header: 'ledger', frame: 'none', field: 'box', title: 'tag' },
    tokens: {
      '--k-font-head': "'IBM Plex Sans', system-ui, sans-serif",
      '--k-font-body': "'IBM Plex Sans', system-ui, sans-serif",
      '--k-font-label': "'IBM Plex Mono', ui-monospace, monospace",
      '--k-ink': '#14262B',
      '--k-muted': '#5B6E73',
      '--k-paper': '#FFFFFF',
      '--k-accent': '#2A6670',
      '--k-rule': '#C5D3D6',
      '--k-head-weight': '600',
      '--k-head-style': 'normal',
      '--k-head-case': 'none',
      '--k-head-track': '-0.005em',
      '--k-label-case': 'uppercase',
      '--k-label-track': '0.06em',
      '--k-radius': '0.2em',
    },
  },
];

export function styleById(id: StyleId): KitStyle {
  return STYLES.find((s) => s.id === id) ?? (STYLES[0] as KitStyle);
}
