import { describe, expect, it } from 'vitest';
import { XmlParseError, decodeEntities, isValidXmlName, parseXml } from './xml';
import { convertXmlJson, type XmlJsonOptions } from './xmlJson';

const base: XmlJsonOptions = { direction: 'toJson', attributes: true, inferTypes: true, indent: 2 };

const run = (input: string, options: Partial<XmlJsonOptions> = {}) => {
  const result = convertXmlJson(input, { ...base, ...options });
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error} ${result.detail ?? ''}`);
  return result.value;
};

const toObject = (input: string, options: Partial<XmlJsonOptions> = {}) =>
  JSON.parse(run(input, options)) as Record<string, unknown>;

describe('decodeEntities', () => {
  it.each([
    ['&amp;', '&'],
    ['&lt;a&gt;', '<a>'],
    ['&quot;x&quot;', '"x"'],
    ['&apos;', "'"],
    ['&#65;', 'A'],
    ['&#x41;', 'A'],
    ['&#x1F600;', '😀'],
  ])('%j → %j', (input, expected) => {
    expect(decodeEntities(input)).toBe(expected);
  });

  it('tanımadığı varlığı olduğu gibi bırakır', () => {
    // Sessizce silmek veriyi kaybettirir; ham hâli bırakmak sorunu görünür kılar.
    expect(decodeEntities('&nbsp;')).toBe('&nbsp;');
  });

  it('geçersiz kod noktasına dokunmaz', () => {
    expect(decodeEntities('&#0;')).toBe('&#0;');
    expect(decodeEntities('&#x110000;')).toBe('&#x110000;');
  });
});

describe('isValidXmlName', () => {
  it.each([
    ['kitap', true],
    ['ns:kitap', true],
    ['_x', true],
    ['kitap-id', true],
    ['1kitap', false],
    ['', false],
    ['a b', false],
    ['@id', false],
  ])('%j → %s', (name, expected) => {
    expect(isValidXmlName(name)).toBe(expected);
  });
});

describe('parseXml', () => {
  it('öznitelik sırasını korur', () => {
    const root = parseXml('<a z="1" y="2" />');
    expect(root.attributes).toEqual([
      ['z', '1'],
      ['y', '2'],
    ]);
  });

  it('yorum, işlem yönergesi ve DOCTYPE atlar', () => {
    const root = parseXml('<?xml version="1.0"?><!DOCTYPE a><!-- not --><a>x</a>');
    expect(root.name).toBe('a');
  });

  it('DOCTYPE iç kümesindeki > işaretini kök sanmaz', () => {
    const root = parseXml('<!DOCTYPE a [ <!ELEMENT a (#PCDATA)> ]><a>x</a>');
    expect(root.name).toBe('a');
  });

  it('CDATA içeriğini kaçış çözmeden alır', () => {
    const root = parseXml('<a><![CDATA[x & y < z]]></a>');
    expect(root.children[0]).toEqual({ kind: 'text', value: 'x & y < z', cdata: true });
  });

  it.each([
    ['<a>', '<a> is never closed'],
    ['<a></b>', '</b> closes <a>'],
    ['<a x=1 />', 'attribute "x" is not quoted'],
    ['<a x />', 'attribute "x" has no value'],
    ['<a x="1" x="2" />', 'duplicate attribute "x"'],
    ['metin', 'no root element found'],
    ['<a/><b/>', '2 root elements — XML allows one'],
    ['<a><!-- açık', 'unterminated comment'],
  ])('%j → %s', (input, message) => {
    expect(() => parseXml(input)).toThrow(message);
  });

  it('hatanın satır ve sütununu bildirir', () => {
    try {
      parseXml('<a>\n  <b>\n</a>');
      expect.unreachable('hata bekleniyordu');
    } catch (error) {
      expect(error).toBeInstanceOf(XmlParseError);
      expect((error as XmlParseError).position).toBe('3:1');
    }
  });
});

describe('convertXmlJson — XML → JSON', () => {
  it('sadece metin içeren elemanı düz değere indirger', () => {
    expect(toObject('<ad>Örnek</ad>')).toEqual({ ad: 'Örnek' });
  });

  it('öznitelikleri @ önekiyle korur', () => {
    expect(toObject('<a id="5">x</a>')).toEqual({ a: { '@id': 5, '#text': 'x' } });
  });

  it('öznitelikler kapalıyken onları atar', () => {
    expect(toObject('<a id="5">x</a>', { attributes: false })).toEqual({ a: 'x' });
  });

  it('tekrar eden çocuğu diziye çevirir', () => {
    expect(toObject('<r><t>a</t><t>b</t></r>')).toEqual({ r: { t: ['a', 'b'] } });
  });

  it('tek örnekte dizi üretmez', () => {
    // XML'de çokluk şemada durur, belgede değil — tahmin etmiyoruz.
    expect(toObject('<r><t>a</t></r>')).toEqual({ r: { t: 'a' } });
  });

  it('boş elemanı boş metin yapar', () => {
    expect(toObject('<r><t/></r>')).toEqual({ r: { t: '' } });
  });

  it('tip çıkarımı sayı ve bool üretir', () => {
    expect(toObject('<r><n>42</n><f>1.5</f><b>true</b><z>null</z></r>')).toEqual({
      r: { n: 42, f: 1.5, b: true, z: null },
    });
  });

  it('baştaki sıfırı koruyup metin bırakır', () => {
    expect(toObject('<r><k>00123</k></r>')).toEqual({ r: { k: '00123' } });
  });

  /* Uzun kimlik numaraları JavaScript sayısına sığmıyor; sayıya çevirmek
     sessizce yuvarlar. TCKN 11 hane, ama aynı alan 19 haneli bir Oracle
     dizisi de taşıyabiliyor — kural değerin kendisine bakıyor. */
  it('güvenli aralığın dışındaki tam sayıyı metin bırakır', () => {
    expect(toObject('<r><k>11111111111111111111</k></r>')).toEqual({
      r: { k: '11111111111111111111' },
    });
  });

  it('güvenli aralıktaki tam sayıyı çevirir', () => {
    expect(toObject('<r><k>11111111110</k></r>')).toEqual({ r: { k: 11_111_111_110 } });
  });

  it('yuvarlanacak ondalığı metin bırakır', () => {
    expect(toObject('<r><k>0.1000000000000000055511151231257827</k></r>')).toEqual({
      r: { k: '0.1000000000000000055511151231257827' },
    });
  });

  it('tip çıkarımı kapalıyken her şey metindir', () => {
    expect(toObject('<r><n>42</n></r>', { inferTypes: false })).toEqual({ r: { n: '42' } });
  });

  it('girintiden gelen boşluğu veri saymaz', () => {
    expect(toObject('<r>\n  <t>a</t>\n</r>')).toEqual({ r: { t: 'a' } });
  });

  it('bozuk XML için konum bildirir', () => {
    const result = convertXmlJson('<a><b></a>', base);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('xmlInvalid');
      expect(result.detail).toContain('1:');
    }
  });
});

describe('convertXmlJson — JSON → XML', () => {
  const toXml = (json: string) => run(json, { direction: 'toXml' });

  it('tek kök anahtarını kök eleman yapar', () => {
    expect(toXml('{"a":"x"}')).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<a>x</a>');
  });

  it('@ önekli anahtarı özniteliğe çevirir', () => {
    expect(toXml('{"a":{"@id":5,"#text":"x"}}')).toContain('<a id="5">x</a>');
  });

  it('diziyi tekrar eden eleman yapar', () => {
    expect(toXml('{"r":{"t":["a","b"]}}')).toContain('<t>a</t>\n  <t>b</t>');
  });

  it('birden fazla kök anahtarını <root> ile sarar', () => {
    expect(toXml('{"a":1,"b":2}')).toContain('<root>');
  });

  it('boş nesneyi kendinden kapanan etiket yapar', () => {
    expect(toXml('{"a":{}}')).toContain('<a />');
  });

  it('metni ve öznitelik değerini kaçırır', () => {
    const xml = toXml('{"a":{"@t":"\\"x\\"","#text":"a & b < c"}}');
    expect(xml).toContain('t="&quot;x&quot;"');
    expect(xml).toContain('a &amp; b &lt; c');
  });

  it('XML adı olamayacak anahtarı reddeder', () => {
    const result = convertXmlJson('{"1a":2}', { ...base, direction: 'toXml' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('xmlBadName');
      expect(result.detail).toBe('1a');
    }
  });

  it('kök dizi ya da skaler reddedilir', () => {
    for (const input of ['[1,2]', '"x"', '5', 'null']) {
      const result = convertXmlJson(input, { ...base, direction: 'toXml' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('xmlRootShape');
    }
  });
});

describe('convertXmlJson — gidiş dönüş', () => {
  it('XML → JSON → XML aynı yapıyı verir', () => {
    const source = '<siparis id="5"><t kod="A">x</t><t kod="B">y</t></siparis>';
    const json = run(source);
    const back = run(json, { direction: 'toXml' });
    expect(back).toContain('<siparis id="5">');
    expect(back).toContain('<t kod="A">x</t>');
    expect(back).toContain('<t kod="B">y</t>');
  });
});

describe('convertXmlJson — boş girdi', () => {
  it.each([
    ['toJson' as const, 'xmlEmpty'],
    ['toXml' as const, 'jsonEmpty'],
  ])('%s → %s', (direction, expected) => {
    const result = convertXmlJson('   ', { ...base, direction });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(expected);
  });
});
