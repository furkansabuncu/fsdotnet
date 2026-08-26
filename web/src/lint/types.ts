/**
 * Lint araçlarının ortak veri tipleri.
 *
 * Sitede birden fazla "metni denetle, bulguları listele, seçilenleri
 * uygula" aracı var: SQL Fixer, Oracle 11g LINQ lint'i, Türkçe kültür
 * lint'i. Hepsinin farkı KURAL TABLOSU; konum hesabı, bulgu şekli ve
 * düzeltme uygulaması aynı. Bu dosya o ortak kısmın tipleri.
 */

export type Region = 'code' | 'string' | 'identifier' | 'comment';

export interface Span {
  kind: Region;
  start: number;
  /** Dışlayıcı. */
  end: number;
}

export interface ScanResult {
  /** Girdiyi boşluksuz kaplar — birleştirildiğinde girdinin kendisi çıkar. */
  spans: Span[];
  /** Kapanmamış ilk tırnak ya da blok yorum; yoksa null. */
  unterminated: { kind: Exclude<Region, 'code'>; start: number } | null;
}

export type Severity = 'error' | 'warning';

export interface Edit {
  start: number;
  end: number;
  text: string;
}

/**
 * Tek bir bulgu.
 *
 * `rule` bir ANAHTAR, metin değil: aracın kendisi hangi dilde
 * konuşulduğunu bilmiyor. Başlık ve açıklama sözlükte, `Record<K, …>` ile
 * bağlı — yani yeni bir kural eklenip Türkçesi yazılmazsa proje derlenmez.
 */
export interface Finding<K extends string = string> {
  /** Kullanıcının hangi düzeltmeyi kapattığını hatırlamak için kararlı anahtar. */
  id: string;
  rule: K;
  severity: Severity;
  start: number;
  end: number;
  /** `3:12` — çevrilmez, girdiden gelir. */
  position: string;
  /** Bulunan token ya da somut öneri; çevrilmez. */
  detail?: string;
  /** Boş dizi: tespit var, otomatik düzeltmesi yok. */
  edits: Edit[];
}

/** Kural başlığı ve "neden bozuk" açıklaması — sözlükten gelir. */
export interface RuleText {
  title: string;
  hint: string;
}

/**
 * Karakter başına "kod mu" bayrağı.
 *
 * Kurallar girdi üzerinde regex gezdiriyor ve her eşleşmede bölge sorgusu
 * yapıyor; span listesinde arama yapmak bunu O(n·m) yapardı.
 */
export function codeMask(source: string, spans: readonly Span[]): Uint8Array {
  const mask = new Uint8Array(source.length);
  for (const span of spans) {
    if (span.kind === 'code') mask.fill(1, span.start, span.end);
  }
  return mask;
}

/** `12` → `"3:7"` — bulgunun kullanıcıya gösterilen konumu. */
export function positionOf(source: string, index: number): string {
  const before = source.slice(0, index);
  const line = before.split('\n').length;
  const column = index - (before.lastIndexOf('\n') + 1) + 1;
  return `${line}:${column}`;
}
