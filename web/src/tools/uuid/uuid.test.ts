import { describe, expect, it } from 'vitest';
import { MAX_COUNT, generateUuids, uuidV7 } from './uuid';

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const filled = (byte: number) => new Uint8Array(10).fill(byte);

describe('uuidV7', () => {
  it('kanonik biçim üretir', () => {
    expect(uuidV7(0, filled(0))).toMatch(CANONICAL);
  });

  it('sürüm nibble\'ı 7', () => {
    // 15. karakter (14. indeks) sürümü taşır.
    expect(uuidV7(Date.parse('2026-08-24T09:30:00Z'), filled(0xff))[14]).toBe('7');
  });

  it('varyant bitleri RFC 4122 (8/9/a/b)', () => {
    for (const byte of [0x00, 0x3f, 0x7f, 0xff]) {
      expect(uuidV7(0, filled(byte))[19]).toMatch(/[89ab]/);
    }
  });

  it('ilk 48 bit Unix milisaniyesidir', () => {
    const now = Date.parse('2026-08-24T09:30:00.000Z');
    const hex = uuidV7(now, filled(0)).replace(/-/g, '').slice(0, 12);
    expect(Number.parseInt(hex, 16)).toBe(now);
  });

  it('zamanla sıralanır — v7\'nin varlık sebebi', () => {
    // Aynı rastgelelikle, sadece zaman ilerlerken üretilen değerler
    // sözlük sırasında da artmalı.
    const early = uuidV7(Date.parse('2020-01-01T00:00:00Z'), filled(0x11));
    const late = uuidV7(Date.parse('2026-08-24T09:30:00Z'), filled(0x11));
    expect(early < late).toBe(true);
  });

  it('aynı milisaniyede rastgelelik ayırır', () => {
    const now = Date.now();
    const a = uuidV7(now, filled(0x01));
    const b = uuidV7(now, filled(0x02));
    expect(a).not.toBe(b);
    // İlk 48 bit (zaman) aynı kalmalı.
    expect(a.slice(0, 13)).toBe(b.slice(0, 13));
  });
});

describe('generateUuids', () => {
  const base = { version: 'v4', count: 1, uppercase: false, braces: false } as const;

  it('istenen adette üretir', () => {
    expect(generateUuids({ ...base, count: 5 })).toHaveLength(5);
  });

  it('üretilenler benzersizdir', () => {
    const list = generateUuids({ ...base, count: 200 });
    expect(new Set(list).size).toBe(200);
  });

  it.each(['v4', 'v7'] as const)('%s kanonik biçimdedir', (version) => {
    expect(generateUuids({ ...base, version })[0]).toMatch(CANONICAL);
  });

  it('v4 sürüm nibble\'ı 4', () => {
    expect(generateUuids({ ...base, version: 'v4' })[0]?.[14]).toBe('4');
  });

  it('büyük harf ve süslü parantez biçimleri', () => {
    const [value] = generateUuids({ ...base, uppercase: true, braces: true });
    expect(value).toMatch(/^\{[0-9A-F-]{36}\}$/);
  });

  describe('adet sınırları', () => {
    it.each([
      [0, 1],
      [-5, 1],
      [MAX_COUNT + 100, MAX_COUNT],
    ])('%i istenirse %i üretilir', (asked, expected) => {
      expect(generateUuids({ ...base, count: asked })).toHaveLength(expected);
    });
  });
});
