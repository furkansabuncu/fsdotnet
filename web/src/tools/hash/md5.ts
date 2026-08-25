/**
 * MD5 — elle yazıldı çünkü WebCrypto onu bilerek desteklemiyor.
 *
 * MD5 kriptografik olarak KIRIK; yeni bir imza/parola şeması için
 * kullanılmamalı. Burada durmasının tek sebebi eski sistemlerle çalışmak:
 * yıllar önce MD5 ile üretilmiş bir dosya özetini ya da entegrasyon
 * imzasını doğrulamak gerektiğinde başka seçenek yok. Araç arayüzü bunu
 * ayrıca uyarı olarak gösteriyor.
 */

const SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

/** RFC 1321'deki T tablosu: `floor(abs(sin(i + 1)) * 2^32)`. */
const T = Uint32Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32),
);

function rotateLeft(value: number, count: number): number {
  return (value << count) | (value >>> (32 - count));
}

export function md5(input: Uint8Array): Uint8Array {
  /* Dolgu: 0x80 baytı, sonra uzunluk 64 bit little-endian olarak sığana
     kadar sıfır. Toplam uzunluk 64'ün katı olmalı. */
  const bitLength = input.length * 8;
  const paddedLength = (((input.length + 8) >>> 6) + 1) << 6;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(input);
  bytes[input.length] = 0x80;

  const view = new DataView(bytes.buffer);
  // Uzunluk 2^32 biti aşarsa üst kelime de gerekir; `Math.floor` ile ayrılıyor.
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true);

  let a0 = 0x67_45_23_01;
  let b0 = 0xef_cd_ab_89;
  let c0 = 0x98_ba_dc_fe;
  let d0 = 0x10_32_54_76;

  const chunk = new Uint32Array(16);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let word = 0; word < 16; word += 1) {
      chunk[word] = view.getUint32(offset + word * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      // `>>> 0` her adımda şart: JS bit işlemleri işaretli 32 bit üretiyor.
      const sum = (f + a + T[i]! + chunk[g]!) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotateLeft(sum, SHIFTS[i]!)) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const digest = new Uint8Array(16);
  const out = new DataView(digest.buffer);
  out.setUint32(0, a0, true);
  out.setUint32(4, b0, true);
  out.setUint32(8, c0, true);
  out.setUint32(12, d0, true);
  return digest;
}

/** MD5 blok boyutu — HMAC'in anahtar dolgusu için gerekli. */
export const MD5_BLOCK_SIZE = 64;

/**
 * HMAC-MD5 (RFC 2104). WebCrypto HMAC'i MD5 ile kurmayı reddediyor, o yüzden
 * bu da elle: `H((K ^ opad) || H((K ^ ipad) || msg))`.
 */
export function hmacMd5(key: Uint8Array, message: Uint8Array): Uint8Array {
  // Bloktan uzun anahtar önce özetlenir, kısa anahtar sıfırla doldurulur.
  const normalized = new Uint8Array(MD5_BLOCK_SIZE);
  normalized.set(key.length > MD5_BLOCK_SIZE ? md5(key) : key);

  const inner = new Uint8Array(MD5_BLOCK_SIZE + message.length);
  const outer = new Uint8Array(MD5_BLOCK_SIZE + 16);

  for (let i = 0; i < MD5_BLOCK_SIZE; i += 1) {
    inner[i] = normalized[i]! ^ 0x36;
    outer[i] = normalized[i]! ^ 0x5c;
  }

  inner.set(message, MD5_BLOCK_SIZE);
  outer.set(md5(inner), MD5_BLOCK_SIZE);
  return md5(outer);
}
