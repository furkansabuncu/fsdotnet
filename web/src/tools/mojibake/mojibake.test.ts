import { describe, expect, it } from 'vitest';
import { repairMojibake } from './mojibake';

const fix = (input: string) => repairMojibake(input).text;

describe('repairMojibake', () => {
  describe('sahipsiz öncü byte artığı (doğru karakter + artık)', () => {
    // Gerçek HBYS çıktısından alınmış örnekler: her Türkçe karakterin doğrusu
    // duruyor, arkasına UTF-8 öncü byte'ının CP1252 görüntüsü yapışmış.
    it.each([
      ['KıÄlıÄçÃ', 'Kılıç'],
      ['göÃzüÃ', 'gözü'],
      ['eşÅliğÄinde', 'eşliğinde'],
      ['kitapnıÄn', 'kitapnın'],
      ['FAKO+İÄOL (SAĞÄ GÖÃZ)', 'FAKO+İOL (SAĞ GÖZ)'],
      ['ÖÃn kamara', 'Ön kamara'],
      ['spançÃ', 'spanç'],
      ['deneme yazıÄss', 'deneme yazıss'],
    ])('%s → %s', (input, expected) => {
      expect(fix(input)).toBe(expected);
    });

    it('tam cümlede tüm karakterleri onarır', () => {
      const broken =
        'Lokal regional ve topikal anestezi eşÅliğÄinde kitapnıÄn göÃzüÃ ' +
        'povidon iyot çÃöÃzeltisi ile kirpikler boyandıÄ.';
      expect(fix(broken)).toBe(
        'Lokal regional ve topikal anestezi eşliğinde kitapnın gözü ' +
          'povidon iyot çözeltisi ile kirpikler boyandı.',
      );
    });
  });

  describe('üst üste binmiş bozulma', () => {
    // Aynı bozulma her tekrarında artık sayısını ikiye katlar: 1 → 3 → 7.
    it('üç kat derinliği çözer', () => {
      expect(fix('KıÄÄÃÄÃÃÃlıÄÄÃÄÃÃÃçÃÃÃÃÃÃÃ')).toBe('Kılıç');
    });

    it('kaç tur sürdüğünü raporlar', () => {
      expect(repairMojibake('KıÄÄÃÄÃÃÃlıÄÄÃÄÃÃÃçÃÃÃÃÃÃÃ').passes).toBe(3);
      expect(repairMojibake('KıÄlıÄçÃ').passes).toBe(1);
    });
  });

  describe('klasik çift kodlama (UTF-8 → CP1252 olarak okunmuş)', () => {
    it.each([
      ['Ã¶', 'ö'],
      ['Ã§', 'ç'],
      ['Ã¼', 'ü'],
      ['Ä±', 'ı'],
      ['ÅŸ', 'ş'],
      ['ÄŸ', 'ğ'],
      ['Ä°stanbul', 'İstanbul'],
      ['GÃ¶ÄŸÃ¼s', 'Göğüs'],
      ['â€œalÄ±ntÄ±â€', '“alıntı”'],
    ])('%s → %s', (input, expected) => {
      expect(fix(input)).toBe(expected);
    });

    it('iki kez çift kodlanmış metni de çözer', () => {
      expect(fix('Ãƒmid')).toBe('Ãmid');
    });
  });

  describe('temiz metne dokunmaz', () => {
    it.each([
      '',
      'hello world',
      'Kılıç',
      'FAKO+İOL (SAĞ GÖZ)',
      'Ön kamara viskoelastik madde',
      'héllo 🌍',
      // Portekizce: ã'yı Ã izlemediği sürece artık sayılmamalı.
      'São Paulo',
      // Fransızca tırnak ve aksanlar.
      'déjà vu « oui »',
    ])('%j değişmez', (input) => {
      expect(fix(input)).toBe(input);
    });

    it('temiz metinde 0 tur harcar', () => {
      expect(repairMojibake('Kılıç').passes).toBe(0);
    });
  });

  describe('idempotent', () => {
    it('onarılmış metni ikinci kez onarmak bir şey değiştirmez', () => {
      const once = fix('KıÄlıÄçÃ göÃzüÃ eşÅliğÄinde');
      expect(fix(once)).toBe(once);
    });
  });

  it('silinen karakter sayısını raporlar', () => {
    const report = repairMojibake('göÃzüÃ');
    expect(report.removed).toBe(2);
    expect(report.text).toBe('gözü');
  });
});
