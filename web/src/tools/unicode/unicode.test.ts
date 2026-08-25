import { describe, expect, it } from 'vitest';
import { countText, inspectPoints, normalization, stripInvisible } from './unicode';

describe('countText', () => {
  // Bu dört sayının farklı olması bu aracın var oluş sebebi: JS'in
  // `text.length`'i kullanıcının gördüğü karakter sayısı DEĞİLDİR.
  it.each([
    ['abc', { codePoints: 3, utf16Units: 3, utf8Bytes: 3, graphemes: 3 }],
    ['héllo', { codePoints: 5, utf16Units: 5, utf8Bytes: 6, graphemes: 5 }],
    ['ağrı', { codePoints: 4, utf16Units: 4, utf8Bytes: 6, graphemes: 4 }],
    // Emoji: tek karakter ama iki UTF-16 birimi, dört bayt.
    ['🌍', { codePoints: 1, utf16Units: 2, utf8Bytes: 4, graphemes: 1 }],
  ])('%j', (input, expected) => {
    expect(countText(input)).toEqual(expected);
  });

  it('ZWJ ile birleşen aile emojisi tek grafemdir', () => {
    const family = '👨‍👩‍👧';
    const counts = countText(family);
    expect(counts.graphemes).toBe(1);
    expect(counts.codePoints).toBe(5); // 3 kişi + 2 ZWJ
  });

  it('boş metin sıfırlar', () => {
    expect(countText('')).toEqual({ codePoints: 0, utf16Units: 0, utf8Bytes: 0, graphemes: 0 });
  });
});

describe('inspectPoints', () => {
  it('her kod noktası için etiket üretir', () => {
    const [a] = inspectPoints('A');
    expect(a).toMatchObject({ index: 0, char: 'A', codePoint: 65, label: 'U+0041', category: 'letter' });
  });

  it('emoji tek kod noktası sayılır — surrogate çifti bölünmez', () => {
    const points = inspectPoints('🌍');
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ codePoint: 0x1f30d, label: 'U+1F30D', utf8Bytes: 4 });
  });

  describe('kategori tespiti', () => {
    it.each([
      ['ğ', 'letter'],
      ['7', 'number'],
      ['.', 'punctuation'],
      ['+', 'symbol'],
      [' ', 'space'],
      ['​', 'format'],
      ['', 'control'],
      ['̆', 'mark'],
    ] as const)('%j → %s', (char, category) => {
      expect(inspectPoints(char)[0]?.category).toBe(category);
    });
  });

  describe('şüpheli karakterler', () => {
    it.each([
      [' ', 'NO-BREAK SPACE'],
      ['​', 'ZERO WIDTH SPACE'],
      ['﻿', 'ZERO WIDTH NO-BREAK SPACE (BOM)'],
      ['­', 'SOFT HYPHEN'],
    ])('%j işaretlenir ve adlandırılır', (char, name) => {
      const [point] = inspectPoints(char);
      expect(point?.suspicious).toBe(true);
      expect(point?.name).toBe(name);
    });

    it('sıradan karakterler şüpheli değildir', () => {
      for (const point of inspectPoints('Merhaba dünya 123')) {
        expect(point.suspicious, point.label).toBe(false);
      }
    });

    it('sekme ve satır sonu şüpheli sayılmaz — beklenen karakterler', () => {
      for (const point of inspectPoints('\t\n')) {
        expect(point.suspicious).toBe(false);
        expect(point.name).not.toBeNull();
      }
    });

    it('yön değiştirme kontrolleri ayrıca işaretlenir', () => {
      // Trojan Source: görünen sıra ile derleyicinin okuduğu sıra ayrışır.
      expect(inspectPoints('‮')[0]).toMatchObject({ bidi: true, suspicious: true });
      expect(inspectPoints('A')[0]?.bidi).toBe(false);
    });
  });
});

describe('normalization', () => {
  it('birleşik ve ayrık ğ aynı görünür ama eşit değildir', () => {
    const composed = 'ağ'; // ağ — tek kod noktası
    const decomposed = 'ağ'; // a + g + breve
    expect(composed).not.toBe(decomposed);
    expect(composed.normalize('NFC')).toBe(decomposed.normalize('NFC'));
  });

  it('ayrık metinde farkı bildirir', () => {
    const info = normalization('ağ');
    expect(info.differs).toBe(true);
    expect(info.isNfc).toBe(false);
    expect(info.nfc).toBe('ağ');
  });

  it('zaten NFC olan metinde isNfc doğru', () => {
    expect(normalization('ağrı').isNfc).toBe(true);
  });

  it('ASCII metinde fark yok', () => {
    expect(normalization('hello')).toMatchObject({ differs: false, isNfc: true });
  });
});

describe('stripInvisible', () => {
  it('sıfır genişlikli boşluğu siler', () => {
    expect(stripInvisible('ab​c')).toBe('abc');
  });

  it('BOM ve yumuşak tireyi siler', () => {
    expect(stripInvisible('﻿ab­c')).toBe('abc');
  });

  it('bölünmez boşluğu SİLMEZ, normal boşluğa çevirir', () => {
    // Silmek kelimeleri birbirine yapıştırırdı.
    expect(stripInvisible('Ömer Çelik')).toBe('Ömer Çelik');
  });

  it('temiz metne dokunmaz', () => {
    expect(stripInvisible('Merhaba dünya\n\tsatır')).toBe('Merhaba dünya\n\tsatır');
  });

  it('sonuç artık şüpheli karakter içermez', () => {
    const dirty = 'a b​c﻿d‮e';
    expect(inspectPoints(stripInvisible(dirty)).some((p) => p.suspicious)).toBe(false);
  });
});
