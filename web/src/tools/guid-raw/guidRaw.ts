import { err, ok, type ToolResult } from '../types';

/**
 * .NET `Guid` ile Oracle `RAW(16)` arasında çeviri.
 *
 * Sessiz hata şurada: .NET'in `Guid.ToByteArray()` metodu ilk ÜÇ alanı
 * little-endian yazıyor — tarihsel bir COM uyumluluğu kalıntısı. Yani
 * `00112233-4455-6677-…` GUID'i baytlara çevrildiğinde `33221100 5544
 * 7766 …` oluyor. Oracle `RAW` ise verilen baytı olduğu gibi saklıyor.
 *
 * Sonuç: aynı GUID, `ToByteArray()` ile yazıldığında ve `ToString("N")` +
 * `HEXTORAW` ile yazıldığında veritabanında FARKLI iki satır oluyor.
 * Hiçbir hata alınmıyor; yalnızca aramalar boş dönüyor.
 */

const HEX = /^[0-9a-fA-F]{32}$/;

/** `{…}`, `(…)`, `0x`, tire ve boşluk ayıklanmış hâli. */
function clean(input: string): string {
  return input.trim().replace(/^[{(]|[})]$/g, '').replace(/^0[xX]/, '').replace(/[\s-]/g, '');
}

function toBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(16);
  for (let index = 0; index < 16; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * İlk üç alanı ters çevirir: 4 bayt, 2 bayt, 2 bayt. Son 8 bayta
 * dokunulmuyor — `Guid.ToByteArray()` da tam olarak bunu yapıyor ve işlem
 * kendi tersi, yani iki yönde de aynı fonksiyon.
 */
export function swapFields(bytes: Uint8Array): Uint8Array {
  const out = Uint8Array.from(bytes);
  const reverse = (from: number, to: number) => {
    out.set(bytes.slice(from, to).toReversed(), from);
  };

  reverse(0, 4);
  reverse(4, 6);
  reverse(6, 8);
  return out;
}

const canonical = (hex: string) =>
  [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');

export interface GuidConversion {
  /** Kanonik 8-4-4-4-12 gösterimi. */
  guid: string;
  /** Metinle AYNI sıradaki hex — `ToString("N")` ve `HEXTORAW` bunu verir. */
  hexSameOrder: string;
  /** `Guid.ToByteArray()` sırası — ilk üç alan ters. */
  hexDotnetBytes: string;
  /** Oracle'a yazılabilir literal. */
  hextoraw: string;
  /** Ters yönde okundu mu — girdi RAW olarak yorumlandıysa true. */
  fromRaw: boolean;
}

/**
 * Girdiyi çevirir.
 *
 * `fromRaw` girdiyi `Guid.ToByteArray()` çıktısı sayar, yani baytları
 * geri çevirerek GUID'i kurar. İki yönü ayırmak şart: aynı 32 hane hem
 * GUID hem RAW olabilir ve hangisi olduğunu METİN söylemiyor.
 */
export function convertGuid(input: string, fromRaw: boolean): ToolResult<GuidConversion> {
  const cleaned = clean(input);
  if (cleaned === '') return err('guidEmpty');
  if (!HEX.test(cleaned)) return err('guidInvalid', `${cleaned.length}/32`);

  const bytes = toBytes(cleaned);
  const guidBytes = fromRaw ? swapFields(bytes) : bytes;
  const hexSameOrder = toHex(guidBytes);

  return ok({
    guid: canonical(hexSameOrder),
    hexSameOrder: hexSameOrder.toUpperCase(),
    hexDotnetBytes: toHex(swapFields(guidBytes)).toUpperCase(),
    hextoraw: `HEXTORAW('${hexSameOrder.toUpperCase()}')`,
    fromRaw,
  });
}
