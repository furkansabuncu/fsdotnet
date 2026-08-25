import { describe, expect, it } from 'vitest';
import { breakdown, parseEpoch, toTicks } from './epoch';

const date = (input: string, forced?: Parameters<typeof parseEpoch>[1]) => {
  const result = parseEpoch(input, forced);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('parseEpoch', () => {
  describe('birim tahmini', () => {
    it.each([
      ['1787563800', 'seconds', '2026-08-24T09:30:00.000Z'],
      ['1787563800000', 'milliseconds', '2026-08-24T09:30:00.000Z'],
      ['639231606000000000', 'ticks', '2026-08-24T09:30:00.000Z'],
      ['0', 'seconds', '1970-01-01T00:00:00.000Z'],
    ])('%s → %s', (input, unit, iso) => {
      const value = date(input);
      expect(value.detected).toBe(unit);
      expect(value.date.toISOString()).toBe(iso);
    });

    it('tahmini elle ezmeye izin verir', () => {
      // 1787563800 varsayılan olarak saniye; milisaniye olarak zorlanırsa 1970.
      expect(date('1787563800', 'milliseconds').date.toISOString()).toBe(
        '1970-01-21T16:32:43.800Z',
      );
    });

    it('negatif saniye 1970 öncesini verir', () => {
      expect(date('-86400').date.toISOString()).toBe('1969-12-31T00:00:00.000Z');
    });
  });

  describe('tarih metni', () => {
    it.each(['2026-08-24T09:30:00Z', '2026-08-24', 'Aug 24, 2026 09:30:00 UTC'])(
      '%j ayrıştırılır',
      (input) => {
        expect(date(input).detected).toBe('date');
      },
    );
  });

  describe('hata durumu', () => {
    it.each([
      ['', 'epochEmpty'],
      ['   ', 'epochEmpty'],
      ['bir tarih değil', 'epochUnparsable'],
      ['12ab34', 'epochUnparsable'],
    ])('%j → %s', (input, error) => {
      expect(parseEpoch(input)).toEqual({ ok: false, error });
    });

    it('aralık dışı sayı hata verir', () => {
      // JS Date sınırı ±8.64e15 ms; bir fazlası Invalid Date.
      expect(parseEpoch('8640000000000001', 'milliseconds')).toEqual({
        ok: false,
        error: 'epochOutOfRange',
      });
    });
  });
});

describe('toTicks', () => {
  // .NET: new DateTime(1970,1,1).Ticks == 621355968000000000
  it('Unix epoch 621355968000000000 tick eder', () => {
    expect(toTicks(new Date('1970-01-01T00:00:00.000Z'))).toBe('621355968000000000');
  });

  it('bilinen bir tarihi doğru çevirir', () => {
    expect(toTicks(new Date('2026-08-24T09:30:00.000Z'))).toBe('639231606000000000');
  });

  it('tick değeri Number hassasiyetini aşar — BigInt şart', () => {
    const ticks = toTicks(new Date('2026-08-24T09:30:00.000Z'));
    expect(Number(ticks) > Number.MAX_SAFE_INTEGER).toBe(true);
    // Number üzerinden gitseydi son basamaklar yuvarlanırdı; string tam.
    expect(ticks).toMatch(/^\d{18}$/);
    expect(ticks.endsWith('0000')).toBe(true);
  });

  it('tick → tarih → tick gidiş dönüşü kayıpsız', () => {
    const ticks = '638937234123450000';
    expect(toTicks(date(ticks).date)).toBe(ticks);
  });
});

describe('breakdown', () => {
  const sample = new Date('2026-08-24T09:30:00.000Z');

  it('tüm gösterimleri üretir', () => {
    const result = breakdown(sample, 'en-GB', 'UTC');
    expect(result).toMatchObject({
      iso: '2026-08-24T09:30:00.000Z',
      seconds: '1787563800',
      milliseconds: '1787563800000',
      ticks: '639231606000000000',
    });
    expect(result.utc).toContain('24 Aug 2026');
  });

  it('yerel satır dile göre değişir, UTC satırı değişmez', () => {
    const english = breakdown(sample, 'en-GB', 'UTC');
    const turkish = breakdown(sample, 'tr-TR', 'UTC');
    expect(turkish.local).not.toBe(english.local);
    expect(turkish.utc).toBe(english.utc);
  });
});
