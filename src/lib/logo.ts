// Logo upload checks. A file's name and declared type are never trusted: the
// first bytes decide what it is, and the image is redrawn onto a canvas so only
// pixels survive (no metadata, no embedded scripts, no hidden second file).

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_MAX_SIDE = 6000;
const OUTPUT_MAX_SIDE = 1200;

export type ImageType = 'png' | 'jpeg' | 'webp';

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

/** Identify an image by its signature bytes. SVG and everything else is null. */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

export class LogoError extends Error {}

export function checkLogoBytes(bytes: Uint8Array): ImageType {
  if (bytes.byteLength === 0) throw new LogoError('That file is empty.');
  if (bytes.byteLength > LOGO_MAX_BYTES) throw new LogoError('That file is over 2 MB. Try a smaller export.');
  const type = sniffImageType(bytes);
  if (!type) {
    throw new LogoError('Use a PNG, JPG or WebP image. SVG and other file types are not accepted.');
  }
  return type;
}

/** Browser only. Returns a blob: URL for a cleaned PNG copy of the upload. */
export async function processLogoUpload(file: File): Promise<string> {
  if (file.size > LOGO_MAX_BYTES) throw new LogoError('That file is over 2 MB. Try a smaller export.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = checkLogoBytes(bytes);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes], { type: `image/${type}` }));
  } catch {
    throw new LogoError('That image could not be opened. Try saving it again as a PNG.');
  }

  try {
    if (bitmap.width > LOGO_MAX_SIDE || bitmap.height > LOGO_MAX_SIDE || bitmap.width < 8 || bitmap.height < 8) {
      throw new LogoError('That image is an unusual size. Use one between 8 and 6000 pixels on each side.');
    }
    const scale = Math.min(1, OUTPUT_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new LogoError('Your browser could not process that image.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new LogoError('Your browser could not process that image.');
    return URL.createObjectURL(blob);
  } finally {
    bitmap.close();
  }
}
