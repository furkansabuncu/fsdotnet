import { err, ok, type ToolResult } from '../types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
  /** 0–1 */
  a: number;
}

/** `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(...)`, `hsl(...)` kabul eder. */
export function parseColor(input: string): ToolResult<Rgb> {
  const text = input.trim().toLowerCase();
  if (text === '') return err('colorEmpty');

  const hex = /^#?([0-9a-f]{3,8})$/.exec(text);
  if (hex) return fromHex(hex[1] as string);

  const numbers = /^(rgba?|hsla?)\s*\(([^)]+)\)$/.exec(text);
  if (numbers) {
    const kind = numbers[1] as string;
    // Hem virgüllü eski sözdizimi hem boşluklu modern sözdizimi:
    // rgb(1, 2, 3) ve rgb(1 2 3 / 50%)
    const parts = (numbers[2] as string).split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return err('colorInvalid');

    const alpha = parts[3] === undefined ? 1 : parsePart(parts[3], 1);
    if (Number.isNaN(alpha)) return err('colorInvalid');

    if (kind.startsWith('rgb')) {
      const [r, g, b] = [0, 1, 2].map((i) => parsePart(parts[i] as string, 255));
      if ([r, g, b].some(Number.isNaN)) return err('colorInvalid');
      return ok({ r: clamp(r as number, 255), g: clamp(g as number, 255), b: clamp(b as number, 255), a: clamp(alpha, 1) });
    }

    const h = Number.parseFloat(parts[0] as string);
    const s = Number.parseFloat(parts[1] as string) / 100;
    const l = Number.parseFloat(parts[2] as string) / 100;
    if ([h, s, l].some(Number.isNaN)) return err('colorInvalid');
    return ok({ ...hslToRgb(h, clamp(s, 1), clamp(l, 1)), a: clamp(alpha, 1) });
  }

  return err('colorInvalid');
}

/** "50%" → oranın karşılığı; "128" → sayının kendisi. */
function parsePart(part: string, full: number): number {
  return part.endsWith('%')
    ? (Number.parseFloat(part) / 100) * full
    : Number.parseFloat(part);
}

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), max);
}

function fromHex(digits: string): ToolResult<Rgb> {
  // 3 ve 4 haneli kısaltmalarda her hane ikiye katlanır: #abc → #aabbcc
  const expanded =
    digits.length === 3 || digits.length === 4
      ? digits
          .split('')
          .map((d) => d + d)
          .join('')
      : digits;

  if (expanded.length !== 6 && expanded.length !== 8) return err('colorInvalid');

  const byte = (index: number) => Number.parseInt(expanded.slice(index * 2, index * 2 + 2), 16);
  return ok({
    r: byte(0),
    g: byte(1),
    b: byte(2),
    a: expanded.length === 8 ? byte(3) / 255 : 1,
  });
}

function hslToRgb(h: number, s: number, l: number): Omit<Rgb, 'a'> {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hue = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const m = l - chroma / 2;

  const table: [number, number, number][] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ];
  const [r, g, b] = table[Math.floor(hue) % 6] as [number, number, number];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function toHex({ r, g, b, a }: Rgb): string {
  const pair = (value: number) => Math.round(value).toString(16).padStart(2, '0');
  const alpha = a >= 1 ? '' : pair(a * 255);
  return `#${pair(r)}${pair(g)}${pair(b)}${alpha}`;
}

export function toRgbString({ r, g, b, a }: Rgb): string {
  const parts = [r, g, b].map(Math.round).join(' ');
  return a >= 1 ? `rgb(${parts})` : `rgb(${parts} / ${round(a * 100, 0)}%)`;
}

export function toHslString({ r, g, b, a }: Rgb): string {
  const [red, green, blue] = [r / 255, g / 255, b / 255];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (delta !== 0) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  const parts = `${round(h, 0)} ${round(s * 100, 0)}% ${round(l * 100, 0)}%`;
  return a >= 1 ? `hsl(${parts})` : `hsl(${parts} / ${round(a * 100, 0)}%)`;
}

/** sRGB kanalını doğrusal ışığa çevirir — hem OKLab hem WCAG bunu ister. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Björn Ottosson'un OKLab dönüşümü, ardından kutupsal koordinatlar.
 *
 * OKLCH'nin CSS'e girme sebebi algısal tekdüzelik: L'yi %10 artırmak her
 * renkte aynı miktarda "daha açık" hissettirir; HSL'de öyle değildir.
 */
export function toOklchString({ r, g, b, a }: Rgb): string {
  const [lr, lg, lb] = [linearize(r), linearize(g), linearize(b)];

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(okA * okA + okB * okB);
  let hue = (Math.atan2(okB, okA) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  // Akromatik renkte açı sayısal gürültüden ibarettir; 0 yazmak dürüst.
  if (chroma < 1e-4) hue = 0;

  const parts = `${round(okL * 100, 1)}% ${round(chroma, 4)} ${round(hue, 1)}`;
  return a >= 1 ? `oklch(${parts})` : `oklch(${parts} / ${round(a * 100, 0)}%)`;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** WCAG 2.1 bağıl parlaklık. */
export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** İki renk arasındaki WCAG kontrast oranı (1–21). */
export function contrastRatio(first: Rgb, second: Rgb): number {
  const a = luminance(first);
  const b = luminance(second);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return round((light + 0.05) / (dark + 0.05), 2);
}

export interface ContrastVerdict {
  ratio: number;
  /** Normal metin için eşik 4.5, büyük metin ve arayüz öğeleri için 3.0. */
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
}

export function verdict(ratio: number): ContrastVerdict {
  return {
    ratio,
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
  };
}

export const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 };
export const BLACK: Rgb = { r: 0, g: 0, b: 0, a: 1 };
