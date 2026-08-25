import { describe, expect, it } from 'vitest';
import { detectLanguage, formatCode, type FormatOptions } from './codeFormat';

const base: FormatOptions = { language: null, mode: 'format', indent: 2 };

const run = (source: string, options: Partial<FormatOptions> = {}) => {
  const result = formatCode(source, { ...base, ...options });
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error} ${result.detail ?? ''}`);
  return result.value;
};

describe('detectLanguage', () => {
  it.each([
    ['{"a":1}', 'json'],
    ['[1,2]', 'json'],
    ['<?xml version="1.0"?><a/>', 'xml'],
    ['<siparis><t/></siparis>', 'xml'],
    ['<!doctype html><html></html>', 'html'],
    ['<div class="x">y</div>', 'html'],
    ['a { color: red; }', 'css'],
    ['@media print { a { color: red } }', 'css'],
  ])('%j → %s', (source, expected) => {
    expect(detectLanguage(source)).toBe(expected);
  });

  it('tanıyamadığında null döner', () => {
    expect(detectLanguage('sadece düz metin')).toBeNull();
    expect(detectLanguage('   ')).toBeNull();
  });

  it('tanınmayan girdi hata anahtarı verir', () => {
    const result = formatCode('düz metin', base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('formatUnknownLanguage');
  });
});

describe('JSON', () => {
  it('girintiler', () => {
    expect(run('{"a":1,"b":[2,3]}').text).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it('küçültür', () => {
    expect(run('{\n  "a": 1\n}', { mode: 'minify' }).text).toBe('{"a":1}');
  });

  it('bozuk JSON için ayrıntı verir', () => {
    const result = formatCode('{"a":}', base);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('jsonInvalid');
      expect(result.detail).toBeTruthy();
    }
  });
});

describe('XML', () => {
  it('girintiler ve bildirimi korur', () => {
    const out = run('<?xml version="1.0"?><siparis><t>x</t></siparis>').text;
    expect(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(out).toContain('  <t>x</t>');
  });

  it('bildirim yoksa eklemez', () => {
    expect(run('<siparis><t>x</t></siparis>').text.startsWith('<siparis>')).toBe(true);
  });

  it('küçültür', () => {
    expect(run('<siparis>\n  <t>x</t>\n</siparis>', { mode: 'minify' }).text).toBe('<siparis><t>x</t></siparis>');
  });

  it('küçültmede boş elemanı kendinden kapanan yapar', () => {
    expect(run('<siparis><t></t></siparis>', { mode: 'minify' }).text).toBe('<siparis><t/></siparis>');
  });

  /* Sezgi belirsiz etiketlerde HTML'den yana: `<a>` bir bağlantı etiketi
     olabilir. XML olduğundan eminsen dili elle seçmek gerekiyor — bu yüzden
     dil seçici "otomatik"e kilitli değil. */
  it('belirsiz etiket adında HTML seçer', () => {
    expect(detectLanguage('<a><b>x</b></a>')).toBe('html');
    expect(run('<a><b></b></a>', { language: 'xml', mode: 'minify' }).text).toBe('<a><b/></a>');
  });
});

describe('HTML', () => {
  it('girintiler', () => {
    const out = run('<div><p>merhaba</p></div>', { language: 'html' }).text;
    expect(out).toBe('<div>\n  <p>merhaba</p>\n</div>');
  });

  it('kapanışsız etiketi girinti derinliğine katmaz', () => {
    const out = run('<div><br><img src="a.png"><span>x</span></div>', { language: 'html' }).text;
    expect(out).toBe('<div>\n  <br>\n  <img src="a.png">\n  <span>x</span>\n</div>');
  });

  it('öznitelik içindeki > işaretini etiket sonu sanmaz', () => {
    const out = run('<div title="a > b"><p>x</p></div>', { language: 'html' }).text;
    expect(out).toContain('<div title="a > b">');
  });

  it('script içeriğini ayrıştırmaz', () => {
    // `a < b` içindeki `<` etiket başlangıcı değil.
    const out = run('<script>if (a < b) { f(); }</script>', { language: 'html' }).text;
    expect(out).toContain('if (a < b) { f(); }');
  });

  it('yorumu korur', () => {
    expect(run('<div><!-- not --></div>', { language: 'html' }).text).toContain('<!-- not -->');
  });

  it('küçültmede etiketler arası boşluğu atar', () => {
    const out = run('<div>\n  <p>x</p>\n</div>', { language: 'html', mode: 'minify' }).text;
    expect(out).toBe('<div><p>x</p></div>');
  });

  it('küçültmede yorumu siler', () => {
    expect(run('<div><!-- x --><p>y</p></div>', { language: 'html', mode: 'minify' }).text).toBe(
      '<div><p>y</p></div>',
    );
  });
});

describe('CSS', () => {
  it('girintiler ve iki nokta sonrasına boşluk koyar', () => {
    expect(run('a{color:red;background:blue}', { language: 'css' }).text).toBe(
      'a {\n  color: red;\n  background: blue;\n}',
    );
  });

  it('iç içe blokları girintiler', () => {
    const out = run('@media print{a{color:red}}', { language: 'css' }).text;
    expect(out).toBe('@media print {\n  a {\n    color: red;\n  }\n\n}');
  });

  it('virgüllü seçicileri alt alta yazar', () => {
    expect(run('a,b{color:red}', { language: 'css' }).text).toBe('a,\nb {\n  color: red;\n}');
  });

  it('url() içindeki iki nokta ve noktalı virgülü bölmez', () => {
    const out = run('a{background:url(data:image/png;base64,AAA)}', { language: 'css' }).text;
    expect(out).toContain('background: url(data:image/png;base64,AAA);');
  });

  it('dize içindeki süslü parantezi blok sanmaz', () => {
    const out = run('a{content:"}"}', { language: 'css' }).text;
    expect(out).toBe('a {\n  content: "}";\n}');
  });

  it('yorumu korur, küçültmede siler', () => {
    expect(run('/* not */a{color:red}', { language: 'css' }).text).toContain('/* not */');
    expect(run('/* not */a{color:red}', { language: 'css', mode: 'minify' }).text).toBe('a{color:red}');
  });

  it('küçültmede son noktalı virgülü atar', () => {
    expect(run('a { color: red; background: blue; }', { language: 'css', mode: 'minify' }).text).toBe(
      'a{color:red;background:blue}',
    );
  });
});

describe('boş girdi', () => {
  it('hata anahtarı döner', () => {
    const result = formatCode('   ', base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('jsonEmpty');
  });
});
