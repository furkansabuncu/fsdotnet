import { describe, expect, it } from 'vitest';
import { analyze, applyFixes, fixableCount, unwrapHostString, type Finding, type RuleKey } from './sqlFix';
import { positionOf, scan } from './scan';

const findings = (sql: string): Finding[] => {
  const result = analyze(sql);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const rules = (sql: string): RuleKey[] => findings(sql).map((finding) => finding.rule);

/** Tüm düzeltmeleri uygulayıp sonucu verir — kuralların net etkisi. */
const fix = (sql: string): string => applyFixes(sql, findings(sql));

describe('scan', () => {
  it('metin, tanımlayıcı ve yorumu koddan ayırır', () => {
    const { spans } = scan(`select 'a--b' /* x */ from t -- son`);
    expect(spans.filter((span) => span.kind === 'string')).toHaveLength(1);
    expect(spans.filter((span) => span.kind === 'comment')).toHaveLength(2);
  });

  it('ikiye katlanmış tırnak kaçıştır, kapanış değil', () => {
    const { spans, unterminated } = scan(`select 'it''s' from t`);
    expect(unterminated).toBeNull();
    const literal = spans.find((span) => span.kind === 'string');
    expect(`select 'it''s' from t`.slice(literal!.start, literal!.end)).toBe("'it''s'");
  });

  it('kapanmamış tırnağı bildirir', () => {
    expect(scan(`select 'a from t`).unterminated).toEqual({ kind: 'string', start: 7 });
  });

  it('konumu satır:sütun verir', () => {
    expect(positionOf('bir\niki\nuc', 8)).toBe('3:1');
  });
});

describe('yapıştırma hasarı', () => {
  it('görünmez karakteri bulur ve kod noktasını söyler', () => {
    const found = findings('select 1 from dual')[0];
    expect(found?.rule).toBe('invisibleChar');
    expect(found?.detail).toBe('U+00A0');
    expect(fix('select 1 from dual')).toBe('select 1 from dual');
  });

  it('sıfır genişlikli karakteri siler, boşluğa çevirmez', () => {
    expect(fix('select​ 1 from dual')).toBe('select 1 from dual');
  });

  it('metin içindeki görünmez karaktere dokunmaz', () => {
    // Orada veri olabilir; ayrıca ORA-00911 üretmiyor.
    expect(rules("select 'a b' from dual")).toEqual([]);
  });

  it('akıllı tırnağı düzeltir', () => {
    expect(fix('select ‘a’ from dual')).toBe("select 'a' from dual");
  });

  it('SQL> ve satır numarası öneklerini atar', () => {
    expect(fix('SQL> select 1\n  2  from dual')).toBe('select 1\nfrom dual');
  });

  it('markdown çitini satırıyla birlikte atar', () => {
    expect(fix('```sql\nselect 1 from dual\n```')).toBe('select 1 from dual\n');
  });
});

describe('ana dilden yapıştırılmış string', () => {
  it('Delphi birleştirmesini çözer', () => {
    const source = ["'select s.siparis_id from siparis s '", "' where s.kanal_id = :kanal'"].join(' + ');
    expect(unwrapHostString(source)).toEqual({
      text: 'select s.siparis_id from siparis s  where s.kanal_id = :kanal',
      flavour: 'Delphi',
    });
  });

  it('Pascal’ın ikiye katlanmış tırnağını tek tırnağa çevirir', () => {
    expect(unwrapHostString(`'where ad = ''Ali'''`)?.text).toBe("where ad = 'Ali'");
  });

  it('C# kaçışlarını çözer', () => {
    expect(unwrapHostString(String.raw`"select * from t where ad = \"Ali\""`)).toEqual({
      text: 'select * from t where ad = "Ali"',
      flavour: 'C# / JSON',
    });
  });

  it('C# verbatim string’de çift tırnak kaçıştır', () => {
    expect(unwrapHostString('@"select ""KOLON"" from t"')).toEqual({
      text: 'select "KOLON" from t',
      flavour: 'C# verbatim',
    });
  });

  it('satır sonu kaçışını gerçek satır sonuna çevirir', () => {
    expect(unwrapHostString(String.raw`"select 1\nfrom dual"`)?.text).toBe('select 1\nfrom dual');
  });

  it('sıradan SQL’i string sanmaz', () => {
    expect(unwrapHostString("select 'a' from dual")).toBeNull();
    expect(unwrapHostString('select 1 from dual')).toBeNull();
  });

  it('tırnakla başlayıp string ifadesi olmayan girdiyi reddeder', () => {
    expect(unwrapHostString("'a' , 'b'")).toBeNull();
  });

  it('eşleştiğinde başka kural çalıştırmaz', () => {
    // Öteki kurallar için girdinin tamamı tek bir metin sabiti; ne
    // derlerse yanlış olurdu.
    expect(rules(`'select * from t where x = 1;'`)).toEqual(['hostStringLiteral']);
  });
});

describe('dengesizlikler', () => {
  it('fazladan kapanış parantezini siler', () => {
    expect(fix('select (1)) from dual')).toBe('select (1) from dual');
  });

  it('kapanmamış parantezi bildirir ama düzeltmez', () => {
    // Kapanışın NEREYE geleceği bilinemez; tahmin etmek sorgunun anlamını
    // değiştirirdi.
    const found = findings('select nvl(a, 0 from dual').find((item) => item.rule === 'unclosedParen');
    expect(found?.edits).toEqual([]);
  });

  it('kapanmamış tırnağı bildirir', () => {
    expect(rules("select 'a from dual")).toContain('unterminatedString');
  });
});

describe('sonlandırıcılar', () => {
  it('sondaki noktalı virgülü siler', () => {
    expect(fix('select 1 from dual;')).toBe('select 1 from dual');
  });

  it('SQL*Plus çalıştırıcısını siler', () => {
    expect(fix('select 1 from dual;\n/')).toBe('select 1 from dual');
  });

  it('bölme işlemine dokunmaz', () => {
    expect(rules('select a / b from dual')).toEqual([]);
  });

  it('metin içindeki noktalı virgüle dokunmaz', () => {
    expect(rules("select 'a;' from dual")).toEqual([]);
  });
});

describe('sözdizimi', () => {
  it('FROM öncesi fazla virgülü siler', () => {
    expect(fix('select a, b, from t')).toBe('select a, b from t');
  });

  it('kapanış parantezi öncesi fazla virgülü siler', () => {
    expect(fix('select nvl(a, 0,) from t')).toBe('select nvl(a, 0) from t');
  });

  it('yapışmış anahtar kelimeye boşluk koyar', () => {
    expect(fix('select * from siparisWHERE x = 1')).toBe('select * from siparis WHERE x = 1');
  });

  it('BY gelmeyen ORDER’ı yan tümce sanmaz', () => {
    // WORKORDER bir kolon adı olabilir; ORDER ancak BY ile yan tümcedir.
    expect(rules('select workorder from t')).toEqual([]);
  });

  it('alt çizgiden sonraki anahtar kelimeyi bölmez', () => {
    expect(rules('select siparis_where from t')).toEqual([]);
  });

  it('karşılaştırmadaki çift tırnağı metne çevirir', () => {
    expect(fix('select * from t where ad = "Ali"')).toBe("select * from t where ad = 'Ali'");
  });

  it('tırnaklı kolon adına dokunmaz', () => {
    expect(rules('select "Kolon Adı" from t')).toEqual([]);
  });

  it('metne çevirirken içerideki tek tırnağı kaçırır', () => {
    expect(fix(`select * from t where ad = "O'Brien"`)).toBe(`select * from t where ad = 'O''Brien'`);
  });

  it('tablo takma adındaki AS’i siler', () => {
    expect(fix('select * from siparis AS s')).toBe('select * from siparis s');
  });

  it('JOIN sonrası AS’i de siler', () => {
    expect(fix('select * from a x inner join b AS y on x.id = y.id')).toBe(
      'select * from a x inner join b y on x.id = y.id',
    );
  });

  it('kolon takma adındaki AS’e dokunmaz', () => {
    expect(rules('select a AS b from t')).toEqual([]);
  });

  it('WITH … AS ( yapısına dokunmaz', () => {
    expect(rules('with x as (select 1 from dual) select * from x')).toEqual([]);
  });
});

describe('SQL Server → Oracle', () => {
  it('köşeli parantezi kaldırır', () => {
    expect(fix('select [ad] from [Siparis]')).toBe('select ad from Siparis');
  });

  it('boşluk içeren adı çift tırnağa çevirir', () => {
    expect(fix('select [Kolon Adi] from t')).toBe('select "Kolon Adi" from t');
  });

  it('@ parametresini : yapar', () => {
    expect(fix('select * from t where id = @id')).toBe('select * from t where id = :id');
  });

  it('veri bağlantısına dokunmaz', () => {
    expect(rules('select * from siparis@uzak')).toEqual([]);
  });

  it('doğrudan karşılığı olan fonksiyonları çevirir', () => {
    expect(fix('select isnull(a, 0), len(b), getdate() from t')).toBe(
      'select NVL(a, 0), LENGTH(b), SYSDATE from t',
    );
  });

  it('birebir çevrilemeyen fonksiyonu düzeltmez, önerir', () => {
    const found = findings('select charindex(a, b) from t')[0];
    expect(found?.rule).toBe('tsqlNoEquivalent');
    expect(found?.edits).toEqual([]);
    expect(found?.detail).toContain('INSTR(metin, aranan)');
  });

  it('metin birleştirmesini || yapar', () => {
    expect(fix("select ad + ' ' + soyad from t")).toBe("select ad || ' ' || soyad from t");
  });

  it('sayısal toplamaya dokunmaz', () => {
    expect(rules('select a + b from t')).toEqual([]);
  });
});

describe('sayfalama', () => {
  it('TOP’u ROWNUM sarmalayıcısına çevirir', () => {
    expect(fix('select top 10 a from t order by a')).toBe(
      'SELECT * FROM (\nselect a from t order by a\n) WHERE ROWNUM <= 10',
    );
  });

  it('alt sorgudaki TOP’u sarmaz, yalnızca bildirir', () => {
    // Dış sorguyu sarmak çalışan ama YANLIŞ satırları döndüren bir sorgu
    // üretirdi.
    const found = findings('select * from (select top 5 a from t) x').find(
      (item) => item.rule === 'topClause',
    );
    expect(found?.edits).toEqual([]);
  });

  it('TOP … PERCENT’e dokunmaz', () => {
    expect(rules('select top 10 percent a from t')).toEqual([]);
  });

  it('OFFSET/FETCH’i iç içe ROWNUM sayfalamasına çevirir', () => {
    expect(fix('select a from t order by a offset 20 rows fetch next 10 rows only')).toBe(
      [
        'SELECT * FROM (',
        '  SELECT sub.*, ROWNUM rnum FROM (',
        'select a from t order by a ',
        '  ) sub WHERE ROWNUM <= 30',
        ') WHERE rnum > 20',
      ].join('\n'),
    );
  });

  it('bağlama değişkenli sayfalamada toplamı ifade olarak yazar', () => {
    expect(fix('select a from t offset :bas rows fetch next :adet rows only')).toContain(
      'ROWNUM <= :bas + :adet',
    );
  });

  it('FETCH olmadan yalnız OFFSET de çevrilir', () => {
    expect(fix('select a from t offset 20 rows')).toBe(
      ['SELECT * FROM (', '  SELECT sub.*, ROWNUM rnum FROM (', 'select a from t ', '  ) sub', ') WHERE rnum > 20'].join('\n'),
    );
  });

  it('sarmalayıcı sondaki noktalı virgülün DIŞINA yazılır', () => {
    // İçeride kalsaydı düzeltilmiş sorgu yine çalışmazdı.
    expect(fix('select top 3 a from t;')).toBe('SELECT * FROM (\nselect a from t\n) WHERE ROWNUM <= 3');
  });
});

describe('applyFixes', () => {
  it('dışlanan bulgunun düzeltmesini uygulamaz', () => {
    const sql = 'select a, b, from t;';
    const all = findings(sql);
    const semicolon = all.find((item) => item.rule === 'trailingSemicolon');

    expect(applyFixes(sql, all, new Set([semicolon!.id]))).toBe('select a, b from t;');
  });

  it('birden çok düzeltmeyi birlikte uygular', () => {
    expect(fix('SQL> select [ad] from siparis AS s where id = @id;')).toBe(
      'select ad from siparis s where id = :id',
    );
  });

  it('çakışan düzeltmeleri karıştırmaz', () => {
    const sql = 'select 1 from dual';
    const overlapping: Finding[] = [
      { id: 'a', rule: 'extraComma', severity: 'error', start: 0, end: 6, position: '1:1', edits: [{ start: 0, end: 6, text: 'SELECT' }] },
      { id: 'b', rule: 'extraComma', severity: 'error', start: 2, end: 4, position: '1:3', edits: [{ start: 2, end: 4, text: 'XX' }] },
    ];
    // İkincisi atlanır; ikisini birden uygulamak hiçbirinin kastetmediği
    // bir metin üretirdi.
    expect(applyFixes(sql, overlapping)).toBe('SELECT 1 from dual');
  });

  it('düzeltmesi olmayan bulgu sayılmaz', () => {
    const all = findings('select nvl(a, 0 from dual');
    expect(fixableCount(all)).toBe(0);
  });
});

describe('analyze', () => {
  it('boş girdi hata döner', () => {
    expect(analyze('   ')).toEqual({ ok: false, error: 'sqlFixEmpty' });
  });

  it('temiz sorguda bulgu yoktur', () => {
    expect(rules('select s.id, s.tarih from siparis s where s.kanal_id = :kanal order by s.tarih')).toEqual([]);
  });

  it('bulguları konuma göre sıralar', () => {
    const positions = findings('select [a] from t AS x where id = @id').map((item) => item.start);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
