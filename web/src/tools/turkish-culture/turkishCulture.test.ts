import { describe, expect, it } from 'vitest';
import { analyze, type RuleKey } from './turkishCulture';
import { applyFixes } from '../../lint/engine';
import type { Finding } from '../../lint/types';

const findings = (source: string): Finding<RuleKey>[] => {
  const result = analyze(source);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const rules = (source: string): RuleKey[] => findings(source).map((item) => item.rule);
const fix = (source: string): string => applyFixes(source, findings(source));

describe('büyük/küçük harf', () => {
  it('ToUpper() → ToUpperInvariant()', () => {
    // tr-TR altında "file".ToUpper() → FİLE; == "FILE" sessizce başarısız.
    expect(fix('if (ad.ToUpper() == "FILE") { }')).toBe('if (ad.ToUpperInvariant() == "FILE") { }');
  });

  it('ToLower() → ToLowerInvariant()', () => {
    expect(fix('var k = ad.ToLower();')).toBe('var k = ad.ToLowerInvariant();');
  });

  it('kültür açıkça verilmişse susar', () => {
    expect(rules('var k = ad.ToUpper(CultureInfo.InvariantCulture);')).toEqual([]);
  });

  it('zaten Invariant olana dokunmaz', () => {
    expect(rules('var k = ad.ToUpperInvariant();')).toEqual([]);
  });
});

describe('dize arama', () => {
  it('StartsWith’e ordinal ekler', () => {
    expect(fix('if (ad.StartsWith("TR")) { }')).toBe(
      'if (ad.StartsWith("TR", StringComparison.Ordinal)) { }',
    );
  });

  it('EndsWith için de aynı', () => {
    expect(rules('if (ad.EndsWith(".pdf")) { }')).toEqual(['startsEndsWith']);
  });

  it('karşılaştırma zaten yazılmışsa susar', () => {
    expect(rules('if (ad.StartsWith("TR", StringComparison.Ordinal)) { }')).toEqual([]);
  });

  it('IndexOf(string) işaretlenir', () => {
    expect(fix('var i = ad.IndexOf("x");')).toBe('var i = ad.IndexOf("x", StringComparison.Ordinal);');
  });

  it('IndexOf(char) ordinaldir, dokunulmaz', () => {
    // Aynı adın iki aşırı yüklemesi farklı davranıyor; karakter olanı zaten doğru.
    expect(rules("var i = ad.IndexOf('x');")).toEqual([]);
  });
});

describe('sayı ve tarih ayrıştırma', () => {
  it('double.Parse’a invariant ekler', () => {
    expect(fix('var f = double.Parse(metin);')).toBe(
      'var f = double.Parse(metin, CultureInfo.InvariantCulture);',
    );
  });

  it('DateTime.Parse’a invariant ekler', () => {
    expect(fix('var t = DateTime.Parse(metin);')).toBe(
      'var t = DateTime.Parse(metin, CultureInfo.InvariantCulture);',
    );
  });

  it('TryParse bildirilir ama düzeltilmez', () => {
    // Kültürlü aşırı yükleme NumberStyles de istiyor ve `out` sona kayıyor;
    // sona ekleme yapmak derlenmeyen kod üretirdi.
    const found = findings('if (int.TryParse(metin, out var x)) { }')[0];
    expect(found?.rule).toBe('tryParse');
    expect(found?.edits).toEqual([]);
  });

  it('sağlayıcı zaten verilmişse susar', () => {
    expect(rules('var f = double.Parse(metin, CultureInfo.InvariantCulture);')).toEqual([]);
  });
});

describe('biçimlendirme', () => {
  it('ToString("…") sağlayıcı ister', () => {
    expect(fix('var s = tarih.ToString("dd/MM/yyyy");')).toBe(
      'var s = tarih.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);',
    );
  });

  it('argümansız ToString() işaretlenmez', () => {
    // Tipi bilinmeden söylenecek bir şey yok; yanlış alarm üretmemek daha önemli.
    expect(rules('var s = nesne.ToString();')).toEqual([]);
  });

  it('string.Format sağlayıcıyı İLK argüman alır', () => {
    expect(fix('var s = string.Format("{0:N2}", tutar);')).toBe(
      'var s = string.Format(CultureInfo.InvariantCulture, "{0:N2}", tutar);',
    );
  });
});

describe('regex', () => {
  it('IgnoreCase’e CultureInvariant ekler', () => {
    // tr-TR altında I ile i farklı harfler; IgnoreCase kültürü izliyor.
    expect(fix('new Regex(kalip, RegexOptions.IgnoreCase)')).toBe(
      'new Regex(kalip, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)',
    );
  });

  it('zaten CultureInvariant varsa susar', () => {
    expect(rules('new Regex(k, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)')).toEqual([]);
  });
});

describe('bağlam', () => {
  it('yorum ve dize içindekilere dokunmaz', () => {
    expect(rules('// ad.ToUpper() kullanma\nvar s = "ad.ToUpper()";')).toEqual([]);
  });

  it('boş girdi hata döner', () => {
    expect(analyze('   ')).toEqual({ ok: false, error: 'cultureEmpty' });
  });

  it('temiz kodda bulgu yoktur', () => {
    const source = [
      'var kod = ad.ToUpperInvariant();',
      'var f = double.Parse(metin, CultureInfo.InvariantCulture);',
      'if (kod.StartsWith("TR", StringComparison.Ordinal)) { }',
    ].join('\n');
    expect(rules(source)).toEqual([]);
  });
});
