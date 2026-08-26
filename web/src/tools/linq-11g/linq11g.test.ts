import { describe, expect, it } from 'vitest';
import { analyze, type RuleKey } from './linq11g';
import { applyFixes } from '../../lint/engine';
import type { Finding } from '../../lint/types';

const findings = (source: string): Finding<RuleKey>[] => {
  const result = analyze(source);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const rules = (source: string): RuleKey[] => findings(source).map((item) => item.rule);
const fix = (source: string): string => applyFixes(source, findings(source));

describe('AnyAsync', () => {
  it('bulur ve FirstOrDefaultAsync’e çevirir', () => {
    expect(fix('var v = await repo.Query().AnyAsync(x => x.id == id, ct);')).toBe(
      'var v = await repo.Query().FirstOrDefaultAsync(x => x.id == id, ct) != null;',
    );
  });

  it('if içinde de doğru ayrışan bir ifade üretir', () => {
    // `await X != null` → `(await X) != null`, yani sonuç yine bool.
    expect(fix('if (await repo.Query().AnyAsync(x => x.id == id, ct)) { }')).toBe(
      'if (await repo.Query().FirstOrDefaultAsync(x => x.id == id, ct) != null) { }',
    );
  });

  it('parantez kapanmıyorsa düzeltme önermez', () => {
    const found = findings('await repo.Query().AnyAsync(x => x.id == id')[0];
    expect(found?.rule).toBe('anyAsync');
    expect(found?.edits).toEqual([]);
  });

  it('yorum içindekine dokunmaz', () => {
    expect(rules('// eskiden .AnyAsync(x => true) vardı')).toEqual([]);
  });
});

describe('Any konumu', () => {
  it('Where içindeki Any geçerlidir', () => {
    // EXISTS'e çevriliyor; kural burada susmak zorunda.
    expect(rules('var q = set.Where(p => alt.Any(t => t.bagli_id == p.id));')).toEqual([]);
  });

  it('Select içindeki Any işaretlenir', () => {
    expect(rules('var q = set.Select(p => new { Var = alt.Any(t => t.id == p.id) });')).toContain(
      'anyInSelect',
    );
  });

  it('serbest bir list.Any() sıradan C#’tır', () => {
    expect(rules('if (liste.Any()) { return; }')).toEqual([]);
  });
});

describe('Select içinde bool', () => {
  it('eşitlik karşılaştırmasını işaretler', () => {
    const found = findings('q.Select(x => new C { Kapali = x.islemdurum == 3 })')[0];
    expect(found?.rule).toBe('booleanInSelect');
    expect(found?.detail).toBe('Kapali');
  });

  it('null karşılaştırmasını da işaretler', () => {
    expect(rules('q.Select(x => new C { Imzali = x.rapor != null })')).toContain('booleanInSelect');
  });

  it('sıradan atamaya dokunmaz', () => {
    expect(rules('q.Select(x => new C { Ad = x.ad, Tutar = x.tutar })')).toEqual([]);
  });

  it('Where içindeki karşılaştırma sorun değil', () => {
    // Yasak olan yalnızca PROJEKSİYONDA bool üretmek.
    expect(rules('q.Where(x => x.islemdurum == 3 && x.rapor != null)')).toEqual([]);
  });

  it('lambda okunu atama sanmaz', () => {
    expect(rules('q.Select(x => x.tutar)')).toEqual([]);
  });
});

describe('Query() lambda içinde', () => {
  it('ifade ağacının içindeki çağrıyı işaretler', () => {
    expect(rules('var q = set.Where(p => uow.Repo.Query().Any(t => t.id == p.id));')).toContain(
      'queryInLambda',
    );
  });

  it('local’e alınmış alt sorguya dokunmaz', () => {
    const source = [
      'var alt = uow.Repo.Query().Where(t => t.imza_id == personelId);',
      'var liste = set.Where(p => alt.Any(t => t.bagli_id == p.id));',
    ].join('\n');
    expect(rules(source)).toEqual([]);
  });
});

describe('11g’de olmayan yapılar', () => {
  it('Skip ve Take uyarı üretir', () => {
    expect(rules('q.Skip(20).Take(10)')).toEqual(['skipTake', 'skipTake']);
  });

  it('ExecuteUpdate uyarı üretir', () => {
    expect(rules('await q.ExecuteUpdateAsync(s => s.SetProperty(x => x.ad, "a"), ct);')).toContain(
      'executeUpdate',
    );
  });

  it('DateOnly uyarı üretir', () => {
    expect(rules('public DateOnly Tarih { get; set; }')).toEqual(['dateOnly']);
  });
});

describe('Contains → IN listesi', () => {
  it('Where içindeki koleksiyon Contains’i uyarır', () => {
    const found = findings('q.Where(x => ids.Contains(x.id))')[0];
    expect(found?.rule).toBe('containsList');
    expect(found?.detail).toBe('ids → IN (…)');
  });

  it('metin Contains’ine dokunmaz', () => {
    // `x.ad.Contains("a")` bir LIKE; IN listesi değil.
    expect(rules('q.Where(x => x.ad.Contains("Ali"))')).toEqual([]);
  });

  it('Where dışındaki Contains sıradan C#’tır', () => {
    expect(rules('if (ids.Contains(5)) { return; }')).toEqual([]);
  });
});

describe('ham SQL', () => {
  it('FromSqlRaw enterpolasyonunu Interpolated’a çevirir', () => {
    expect(fix('db.Kitap.FromSqlRaw($"select * from kitap where id = {id}")')).toBe(
      'db.Kitap.FromSqlInterpolated($"select * from kitap where id = {id}")',
    );
  });

  it('ExecuteSqlRawAsync için de çalışır', () => {
    expect(fix('await db.Database.ExecuteSqlRawAsync($"delete from log where id = {id}")')).toBe(
      'await db.Database.ExecuteSqlInterpolatedAsync($"delete from log where id = {id}")',
    );
  });

  it('sabit metinli FromSqlRaw sorun değil', () => {
    expect(rules('db.Kitap.FromSqlRaw("select * from kitap")')).toEqual([]);
  });
});

describe('analyze', () => {
  it('boş girdi hata döner', () => {
    expect(analyze('  ')).toEqual({ ok: false, error: 'linqEmpty' });
  });

  it('temiz kodda bulgu yoktur', () => {
    const source = [
      'var alt = uow.SiparisRepository.Query();',
      'var liste = await uow.KitapRepository.Query()',
      '    .Where(k => alt.Any(s => s.kitap_id == k.kitap_id))',
      '    .Select(k => new KitapCevap { Baslik = k.baslik, Stok = k.stok })',
      '    .ToListAsync(ct);',
    ].join('\n');
    expect(rules(source)).toEqual([]);
  });

  it('bulguları konuma göre sıralar', () => {
    const positions = findings('q.Skip(1).Take(2).Select(x => new C { A = x.b == 1 })').map(
      (item) => item.start,
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
