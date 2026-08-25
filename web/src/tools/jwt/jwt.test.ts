import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeJwt } from './jwt';

/** Test token'ı üretir — imza sahte, çözücü zaten doğrulamıyor. */
function makeToken(header: object, payload: object, signature = 'sig'): string {
  const encode = (value: object) => {
    const json = JSON.stringify(value);
    const bytes = new TextEncoder().encode(json);
    const binary = String.fromCharCode(...bytes);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  return `${encode(header)}.${encode(payload)}.${signature}`;
}

const decoded = (token: string) => {
  const result = decodeJwt(token);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('decodeJwt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-24T12:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('header ve payload\'u biçimlenmiş JSON olarak verir', () => {
    const result = decoded(makeToken({ alg: 'HS256', typ: 'JWT' }, { sub: '42' }));
    expect(result.header).toBe('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    expect(result.payload).toBe('{\n  "sub": "42"\n}');
    expect(result.algorithm).toBe('HS256');
    expect(result.signature).toBe('sig');
  });

  it('base64url alfabesini çözer (dolgusuz, -_ ile)', () => {
    // Türkçe içerik hem UTF-8 hem dolgu davranışını sınar.
    const result = decoded(makeToken({ alg: 'HS256' }, { ad: 'Ömer Çelikbaş' }));
    expect(result.payload).toContain('Ömer Çelikbaş');
  });

  describe('zaman claim\'leri', () => {
    // NumericDate SANİYE cinsindendir; milisaniye sanmak klasik hatadır.
    const hour = 3600;
    const now = Math.floor(Date.parse('2026-08-24T12:00:00.000Z') / 1000);

    it('iat / exp / nbf tarihe çevrilir', () => {
      const result = decoded(
        makeToken({ alg: 'HS256' }, { iat: now, nbf: now, exp: now + hour }),
      );
      expect(result.claims.map((c) => c.name)).toEqual(['iat', 'nbf', 'exp']);
      expect(result.claims[2]?.date.toISOString()).toBe('2026-08-24T13:00:00.000Z');
    });

    it('süresi geçmiş exp sorunlu işaretlenir', () => {
      const result = decoded(makeToken({ alg: 'HS256' }, { exp: now - hour }));
      expect(result.claims[0]).toMatchObject({ name: 'exp', problem: true });
    });

    it('geçerli exp sorunsuzdur', () => {
      const result = decoded(makeToken({ alg: 'HS256' }, { exp: now + hour }));
      expect(result.claims[0]?.problem).toBe(false);
    });

    it('henüz başlamamış nbf sorunlu işaretlenir', () => {
      const result = decoded(makeToken({ alg: 'HS256' }, { nbf: now + hour }));
      expect(result.claims[0]).toMatchObject({ name: 'nbf', problem: true });
    });

    it('sayı olmayan exp yok sayılır', () => {
      const result = decoded(makeToken({ alg: 'HS256' }, { exp: 'yarın' }));
      expect(result.claims).toEqual([]);
    });
  });

  describe('imza durumu', () => {
    it('alg none imzasız sayılır', () => {
      expect(decoded(makeToken({ alg: 'none' }, { a: 1 }, '')).signed).toBe(false);
    });

    it('boş imza imzasız sayılır', () => {
      expect(decoded(makeToken({ alg: 'HS256' }, { a: 1 }, '')).signed).toBe(false);
    });

    it('imzalı token imzalı sayılır', () => {
      expect(decoded(makeToken({ alg: 'RS256' }, { a: 1 })).signed).toBe(true);
    });
  });

  describe('hata durumu', () => {
    it.each([
      ['', 'jwtEmpty'],
      ['   ', 'jwtEmpty'],
      ['tekparca', 'jwtShape'],
      ['a.b', 'jwtShape'],
      ['a.b.c.d', 'jwtShape'],
      ['!!!.!!!.sig', 'jwtSegment'],
    ])('%j → %s', (token, error) => {
      expect(decodeJwt(token)).toEqual({ ok: false, error });
    });

    it('JSON olmayan segment jwtJson verir', () => {
      const notJson = btoa('merhaba').replace(/=+$/, '');
      expect(decodeJwt(`${notJson}.${notJson}.sig`)).toEqual({ ok: false, error: 'jwtJson' });
    });
  });
});
