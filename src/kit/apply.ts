import { COLORS } from './catalog';
import { styleById } from './styles';
import type { KitInput } from './types';

/**
 * Put a style's tokens and layout switches on the element that wraps kit pages.
 * Uses the CSSOM rather than style attributes so the CSP can forbid inline styles.
 */
export function applyKitStyle(target: HTMLElement, input: Pick<KitInput, 'style' | 'color'>): void {
  const style = styleById(input.style);
  for (const [name, value] of Object.entries(style.tokens)) target.style.setProperty(name, value);
  const brand = COLORS.find((c) => c.id === input.color)?.hex;
  if (brand) target.style.setProperty('--k-accent', brand);
  target.dataset.header = style.layout.header;
  target.dataset.frame = style.layout.frame;
  target.dataset.field = style.layout.field;
  target.dataset.title = style.layout.title;
}
