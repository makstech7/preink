import { describe, expect, it } from 'vitest';
import { checkLogoBytes, LOGO_MAX_BYTES, LogoError, sniffImageType } from '../src/lib/logo';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
const text = (s: string) => new TextEncoder().encode(s);

describe('sniffImageType', () => {
  it('recognises PNG, JPEG and WebP by their first bytes', () => {
    expect(sniffImageType(new Uint8Array(PNG))).toBe('png');
    expect(sniffImageType(new Uint8Array(JPEG))).toBe('jpeg');
    expect(sniffImageType(new Uint8Array(WEBP))).toBe('webp');
  });

  it('rejects SVG, HTML, GIF, PDF and other RIFF files', () => {
    expect(sniffImageType(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffImageType(text('<?xml version="1.0"?><svg></svg>'))).toBeNull();
    expect(sniffImageType(text('<!doctype html><script>1</script>'))).toBeNull();
    expect(sniffImageType(text('GIF89a........'))).toBeNull();
    expect(sniffImageType(text('%PDF-1.7 ......'))).toBeNull();
    expect(sniffImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]))).toBeNull();
    expect(sniffImageType(new Uint8Array([]))).toBeNull();
  });
});

describe('checkLogoBytes', () => {
  it('goes by content, so a renamed SVG is still refused', () => {
    expect(() => checkLogoBytes(text('<svg onload="alert(1)"></svg>'))).toThrow(LogoError);
  });

  it('refuses empty and oversized files', () => {
    expect(() => checkLogoBytes(new Uint8Array(0))).toThrow(LogoError);
    const big = new Uint8Array(LOGO_MAX_BYTES + 1);
    big.set(PNG);
    expect(() => checkLogoBytes(big)).toThrow(/2 MB/);
  });

  it('accepts a real image signature within the size limit', () => {
    expect(checkLogoBytes(new Uint8Array(PNG))).toBe('png');
  });
});
