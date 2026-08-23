import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './base64';

/** Test yardımcısı: ok bekleyip değeri döndürür, hata gelirse testi düşürür. */
function value(result: ReturnType<typeof encodeBase64>): string {
  if (!result.ok) throw new Error(`Beklenmeyen hata: ${result.error}`);
  return result.value;
}

describe('encodeBase64', () => {
  it.each([
    ['boş girdi', '', ''],
    ['ascii', 'hello', 'aGVsbG8='],
    ['padding yok', 'abc', 'YWJj'],
    ['tek padding', 'ab', 'YWI='],
    ['boşluklu metin', 'hello world', 'aGVsbG8gd29ybGQ='],
  ])('%s', (_label, input, expected) => {
    expect(value(encodeBase64(input))).toBe(expected);
  });

  // btoa()'nın klasik tuzağı: doğrudan çağrılsa InvalidCharacterError atardı.
  it('latin1 dışı karakterleri UTF-8 olarak kodlar', () => {
    expect(value(encodeBase64('héllo 🌍'))).toBe('aMOpbGxvIPCfjI0=');
  });

  it('urlSafe modunda +/ yerine -_ kullanır ve padding atar', () => {
    const standard = value(encodeBase64('~~~?~~~>'));
    const urlSafe = value(encodeBase64('~~~?~~~>', { urlSafe: true }));

    expect(standard).toMatch(/[+/]/);
    expect(urlSafe).not.toMatch(/[+/=]/);
  });
});

describe('decodeBase64', () => {
  it.each([
    ['boş girdi', '', ''],
    ['ascii', 'aGVsbG8=', 'hello'],
    ['utf-8', 'aMOpbGxvIPCfjI0=', 'héllo 🌍'],
    ['satır sonlarını yok sayar', 'aGVs\nbG8=', 'hello'],
    ['eksik padding’i tamamlar', 'aGVsbG8', 'hello'],
    ['url-safe alfabeyi kabul eder', 'w7_Dvw', 'ÿÿ'],
  ])('%s', (_label, input, expected) => {
    expect(value(decodeBase64(input))).toBe(expected);
  });

  it.each([
    ['alfabe dışı karakter', 'aGVsbG8$'],
    ['tek karakterlik blok', 'a'],
  ])('geçersiz girdide hata döner: %s', (_label, input) => {
    const result = decodeBase64(input);
    expect(result.ok).toBe(false);
  });

  it('geçerli UTF-8 olmayan byte dizisini hata olarak bildirir', () => {
    // 0xFF tek başına geçerli bir UTF-8 dizisi değildir.
    const result = decodeBase64('/w==');
    expect(result).toEqual({ ok: false, error: 'base64Utf8' });
  });
});

describe('round-trip', () => {
  it.each([
    'hello',
    '',
    'héllo 🌍',
    'a'.repeat(10_000),
    JSON.stringify({ nested: { value: [1, 2, 3] } }),
    'satır1\nsatır2\ttab',
  ])('encode → decode aynı metni verir: %#', (input) => {
    expect(value(decodeBase64(value(encodeBase64(input))))).toBe(input);
  });

  it('urlSafe çıktısı da geri çözülebilir', () => {
    const input = 'Ünicode + slash / plus ? test';
    const encoded = value(encodeBase64(input, { urlSafe: true }));
    expect(value(decodeBase64(encoded))).toBe(input);
  });
});
