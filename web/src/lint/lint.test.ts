import { describe, expect, it } from 'vitest';
import { applyFixes, buildContext, patternRule } from './engine';
import { scanSql } from './sql';
import { scanCSharp } from './csharp';
import { positionOf, type Finding } from './types';

/**
 * Motorun kendisi — kural tablolarından bağımsız. Buradaki bir hata her
 * lint aracında birden görünür.
 */

describe('scanSql', () => {
  it('metin, tanımlayıcı ve yorumu koddan ayırır', () => {
    const { spans } = scanSql(`select 'a--b' /* x */ from t -- son`);
    expect(spans.filter((span) => span.kind === 'string')).toHaveLength(1);
    expect(spans.filter((span) => span.kind === 'comment')).toHaveLength(2);
  });

  it('ikiye katlanmış tırnak kaçıştır, kapanış değil', () => {
    const source = `select 'it''s' from t`;
    const { spans, unterminated } = scanSql(source);
    expect(unterminated).toBeNull();
    const literal = spans.find((span) => span.kind === 'string');
    expect(source.slice(literal!.start, literal!.end)).toBe("'it''s'");
  });

  it('kapanmamış tırnağı bildirir', () => {
    expect(scanSql(`select 'a from t`).unterminated).toEqual({ kind: 'string', start: 7 });
  });
});

describe('scanCSharp', () => {
  it('iki bölü satır yorumudur', () => {
    const { spans } = scanCSharp('var x = 1; // yorum\nvar y = 2;');
    expect(spans.filter((span) => span.kind === 'comment')).toHaveLength(1);
  });

  it('ters bölü dizeyi kapatmaz', () => {
    const source = String.raw`var x = "a\"b"; var y = 1;`;
    const literal = scanCSharp(source).spans.find((span) => span.kind === 'string');
    expect(source.slice(literal!.start, literal!.end)).toBe(String.raw`"a\"b"`);
  });

  it('verbatim dizede ters bölü kaçış değildir', () => {
    // @"C:\yol\" olsaydı ters bölü kapanışı yutardı; verbatim'de yutmaz.
    const source = String.raw`var yol = @"C:\tmp\x"; var z = 1;`;
    const literal = scanCSharp(source).spans.find((span) => span.kind === 'string');
    expect(source.slice(literal!.start, literal!.end)).toBe(String.raw`@"C:\tmp\x"`);
  });

  it('verbatim dizede çift tırnak kaçıştır', () => {
    const source = 'var s = @"a""b"; var z = 1;';
    const literal = scanCSharp(source).spans.find((span) => span.kind === 'string');
    expect(source.slice(literal!.start, literal!.end)).toBe('@"a""b"');
  });

  it('enterpolasyon ön eki dizeyi bozmaz', () => {
    const source = 'var s = $"deger: {x}"; var z = 1;';
    const literal = scanCSharp(source).spans.find((span) => span.kind === 'string');
    expect(source.slice(literal!.start, literal!.end)).toBe('$"deger: {x}"');
  });

  it('verbatim olmayan dize satır sonunda kapanmamış sayılır', () => {
    expect(scanCSharp('var s = "acik\nvar z = 1;').unterminated?.kind).toBe('string');
  });
});

describe('positionOf', () => {
  it('satır:sütun verir', () => {
    expect(positionOf('bir\niki\nuc', 8)).toBe('3:1');
    expect(positionOf('bir', 0)).toBe('1:1');
  });
});

describe('buildContext', () => {
  const context = (source: string) => buildContext(source, scanSql(source).spans);

  it('parantez derinliğini kodun içinde sayar', () => {
    const result = context("select f(g('(')) from t");
    // Metin içindeki parantez derinliği artırmamalı.
    expect(result.depth[result.source.indexOf('from')]).toBe(0);
  });

  it('ilk anlamlı karakteri bulur', () => {
    expect(context('\n\n  select 1').firstToken).toBe(4);
  });
});

describe('patternRule', () => {
  const rule = patternRule('demo', 'error', /\bfoo\b/g, () => ({ text: 'bar' }));
  const run = (source: string) => rule.run(buildContext(source, scanSql(source).spans));

  it('kod içindeki eşleşmeyi bulur', () => {
    expect(run('select foo from t')).toHaveLength(1);
  });

  it('metin ve yorum içindekini atlar', () => {
    expect(run("select 'foo' from t -- foo")).toEqual([]);
  });

  it('build null dönerse bulgu üretmez', () => {
    const skipping = patternRule('demo', 'error', /\bfoo\b/g, () => null);
    expect(skipping.run(buildContext('foo', scanSql('foo').spans))).toEqual([]);
  });

  it('aynı kalıp iki kez çalıştırılabilir', () => {
    // Global regex'in `lastIndex`i taşınırsa ikinci çağrı eşleşmeleri atlar.
    expect(run('foo foo')).toHaveLength(2);
    expect(run('foo foo')).toHaveLength(2);
  });
});

describe('applyFixes', () => {
  const edit = (id: string, start: number, end: number, text: string): Finding => ({
    id,
    rule: 'demo',
    severity: 'error',
    start,
    end,
    position: '1:1',
    edits: [{ start, end, text }],
  });

  it('düzeltmeleri sondan başa uygular', () => {
    expect(applyFixes('abcdef', [edit('a', 0, 1, 'X'), edit('b', 5, 6, 'Y')])).toBe('XbcdeY');
  });

  it('dışlanan bulguyu atlar', () => {
    expect(applyFixes('abc', [edit('a', 0, 1, 'X')], new Set(['a']))).toBe('abc');
  });

  it('çakışan ikinci bulguyu tamamen atlar', () => {
    // Karıştırmak hiçbirinin kastetmediği bir metin üretirdi.
    expect(applyFixes('abcdef', [edit('a', 0, 3, 'XYZ'), edit('b', 1, 2, 'Q')])).toBe('XYZdef');
  });

  it('aynı noktadaki iki sıfır genişlikli eklemeden birini atlar', () => {
    expect(applyFixes('ab', [edit('a', 0, 0, 'X'), edit('b', 0, 0, 'Y')])).toBe('Xab');
  });

  it('düzeltmesi olmayan bulgu metni değiştirmez', () => {
    const bare: Finding = { ...edit('a', 0, 1, 'X'), edits: [] };
    expect(applyFixes('abc', [bare])).toBe('abc');
  });
});
