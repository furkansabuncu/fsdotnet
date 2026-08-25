import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';
import { CATEGORY_ORDER } from './categories';
import { READY_COUNT, TOOLS, getTool, searchTools, toolsByCategory } from './registry';
import { TOOL_IDS } from './types';

/**
 * Katalog artık tek bir listeden değil, iki yerden besleniyor: `TOOL_IDS`
 * (sitemap ve sözlük tipleri) ve `registry.ts` (rotalar, arama, ana sayfa).
 * İkisinin kayması sessiz bir hata — araç yayında ama sitemap'te yok, ya da
 * sitemap'te var ama açılınca 404. Bu testler o kaymayı yakalıyor.
 */
describe('katalog tutarlılığı', () => {
  it('her kimliğin kayıtlı bir aracı var', () => {
    const missing = TOOL_IDS.filter((id) => getTool(id) === undefined);
    expect(missing).toEqual([]);
  });

  it('her kayıtlı aracın kimliği listede', () => {
    const known = new Set<string>(TOOL_IDS);
    expect(TOOLS.filter((tool) => !known.has(tool.id)).map((tool) => tool.id)).toEqual([]);
  });

  it('kimlikler benzersiz', () => {
    expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(TOOLS.length);
  });

  it('hazır her aracın bir component\'i var', () => {
    const broken = TOOLS.filter((tool) => tool.status === 'ready' && !tool.component);
    expect(broken.map((tool) => tool.id)).toEqual([]);
  });

  it('katalogda yazılmamış araç kalmadı', () => {
    expect(READY_COUNT).toBe(TOOLS.length);
  });

  it('her aracın kategorisi tanımlı', () => {
    const known = new Set<string>(CATEGORY_ORDER);
    expect(TOOLS.filter((tool) => !known.has(tool.category)).map((tool) => tool.id)).toEqual([]);
  });

  /* Boş kategori ana sayfada başlıksız bir boşluk bırakırdı; `toolsByCategory`
     onları eliyor, bu test elemenin gerçekten gerektiğini doğruluyor. */
  it('gruplama boş kategori döndürmez', () => {
    expect(toolsByCategory().every((group) => group.tools.length > 0)).toBe(true);
  });
});

describe('sözlük kapsaması', () => {
  it.each([
    ['en', en],
    ['tr', tr],
  ])('%s her araç için açıklama taşıyor', (_name, dictionary) => {
    const missing = TOOL_IDS.filter((id) => !dictionary.toolDescriptions[id]);
    expect(missing).toEqual([]);
  });

  /* Kart açıklamayı tek satırda gösterip kırpıyor. Uzun cümle ortadan
     kesilince hem çirkin hem bilgisiz kalıyor. */
  it.each([
    ['en', en],
    ['tr', tr],
  ])('%s açıklamaları karta sığıyor', (_name, dictionary) => {
    const tooLong = TOOL_IDS.filter((id) => dictionary.toolDescriptions[id].length > 52);
    expect(tooLong).toEqual([]);
  });
});

describe('searchTools', () => {
  it('boş sorgu tüm araçları verir', () => {
    expect(searchTools('  ')).toHaveLength(TOOLS.length);
  });

  it('isimden bulur', () => {
    expect(searchTools('base64').map((tool) => tool.id)).toContain('base64');
  });

  it('kimlikten bulur', () => {
    expect(searchTools('ora-errors').map((tool) => tool.id)).toContain('ora-errors');
  });

  /* Türkçe arama terimleri araç tanımındaki `keywords` içinde: kullanıcı
     "bozuk metin" yazınca Mojibake çıkmalı, adında geçmese bile. */
  it('Türkçe anahtar kelimeden bulur', () => {
    expect(searchTools('bozuk').map((tool) => tool.id)).toContain('mojibake');
    expect(searchTools('düzenli ifade').map((tool) => tool.id)).toContain('regex');
  });

  it('isimle başlayan eşleşme, içeren eşleşmenin önüne geçer', () => {
    const results = searchTools('json');
    const names = results.map((tool) => tool.name);
    expect(names[0]?.toLowerCase().startsWith('json')).toBe(true);
  });

  it('eşleşme yoksa boş döner', () => {
    expect(searchTools('zzzzzz')).toEqual([]);
  });
});

describe('getTool', () => {
  it('bilinmeyen kimlikte undefined döner', () => {
    // Kimlik URL'den geliyor; rastgele bir dize gelmesi beklenen bir durum.
    expect(getTool('nope')).toBeUndefined();
    expect(getTool(undefined)).toBeUndefined();
  });
});
