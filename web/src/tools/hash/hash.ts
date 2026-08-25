import { hmacMd5, md5 } from './md5';

export type HashAlgorithm = 'CRC32' | 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
export type HashEncoding = 'hex' | 'HEX' | 'base64';

/** Listeleme sırası: zayıftan güçlüye — arayüzde de bu sırayla görünür. */
export const ALGORITHMS: readonly HashAlgorithm[] = [
  'CRC32',
  'MD5',
  'SHA-1',
  'SHA-256',
  'SHA-384',
  'SHA-512',
];

/** Yeni kod bunları kullanmamalı; arayüz uyarı rozeti basıyor. */
export const WEAK: ReadonlySet<HashAlgorithm> = new Set<HashAlgorithm>(['CRC32', 'MD5', 'SHA-1']);

/** CRC32 bir sağlama, özet değil — anahtarla (HMAC) kullanılamaz. */
export const KEYABLE: ReadonlySet<HashAlgorithm> = new Set<HashAlgorithm>([
  'MD5',
  'SHA-1',
  'SHA-256',
  'SHA-384',
  'SHA-512',
]);

export interface HashRow {
  algorithm: HashAlgorithm;
  /** Kodlanmış özet, ya da bu algoritma bu modda çalışmıyorsa null. */
  value: string | null;
}

const encoder = new TextEncoder();

/* ------------------------------------------------------------------ CRC32 */

/** IEEE 802.3 polinomunun ters biçimi (`0xEDB88320`) için tablo. */
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? (value >>> 1) ^ 0xed_b8_83_20 : value >>> 1;
  }
  return value >>> 0;
});

export function crc32(bytes: Uint8Array): number {
  let crc = 0xff_ff_ff_ff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

/* --------------------------------------------------------------- kodlama */

export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function encodeDigest(bytes: Uint8Array, encoding: HashEncoding): string {
  if (encoding === 'base64') return toBase64(bytes);
  const hex = toHex(bytes);
  // `toUpperCase()` yerel ayardan bağımsız — onaltılıkta zaten `i` yok.
  return encoding === 'HEX' ? hex.toUpperCase() : hex;
}

/* ----------------------------------------------------------------- özetler */

/**
 * `crypto.subtle` yalnızca GÜVENLİ BAĞLAMDA vardır: https ya da localhost.
 * Bir yerde http üzerinden açılırsa SHA satırları boş kalır; CRC32 ve MD5
 * elle yazıldığı için çalışmaya devam eder.
 */
const subtle = (): SubtleCrypto | null => globalThis.crypto?.subtle ?? null;

async function digest(algorithm: string, bytes: Uint8Array): Promise<Uint8Array | null> {
  const api = subtle();
  if (!api) return null;
  // `bytes.buffer` doğrudan verilmiyor: dilimlenmiş bir görünüm tüm arabelleği
  // işaret edebilir, o zaman fazladan bayt özetlenir.
  const result = await api.digest(algorithm, bytes.slice().buffer as ArrayBuffer);
  return new Uint8Array(result);
}

async function hmac(algorithm: string, key: Uint8Array, bytes: Uint8Array): Promise<Uint8Array | null> {
  const api = subtle();
  if (!api) return null;
  const cryptoKey = await api.importKey(
    'raw',
    key.slice().buffer as ArrayBuffer,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );
  const result = await api.sign('HMAC', cryptoKey, bytes.slice().buffer as ArrayBuffer);
  return new Uint8Array(result);
}

export interface HashInput {
  text: string;
  /** Boş değilse HMAC hesaplanır; CRC32 o modda boş kalır. */
  hmacKey: string;
  encoding: HashEncoding;
}

export async function computeHashes({ text, hmacKey, encoding }: HashInput): Promise<HashRow[]> {
  const bytes = encoder.encode(text);
  const keyed = hmacKey !== '';
  const key = encoder.encode(hmacKey);

  const rows = await Promise.all(
    ALGORITHMS.map(async (algorithm): Promise<HashRow> => {
      if (keyed && !KEYABLE.has(algorithm)) return { algorithm, value: null };

      if (algorithm === 'CRC32') {
        // CRC32 dört bayt; onaltılıkta sabit sekiz hane olmalı.
        const value = crc32(bytes);
        const digestBytes = new Uint8Array(4);
        new DataView(digestBytes.buffer).setUint32(0, value, false);
        return { algorithm, value: encodeDigest(digestBytes, encoding) };
      }

      if (algorithm === 'MD5') {
        return {
          algorithm,
          value: encodeDigest(keyed ? hmacMd5(key, bytes) : md5(bytes), encoding),
        };
      }

      const result = keyed ? await hmac(algorithm, key, bytes) : await digest(algorithm, bytes);
      return { algorithm, value: result ? encodeDigest(result, encoding) : null };
    }),
  );

  return rows;
}
