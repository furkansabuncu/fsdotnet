export type UuidVersion = 'v4' | 'v7';

/** 16 bayttan kanonik 8-4-4-4-12 metnine. */
function stringify(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * RFC 9562 §5.7 — zaman sıralı UUID.
 *
 * v4 tamamen rastgeledir; bir veritabanında birincil anahtar olarak
 * kullanıldığında her ekleme indeksin rastgele bir yerine düşer ve sayfa
 * bölünmesi yaratır. v7'nin ilk 48 biti Unix milisaniyesi olduğu için
 * FARKLI milisaniyelerde üretilenler sözlük sırasında da artar — indeks
 * yerelliğini sağlayan şey bu.
 *
 * Sınır: aynı milisaniye içinde sıra rastgele parçaya kalır. RFC 9562 §6.2'nin
 * sayaç yöntemi bunu da garantiler ama isteğe bağlıdır ve burada yok; sayfa
 * bölünmesi milisaniye ölçeğinde yaşandığı için pratik faydası düşük.
 *
 * `now` ve `random` dışarıdan alınıyor: test edilebilir olsun diye.
 */
export function uuidV7(now: number, random: Uint8Array): string {
  const bytes = new Uint8Array(16);

  // 0-5: 48 bitlik Unix milisaniyesi, big-endian.
  const timestamp = BigInt(now);
  for (let i = 0; i < 6; i += 1) {
    bytes[i] = Number((timestamp >> BigInt(8 * (5 - i))) & 0xffn);
  }

  bytes.set(random.subarray(0, 10), 6);

  // 6. baytın üst yarısı sürüm (7), 8. baytın üst bitleri varyant (RFC 4122).
  bytes[6] = ((bytes[6] as number) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;

  return stringify(bytes);
}

/** Tarayıcının kendi üreticisi; kriptografik rastgelelik garantili. */
export function uuidV4(): string {
  return crypto.randomUUID();
}

export interface GenerateOptions {
  version: UuidVersion;
  count: number;
  uppercase: boolean;
  /** SQL/registry biçimi: {8-4-4-4-12} */
  braces: boolean;
}

/** Üst sınır: tarayıcıyı kilitleyecek bir sayı istenmesin. */
export const MAX_COUNT = 500;

export function generateUuids(options: GenerateOptions): string[] {
  const count = Math.min(Math.max(1, options.count), MAX_COUNT);
  const list: string[] = [];

  for (let i = 0; i < count; i += 1) {
    let value =
      options.version === 'v4' ? uuidV4() : uuidV7(Date.now(), crypto.getRandomValues(new Uint8Array(10)));

    if (options.uppercase) value = value.toUpperCase();
    if (options.braces) value = `{${value}}`;
    list.push(value);
  }

  return list;
}
