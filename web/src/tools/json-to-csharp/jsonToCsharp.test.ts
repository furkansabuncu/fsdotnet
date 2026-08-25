import { describe, expect, it } from 'vitest';
import { generateTypes, toPascalCase, type GenerateOptions } from './jsonToCsharp';

const base: GenerateOptions = {
  target: 'record',
  rootName: 'Root',
  pascalCase: true,
  nullableRefTypes: true,
  fraction: 'decimal',
};

const gen = (json: string, options: Partial<GenerateOptions> = {}) => {
  const result = generateTypes(json, { ...base, ...options });
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('toPascalCase', () => {
  it.each([
    ['kitap_id', 'KitapId'],
    ['ekleme-tarihi', 'EklemeTarihi'],
    ['adSoyad', 'AdSoyad'],
    ['XMLHttpRequest', 'XMLHttpRequest'],
    ['id', 'Id'],
    ['  ', 'Value'],
  ])('%j → %j', (input, expected) => {
    expect(toPascalCase(input)).toBe(expected);
  });

  /* Türkçe yerel ayarda `id`.toLocaleUpperCase('tr') → `İD` olur. JS'in
     locale'siz toUpperCase()'i bundan etkilenmez; C# tanımlayıcısı için
     doğru olan da bu. */
  it('Türkçe yerel ayardan etkilenmez', () => {
    expect(toPascalCase('imza_id')).toBe('ImzaId');
  });
});

describe('generateTypes — skaler tipler', () => {
  it('tam sayı int, büyük sayı long olur', () => {
    const code = gen('{"a":42,"b":9999999999}');
    expect(code).toContain('public int A { get; init; }');
    expect(code).toContain('public long B { get; init; }');
  });

  it('ondalık için seçilen tipi kullanır', () => {
    expect(gen('{"a":1.5}')).toContain('public decimal A');
    expect(gen('{"a":1.5}', { fraction: 'double' })).toContain('public double A');
  });

  it('GUID ve ISO tarihini tanır', () => {
    const code = gen('{"g":"3f2504e0-4f89-41d3-9a0c-0305e82c3301","d":"2026-08-24T09:30:00Z"}');
    expect(code).toContain('public Guid G');
    expect(code).toContain('public DateTime D');
  });

  it('tarihe benzemeyen metni tarihe çevirmez', () => {
    expect(gen('{"d":"24 Ağustos"}')).toContain('public string D');
  });

  it('aynı alan hem GUID hem düz metinse string\'e düşer', () => {
    const code = gen('[{"k":"3f2504e0-4f89-41d3-9a0c-0305e82c3301"},{"k":"abc"}]');
    expect(code).toContain('public string K');
  });
});

describe('generateTypes — nullable', () => {
  it('null görülen referans tipine ? ekler', () => {
    expect(gen('{"a":null,"b":"x"}', { nullableRefTypes: true })).toContain('public object? A');
  });

  it('NRT kapalıyken referans tipine ? eklemez ama değer tipine ekler', () => {
    const code = gen('[{"s":"x","n":1},{"s":null,"n":null}]', { nullableRefTypes: false });
    expect(code).toContain('public string S');
    expect(code).not.toContain('public string? S');
    expect(code).toContain('public int? N');
  });

  it('dizideki bazı nesnelerde eksik olan alanı isteğe bağlı sayar', () => {
    const code = gen('{"list":[{"a":1},{"a":1,"b":2}]}');
    expect(code).toContain('public int? B');
  });
});

describe('generateTypes — yapı', () => {
  it('iç içe nesne için ayrı tip üretir ve kökü en üste koyar', () => {
    const code = gen('{"raf":{"no":"P-1"}}', { rootName: 'KitapDto' });
    expect(code.indexOf('record KitapDto')).toBeLessThan(code.indexOf('record Raf'));
    expect(code).toContain('public Raf Raf { get; init; }');
  });

  it('dizi adını tekilleştirir', () => {
    expect(gen('{"etiketler":[{"kod":"A"}]}')).toContain('record Etiketler');
    expect(gen('{"items":[{"kod":"A"}]}')).toContain('record Item');
  });

  it('aynı ada sahip ikinci tipi numaralandırır', () => {
    const code = gen('{"a":{"adres":{"il":"Ankara"}},"b":{"adres":{"kod":34}}}');
    expect(code).toContain('record Adres');
    expect(code).toContain('record Adres2');
  });

  it('class hedefinde init yerine set kullanır', () => {
    expect(gen('{"a":1}', { target: 'class' })).toContain('public int A { get; set; }');
  });
});

describe('generateTypes — JsonPropertyName', () => {
  it('ad değiştiğinde öznitelik ekler', () => {
    const code = gen('{"kitap_id":1}');
    expect(code).toContain('[JsonPropertyName("kitap_id")]');
    expect(code).toContain('using System.Text.Json.Serialization;');
  });

  it('ad zaten aynıysa öznitelik eklemez', () => {
    expect(gen('{"Ad":"x"}')).not.toContain('JsonPropertyName');
  });

  it('pascalCase kapalıyken anahtarı olduğu gibi kullanır', () => {
    const code = gen('{"kitap_id":1}', { pascalCase: false });
    expect(code).toContain('public int kitap_id');
    expect(code).not.toContain('JsonPropertyName');
  });

  it('C# anahtar kelimesini @ ile kaçırır', () => {
    expect(gen('{"class":1}', { pascalCase: false })).toContain('public int @class');
  });
});

describe('generateTypes — TypeScript', () => {
  it('anahtarı olduğu gibi bırakır', () => {
    const code = gen('{"kitap_id":1}', { target: 'typescript' });
    expect(code).toContain('kitap_id: number;');
  });

  it('null görülen alana birleşim ekler', () => {
    expect(gen('[{"b":2},{"b":null}]', { target: 'typescript' })).toContain('b: number | null;');
  });

  it('eksik alanı ? ile işaretler', () => {
    expect(gen('[{"a":1,"b":2},{"a":1}]', { target: 'typescript' })).toContain('b?: number;');
  });

  it('yalnızca null görülen alana | null eklemez — unknown zaten kapsıyor', () => {
    expect(gen('{"b":null}', { target: 'typescript' })).toContain('b: unknown;');
  });

  it('kök dizide takma ad ile eleman arayüzünün adı çakışmaz', () => {
    const code = gen('[{"a":1}]', { target: 'typescript', rootName: 'Root' });
    expect(code).toContain('export interface RootItem {');
    expect(code).toContain('export type Root = RootItem[];');
  });

  it('çoğul kök adını tekilleştirir', () => {
    const code = gen('[{"a":1}]', { target: 'typescript', rootName: 'Items' });
    expect(code).toContain('export interface Item {');
    expect(code).toContain('export type Items = Item[];');
  });

  /* Tekilleştirme İngilizce kurallarına göre çalışıyor; `Kitaplar` çoğul
     olduğunu bilemez ve `…Item` ekine düşer. Yanlış tekilleştirmektense
     dokunmamak doğru — üretilen ad yine geçerli ve tekil. */
  it('Türkçe çoğulda güvenli eke düşer', () => {
    expect(gen('[{"a":1}]', { target: 'typescript', rootName: 'Kitaplar' })).toContain(
      'export type Kitaplar = KitaplarItem[];',
    );
  });

  it('geçersiz tanımlayıcıyı tırnaklar', () => {
    expect(gen('{"a-b":1}', { target: 'typescript' })).toContain("'a-b': number;");
  });

  it('birleşim içeren dizi tipini parantezler', () => {
    const code = gen('{"list":[1,null]}', { target: 'typescript' });
    expect(code).toContain('list: (number | null)[];');
  });
});

describe('generateTypes — kök dizi', () => {
  it('kök dizi olduğunda tipi bir notla bildirir', () => {
    expect(gen('[{"a":1}]', { rootName: 'Satir' })).toContain('// Root: List<Satir>');
  });
});

describe('generateTypes — hatalar', () => {
  it.each([
    ['', 'jsonEmpty'],
    ['   ', 'jsonEmpty'],
    ['{ bozuk', 'jsonInvalid'],
    ['42', 'jsonNotObject'],
    ['"metin"', 'jsonNotObject'],
    ['null', 'jsonNotObject'],
  ])('%j → %s', (input, expected) => {
    const result = generateTypes(input, base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(expected);
  });
});
