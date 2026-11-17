// Every value interpolated into markup goes through here. Strings are escaped
// unless they were produced by this module, so user input can never become HTML.

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"'`]/g, (ch) => ENTITIES[ch] ?? ch);
}

/** Markup that has already been escaped. Only `html` creates these. */
export class Safe {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

function part(value: unknown): string {
  if (value instanceof Safe) return value.value;
  if (Array.isArray(value)) return value.map(part).join('');
  if (value === null || value === undefined || value === false || value === true) return '';
  return esc(value);
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Safe {
  let out = strings[0] ?? '';
  values.forEach((value, i) => {
    out += part(value) + (strings[i + 1] ?? '');
  });
  return new Safe(out);
}

export function join(parts: Safe[]): Safe {
  return new Safe(parts.map((p) => p.value).join(''));
}
