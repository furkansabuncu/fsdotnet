import { describe, expect, it } from 'vitest';
import { RULE_CATALOG, RULE_IDS, getRule, ruleHref, rulesByTool } from './catalog';
import { ANALYZERS } from './analyzers';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';
import { ruleTexts } from './text';
import { RULE_KEYS as SQL_KEYS } from '../tools/sql-fix/sqlFix';
import { RULE_KEYS as LINQ_KEYS } from '../tools/linq-11g/linq11g';
import { RULE_KEYS as CULTURE_KEYS } from '../tools/turkish-culture/turkishCulture';

/**
 * Katalog, üç ayrı yerin (kural motoru, sözlük, adres) hizada kalmasına
 * bağlı. Bu testler o hizayı tutuyor — kayması sessiz bir hata olurdu:
 * yayında bir sayfa, ama içi boş ya da 404.
 */

describe('kapsama', () => {
  it.each([
    ['sql-fix', SQL_KEYS],
    ['linq-11g', LINQ_KEYS],
    ['turkish-culture', CULTURE_KEYS],
  ])('%s içindeki her kural katalogda', (tool, keys) => {
    const listed = new Set(RULE_CATALOG.filter((entry) => entry.tool === tool).map((entry) => entry.key));
    expect([...keys].filter((key) => !listed.has(key))).toEqual([]);
  });

  it('katalogda öksüz kural yok', () => {
    const known = new Set<string>([...SQL_KEYS, ...LINQ_KEYS, ...CULTURE_KEYS]);
    expect(RULE_CATALOG.filter((entry) => !known.has(entry.key)).map((entry) => entry.id)).toEqual([]);
  });

  it('kimlikler benzersiz', () => {
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  it('kimlikler adres güvenli', () => {
    expect(RULE_IDS.filter((id) => !/^[a-z0-9-]+$/.test(id))).toEqual([]);
  });

  it('ruleHref katalogdaki kimlikle aynı adresi üretir', () => {
    // Bulgu listesi adresi kimlikten değil kuraldan kuruyor; ikisi ayrışırsa
    // her bulgu bağlantısı 404 olurdu.
    const broken = RULE_CATALOG.filter((entry) => ruleHref(entry.tool, entry.key) !== `/r/${entry.id}`);
    expect(broken.map((entry) => entry.id)).toEqual([]);
  });
});

describe('örnekler kuralı gerçekten tetikliyor', () => {
  it.each(RULE_CATALOG.map((entry) => [entry.id, entry] as const))('%s', (_id, entry) => {
    const analyze = ANALYZERS[entry.tool];
    const result = analyze!(entry.sample);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Bir kuralın sessizce eşleşmeyi bırakmasını imkânsız kılan test bu:
    // sayfası yayında kalır ama örneği hiçbir şey bulmazdı.
    expect(result.value.map((finding) => finding.rule)).toContain(entry.key);
  });
});

describe('sözlük', () => {
  it.each([
    ['en', en],
    ['tr', tr],
  ])('%s her kural için başlık ve açıklama taşıyor', (_name, dictionary) => {
    const missing = RULE_CATALOG.filter((entry) => {
      const text = ruleTexts(dictionary, entry.tool)[entry.key];
      return text === undefined || text.title === '' || text.hint === '';
    });
    expect(missing.map((entry) => entry.id)).toEqual([]);
  });
});

describe('gruplama', () => {
  it('her aracı bir kez listeler', () => {
    const tools = rulesByTool().map((group) => group.tool);
    expect(new Set(tools).size).toBe(tools.length);
  });

  it('gruplardaki kural sayısı katalogla aynı', () => {
    const total = rulesByTool().reduce((sum, group) => sum + group.rules.length, 0);
    expect(total).toBe(RULE_CATALOG.length);
  });
});

describe('getRule', () => {
  it('bilinen kimliği bulur', () => {
    expect(getRule('sql-fix-glued-keyword')?.key).toBe('gluedKeyword');
  });

  it('bilinmeyen kimlikte undefined döner', () => {
    // Kimlik adresten geliyor; rastgele bir dize beklenen bir durum.
    expect(getRule('yok-boyle')).toBeUndefined();
    expect(getRule(undefined)).toBeUndefined();
  });
});
