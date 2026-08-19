import { err, ok, type ToolResult } from '../types';

/** String.fromCharCode(...chunk) için güvenli parça boyutu (stack taşmasını önler). */
const CHUNK_SIZE = 0x8000;

export interface Base64Options {
  /** RFC 4648 §5: '+/' yerine '-_', padding yok. JWT ve URL parametrelerinde kullanılır. */
  urlSafe?: boolean;
}

export function encodeBase64(input: string, { urlSafe = false }: Base64Options = {}): ToolResult<string> {
  // btoa() latin1 bekler; 0xFF üstü kod noktası verilirse InvalidCharacterError atar.
  // Bu yüzden önce UTF-8 byte'larına çevirip byte'ları latin1 string gibi besliyoruz.
  const bytes = new TextEncoder().encode(input);

  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }

  const encoded = btoa(binary);
  return ok(urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : encoded);
}

export function decodeBase64(input: string): ToolResult<string> {
  // Kopyala-yapıştır girdilerinde satır sonu ve boşluk olağan; sessizce temizliyoruz.
  const cleaned = input.replace(/\s+/g, '');
  if (cleaned === '') return ok('');

  const normalized = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    return err('Geçersiz Base64: alfabede olmayan karakter var.');
  }

  // url-safe girdide padding kırpılmış olur; atob() tam blok ister.
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return err('Geçersiz Base64: uzunluk 4’ün katı değil.');
  }

  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  try {
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return err('Base64 çözüldü ama sonuç geçerli UTF-8 metin değil (ikili veri olabilir).');
  }
}
