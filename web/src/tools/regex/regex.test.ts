import { describe, expect, it } from 'vitest';
import {
  EMPTY_FLAGS,
  analyzeFlavour,
  replacePreview,
  runJsRegex,
  toJsFlags,
  type RegexFlags,
} from './regex';

const flags = (overrides: Partial<RegexFlags> = {}): RegexFlags => ({ ...EMPTY_FLAGS, ...overrides });

const run = (pattern: string, input: string, overrides: Partial<RegexFlags> = {}) => {
  const result = runJsRegex(pattern, flags(overrides), input);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error} ${result.detail ?? ''}`);
  return result.value;
};

describe('toJsFlags', () => {
  it('g ve d her zaman açıktır', () => {
    // `d` olmadan grup konumu yok, `g` olmadan tek eşleşme gelir.
    expect(toJsFlags(EMPTY_FLAGS)).toBe('gd');
  });

  it('seçilen bayrakları ekler', () => {
    expect(toJsFlags(flags({ ignoreCase: true, multiline: true, dotAll: true, unicode: true }))).toBe(
      'gdimsu',
    );
  });
});

describe('runJsRegex', () => {
  it('tüm eşleşmeleri konumlarıyla verir', () => {
    const { matches } = run(String.raw`\d+`, 'a12 b345');
    expect(matches.map((match) => [match.value, match.index])).toEqual([
      ['12', 1],
      ['345', 5],
    ]);
  });

  it('numaralı grupları sırayla verir', () => {
    const { matches } = run(/(\w)(\d)/.source, 'a1');
    expect(matches[0]!.groups.map((group) => [group.name, group.value])).toEqual([
      ['1', 'a'],
      ['2', '1'],
    ]);
  });

  it('adlandırılmış grupları adıyla verir', () => {
    const { matches } = run(String.raw`(?<yil>\d{4})-(?<ay>\d{2})`, '2026-08');
    expect(matches[0]!.groups.map((group) => group.name)).toEqual(['yil', 'ay']);
  });

  it('yakalanmayan grubu null bırakır', () => {
    // "yakalanmadı" ile "boş yakalandı" farklı şeyler.
    const { matches } = run('(a)|(b)', 'a');
    expect(matches[0]!.groups.map((group) => group.value)).toEqual(['a', null]);
  });

  it('grup konumunu bildirir', () => {
    const { matches } = run(String.raw`x(\d+)`, 'ax42');
    expect(matches[0]!.groups[0]!.index).toBe(2);
  });

  it('ignoreCase bayrağını uygular', () => {
    expect(run('abc', 'ABC', { ignoreCase: true }).matches).toHaveLength(1);
    expect(run('abc', 'ABC').matches).toHaveLength(0);
  });

  it('multiline bayrağını uygular', () => {
    expect(run('^b', 'a\nb', { multiline: true }).matches).toHaveLength(1);
    expect(run('^b', 'a\nb').matches).toHaveLength(0);
  });

  it('sıfır uzunluklu eşleşmede takılmaz', () => {
    const { matches } = run('a*', 'bb');
    expect(matches.length).toBeLessThan(10);
  });

  it('500 eşleşmeden sonra keser', () => {
    const { matches, truncated } = run('a', 'a'.repeat(600));
    expect(matches).toHaveLength(500);
    expect(truncated).toBe(true);
  });

  it('boş deseni reddeder', () => {
    const result = runJsRegex('', EMPTY_FLAGS, 'x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('regexEmpty');
  });

  it('geçersiz deseni motorun mesajıyla reddeder', () => {
    const result = runJsRegex('(unclosed', EMPTY_FLAGS, 'x');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('regexInvalid');
      expect(result.detail).toBeTruthy();
    }
  });
});

describe('replacePreview', () => {
  it('numaralı geri başvuru', () => {
    const result = replacePreview(String.raw`(\w+)@(\w+)`, EMPTY_FLAGS, 'ali@site', '$2:$1');
    expect(result.ok && result.value).toBe('site:ali');
  });

  it('adlandırılmış geri başvuru', () => {
    const result = replacePreview(String.raw`(?<ad>\w+)`, EMPTY_FLAGS, 'ali', '[$<ad>]');
    expect(result.ok && result.value).toBe('[ali]');
  });

  it('geçersiz desende hata anahtarı verir', () => {
    const result = replacePreview('(', EMPTY_FLAGS, 'x', 'y');
    expect(result.ok).toBe(false);
  });
});

describe('analyzeFlavour', () => {
  const keys = (pattern: string, overrides: Partial<RegexFlags> = {}) =>
    analyzeFlavour(pattern, flags(overrides)).map((note) => note.key);

  it.each([
    [String.raw`(?<open>\()+(?<-open>\))+`, 'balancingGroup'],
    ['(?(open)(?!))', 'conditional'],
    ['(?i)abc', 'inlineOptions'],
    [String.raw`\Aabc\z`, 'anchors'],
    [String.raw`(?'ad'\w+)`, 'quotedGroupName'],
  ])('%j → yalnızca .NET: %s', (pattern, key) => {
    const notes = analyzeFlavour(pattern, EMPTY_FLAGS);
    const note = notes.find((entry) => entry.key === key);
    expect(note?.side).toBe('dotnetOnly');
  });

  it.each([
    [String.raw`\d+`, 'digitUnicode'],
    [String.raw`\w+`, 'wordUnicode'],
    ['abc$', 'dollarNewline'],
    [String.raw`\p{L}+`, 'unicodeCategory'],
  ])('%j → davranış farkı: %s', (pattern, key) => {
    const note = analyzeFlavour(pattern, EMPTY_FLAGS).find((entry) => entry.key === key);
    expect(note?.side).toBe('differs');
  });

  it('sade desende not üretmez', () => {
    expect(keys('abc')).toEqual([]);
  });

  /* .NET'te IgnoreCase geçerli kültürü kullanır; tr-TR altında `I` ile `i`
     eşleşmez. Yalnızca risk gerçekten varken uyarıyoruz. */
  it('IgnoreCase + i/I harfi Türkçe uyarısı doğurur', () => {
    expect(keys('file', { ignoreCase: true })).toContain('turkishCase');
  });

  it('CultureInvariant seçiliyken Türkçe uyarısı çıkmaz', () => {
    expect(keys('file', { ignoreCase: true, cultureInvariant: true })).not.toContain('turkishCase');
  });

  it('i/I harfi yoksa Türkçe uyarısı çıkmaz', () => {
    expect(keys('abc', { ignoreCase: true })).not.toContain('turkishCase');
  });
});
