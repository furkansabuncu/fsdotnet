import { describe, expect, it } from 'vitest';
import {
  BLACK,
  WHITE,
  contrastRatio,
  parseColor,
  toHex,
  toHslString,
  toOklchString,
  toRgbString,
  verdict,
} from './color';

const rgb = (input: string) => {
  const result = parseColor(input);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('parseColor', () => {
  describe('hex', () => {
    it.each([
      ['#ff0000', { r: 255, g: 0, b: 0, a: 1 }],
      ['ff0000', { r: 255, g: 0, b: 0, a: 1 }],
      ['#F00', { r: 255, g: 0, b: 0, a: 1 }],
      ['#0080ff', { r: 0, g: 128, b: 255, a: 1 }],
      // 3 ve 4 hanede her hane ikiye katlanır — #abc ≠ #0a0b0c
      ['#abc', { r: 0xaa, g: 0xbb, b: 0xcc, a: 1 }],
      ['#ff000080', { r: 255, g: 0, b: 0, a: 128 / 255 }],
    ])('%s', (input, expected) => {
      expect(rgb(input)).toEqual(expected);
    });
  });

  describe('rgb() ve hsl()', () => {
    it.each([
      ['rgb(255, 0, 0)', '#ff0000'],
      ['rgb(0 128 255)', '#0080ff'],
      ['rgb(100%, 0%, 0%)', '#ff0000'],
      ['hsl(0, 100%, 50%)', '#ff0000'],
      ['hsl(210 100% 50%)', '#0080ff'],
      ['hsl(0 0% 100%)', '#ffffff'],
    ])('%s → %s', (input, hex) => {
      expect(toHex(rgb(input))).toBe(hex);
    });

    it('modern eğik çizgili alfa sözdizimini okur', () => {
      expect(rgb('rgb(255 0 0 / 50%)').a).toBeCloseTo(0.5, 2);
    });
  });

  describe('hata durumu', () => {
    it.each([
      ['', 'colorEmpty'],
      ['   ', 'colorEmpty'],
      ['mavi', 'colorInvalid'],
      ['#12345', 'colorInvalid'],
      ['rgb(1, 2)', 'colorInvalid'],
      ['rgb(a, b, c)', 'colorInvalid'],
    ])('%j → %s', (input, error) => {
      expect(parseColor(input)).toEqual({ ok: false, error });
    });
  });
});

describe('dönüşümler', () => {
  it('gidiş dönüş kayıpsız (hex → rgb → hex)', () => {
    for (const hex of ['#000000', '#ffffff', '#0080ff', '#7c3aed', '#12864f']) {
      expect(toHex(rgb(hex))).toBe(hex);
    }
  });

  it.each([
    ['#ff0000', 'rgb(255 0 0)', 'hsl(0 100% 50%)'],
    ['#00ff00', 'rgb(0 255 0)', 'hsl(120 100% 50%)'],
    ['#0080ff', 'rgb(0 128 255)', 'hsl(210 100% 50%)'],
    ['#808080', 'rgb(128 128 128)', 'hsl(0 0% 50%)'],
  ])('%s → %s / %s', (hex, expectedRgb, expectedHsl) => {
    expect(toRgbString(rgb(hex))).toBe(expectedRgb);
    expect(toHslString(rgb(hex))).toBe(expectedHsl);
  });

  describe('oklch', () => {
    it('beyaz L=100%, C=0', () => {
      expect(toOklchString(WHITE)).toBe('oklch(100% 0 0)');
    });

    it('siyah L=0%, C=0', () => {
      expect(toOklchString(BLACK)).toBe('oklch(0% 0 0)');
    });

    it('kırmızı bilinen değerlere yakın', () => {
      // Ottosson referansı: oklch(62.8% 0.2577 29.23)
      const match = /oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/.exec(toOklchString(rgb('#ff0000')));
      expect(match).not.toBeNull();
      const [, l, c, h] = match as RegExpExecArray;
      expect(Number(l)).toBeCloseTo(62.8, 0);
      expect(Number(c)).toBeCloseTo(0.2577, 2);
      expect(Number(h)).toBeCloseTo(29.23, 0);
    });

    it('gri tonlarında açı 0 yazılır — sayısal gürültü gösterilmez', () => {
      expect(toOklchString(rgb('#808080'))).toMatch(/^oklch\([\d.]+% 0 0\)$/);
    });
  });
});

describe('WCAG kontrastı', () => {
  it('siyah–beyaz teorik maksimum 21', () => {
    expect(contrastRatio(BLACK, WHITE)).toBe(21);
  });

  it('aynı renk 1', () => {
    expect(contrastRatio(rgb('#0080ff'), rgb('#0080ff'))).toBe(1);
  });

  it('sıra önemsiz', () => {
    expect(contrastRatio(BLACK, WHITE)).toBe(contrastRatio(WHITE, BLACK));
  });

  it('bilinen bir çifti doğru hesaplar', () => {
    // #767676 beyaz üstünde tam 4.5 — WCAG'in kanonik sınır örneği.
    expect(contrastRatio(rgb('#767676'), WHITE)).toBeCloseTo(4.54, 1);
  });

  describe('eşikler', () => {
    it.each([
      [21, { normalAA: true, normalAAA: true, largeAA: true }],
      [7, { normalAA: true, normalAAA: true, largeAA: true }],
      [4.5, { normalAA: true, normalAAA: false, largeAA: true }],
      [3, { normalAA: false, normalAAA: false, largeAA: true }],
      [1.5, { normalAA: false, normalAAA: false, largeAA: false }],
    ])('oran %s', (ratio, expected) => {
      expect(verdict(ratio)).toMatchObject(expected);
    });
  });
});
