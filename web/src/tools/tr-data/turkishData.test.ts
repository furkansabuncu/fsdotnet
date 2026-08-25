import { describe, expect, it } from 'vitest';
import {
  MAX_ROWS,
  PERSON_FIELDS,
  formatIban,
  generateIban,
  generatePeople,
  generateTckn,
  toCsv,
  toJson,
  validateIban,
  validateTckn,
} from './turkishData';

describe('TCKN', () => {
  it('üretilen her numara doğrulamayı geçer', () => {
    for (let i = 0; i < 500; i += 1) {
      const tckn = generateTckn();
      expect(validateTckn(tckn), tckn).toBe(true);
    }
  });

  it('11 hane ve ilk hane sıfır değil', () => {
    for (let i = 0; i < 100; i += 1) {
      expect(generateTckn()).toMatch(/^[1-9]\d{10}$/);
    }
  });

  describe('validateTckn', () => {
    it('bilinen geçerli bir örneği kabul eder', () => {
      // Algoritmadan elle türetildi: 1 0 0 0 0 0 0 0 0 → tek=1, çift=0
      // d10 = (1×7 − 0) mod 10 = 7 · d11 = (1+7) mod 10 = 8
      expect(validateTckn('10000000078')).toBe(true);
    });

    it.each([
      ['', 'boş'],
      ['1234567890', '10 hane'],
      ['123456789012', '12 hane'],
      ['01234567890', 'sıfırla başlıyor'],
      ['1000000007a', 'harf içeriyor'],
      ['10000000079', 'son hane yanlış'],
      ['10000000088', 'onuncu hane yanlış'],
    ])('%j reddedilir (%s)', (value) => {
      expect(validateTckn(value)).toBe(false);
    });

    it('tek hane değişince doğrulama bozulur', () => {
      const tckn = generateTckn();
      const digit = Number(tckn[3]);
      const broken = `${tckn.slice(0, 3)}${(digit + 1) % 10}${tckn.slice(4)}`;
      expect(validateTckn(broken)).toBe(false);
    });
  });
});

describe('IBAN', () => {
  it('üretilen her IBAN MOD-97 doğrulamasını geçer', () => {
    for (let i = 0; i < 300; i += 1) {
      const { iban } = generateIban();
      expect(validateIban(iban), iban).toBe(true);
    }
  });

  it('TR + 24 hane, toplam 26 karakter', () => {
    const { iban } = generateIban();
    expect(iban).toMatch(/^TR\d{24}$/);
    expect(iban).toHaveLength(26);
  });

  it('gerçek bir banka adı döner', () => {
    expect(generateIban().bank).not.toBe('');
  });

  describe('validateIban', () => {
    it('boşluklu yazımı kabul eder', () => {
      const { iban } = generateIban();
      expect(validateIban(formatIban(iban))).toBe(true);
    });

    it('küçük harfli yazımı kabul eder', () => {
      const { iban } = generateIban();
      expect(validateIban(iban.toLowerCase())).toBe(true);
    });

    it.each([
      ['', 'boş'],
      ['TR12', 'kısa'],
      ['DE89370400440532013000', 'TR değil'],
      ['TR000000000000000000000000', 'kontrol hanesi yanlış'],
    ])('%j reddedilir (%s)', (value) => {
      expect(validateIban(value)).toBe(false);
    });

    it('tek hane değişince doğrulama bozulur', () => {
      const { iban } = generateIban();
      const digit = Number(iban[10]);
      const broken = `${iban.slice(0, 10)}${(digit + 1) % 10}${iban.slice(11)}`;
      expect(validateIban(broken)).toBe(false);
    });
  });

  it('formatIban dörderli gruplar', () => {
    expect(formatIban('TR330006100519786457841326')).toBe('TR33 0006 1005 1978 6457 8413 26');
  });
});

describe('generatePeople', () => {
  it('istenen adette üretir', () => {
    expect(generatePeople(7)).toHaveLength(7);
  });

  it.each([
    [0, 1],
    [-3, 1],
    [MAX_ROWS + 50, MAX_ROWS],
  ])('%i istenirse %i üretilir', (asked, expected) => {
    expect(generatePeople(asked)).toHaveLength(expected);
  });

  it('her kayıt tüm alanları dolu taşır', () => {
    for (const person of generatePeople(50)) {
      for (const field of PERSON_FIELDS) {
        expect(person[field], field).not.toBe('');
      }
    }
  });

  it('kayıtlardaki TCKN ve IBAN geçerlidir', () => {
    for (const person of generatePeople(100)) {
      expect(validateTckn(person.tckn)).toBe(true);
      expect(validateIban(person.iban)).toBe(true);
    }
  });

  it('doğum tarihi ISO biçiminde ve makul aralıkta', () => {
    for (const person of generatePeople(50)) {
      expect(person.dogum_tarihi).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const year = Number(person.dogum_tarihi.slice(0, 4));
      expect(year).toBeGreaterThanOrEqual(1940);
      expect(year).toBeLessThanOrEqual(2007);
      // Ay/gün her ayda geçerli olmalı — 31 Şubat üretmemeli.
      expect(Number.isNaN(Date.parse(person.dogum_tarihi))).toBe(false);
    }
  });

  it('telefon numarası 0 ile başlar', () => {
    expect(generatePeople(20).every((p) => /^0\d{3} \d{3} \d{2} \d{2}$/.test(p.telefon))).toBe(true);
  });
});

describe('dışa aktarma', () => {
  const people = generatePeople(3);

  it('CSV başlık + satır üretir', () => {
    const lines = toCsv(people, PERSON_FIELDS).split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe(PERSON_FIELDS.join(','));
  });

  it('virgül içeren alan tırnaklanır', () => {
    const csv = toCsv([{ ...people[0]!, adres: 'a, b' }], ['adres']);
    expect(csv).toBe('adres\n"a, b"');
  });

  it('tırnak içeren alan kaçırılır', () => {
    const csv = toCsv([{ ...people[0]!, adres: 'o "dedi"' }], ['adres']);
    expect(csv).toBe('adres\n"o ""dedi"""');
  });

  it('JSON yalnızca seçili alanları içerir', () => {
    const parsed = JSON.parse(toJson(people, ['ad', 'tckn'])) as Record<string, string>[];
    expect(Object.keys(parsed[0] as object)).toEqual(['ad', 'tckn']);
  });
});
