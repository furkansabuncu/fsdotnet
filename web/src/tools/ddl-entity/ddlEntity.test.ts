import { describe, expect, it } from 'vitest';
import { generateEntity, mapType, toPascalCase, type EntityOptions, type EntityResult } from './ddlEntity';

const options: EntityOptions = { pascalCase: true, numberOneAsBool: true };

const run = (ddl: string, patch: Partial<EntityOptions> = {}): EntityResult => {
  const result = generateEntity(ddl, { ...options, ...patch });
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const DDL = [
  'CREATE TABLE siparis (',
  '  siparis_id      NUMBER(9)      NOT NULL,',
  '  kanal_id        NUMBER(4),',
  '  tutar           NUMBER(12,2)   NOT NULL,',
  '  iptal           NUMBER(1)      DEFAULT 0 NOT NULL,',
  '  aciklama        VARCHAR2(400),',
  '  siparis_tarihi  DATE           NOT NULL,',
  '  ek_dosya        BLOB,',
  '  CONSTRAINT pk_siparis PRIMARY KEY (siparis_id)',
  ')',
].join('\n');

describe('toPascalCase', () => {
  it.each([
    ['siparis_kalem', 'SiparisKalem'],
    ['SIPARIS', 'Siparis'],
    ['"Kitap Turu"', 'KitapTuru'],
  ])('%s → %s', (input, expected) => {
    expect(toPascalCase(input)).toBe(expected);
  });
});

describe('mapType — NUMBER hassasiyete göre bölünür', () => {
  it.each([
    [1, 0, 'bool'],
    [4, 0, 'short'],
    [9, 0, 'int'],
    [18, 0, 'long'],
    [30, 0, 'decimal'],
    [12, 2, 'decimal'],
  ])('NUMBER(%s,%s) → %s', (precision, scale, expected) => {
    expect(mapType('NUMBER', precision, scale, options).type).toBe(expected);
  });

  it('NUMBER(1) bool istenmiyorsa short olur', () => {
    expect(mapType('NUMBER', 1, 0, { ...options, numberOneAsBool: false }).type).toBe('short');
  });

  it('hassasiyetsiz NUMBER decimal ve uyarı', () => {
    const mapped = mapType('NUMBER', undefined, undefined, options);
    expect(mapped.type).toBe('decimal');
    expect(mapped.warning?.key).toBe('numberPrecision');
  });

  it.each([
    ['VARCHAR2', 'string'],
    ['NVARCHAR2', 'string'],
    ['CLOB', 'string'],
    ['BLOB', 'byte[]'],
    ['RAW', 'byte[]'],
    ['DATE', 'DateTime'],
    ['TIMESTAMP(6)', 'DateTime'],
    ['TIMESTAMP WITH TIME ZONE', 'DateTimeOffset'],
    ['BINARY_DOUBLE', 'double'],
  ])('%s → %s', (oracle, expected) => {
    expect(mapType(oracle, undefined, undefined, options).type).toBe(expected);
  });

  it('bilinmeyen tip string olur ve uyarır', () => {
    const mapped = mapType('SDO_GEOMETRY', undefined, undefined, options);
    expect(mapped.type).toBe('string');
    expect(mapped.warning?.key).toBe('unknownType');
  });
});

describe('entity üretimi', () => {
  it('property’leri doğru tip ve null’lukla yazar', () => {
    expect(run(DDL).entity).toBe(
      [
        'public class Siparis',
        '{',
        '    public int SiparisId { get; set; }',
        '    public short? KanalId { get; set; }',
        '    public decimal Tutar { get; set; }',
        '    public bool Iptal { get; set; }',
        '    public string? Aciklama { get; set; }',
        '    public DateTime SiparisTarihi { get; set; }',
        '    public byte[]? EkDosya { get; set; }',
        '}',
      ].join('\n'),
    );
  });

  it('NOT NULL yazmayan kolon null kabul edilir', () => {
    const kanal = run(DDL).columns.find((column) => column.name === 'kanal_id');
    expect(kanal?.nullable).toBe(true);
  });

  it('PascalCase kapalıyken ad aynen kalır', () => {
    expect(run(DDL, { pascalCase: false }).entity).toContain('public int siparis_id { get; set; }');
  });
});

describe('mapping üretimi', () => {
  it('tabloyu, anahtarı ve kolon adlarını yazar', () => {
    const config = run(DDL).configuration;
    expect(config).toContain('builder.ToTable("SIPARIS");');
    expect(config).toContain('builder.HasKey(x => x.SiparisId);');
    expect(config).toContain('.HasColumnName("SIPARIS_ID")');
  });

  it('uzunluğu olan metne HasMaxLength ekler', () => {
    expect(run(DDL).configuration).toContain('.HasMaxLength(400)');
  });

  it('satır içi PRIMARY KEY de tanınır', () => {
    const ddl = 'CREATE TABLE t (id NUMBER(9) PRIMARY KEY, ad VARCHAR2(50))';
    expect(run(ddl).configuration).toContain('builder.HasKey(x => x.Id);');
  });

  it('bileşik anahtar anonim tiple yazılır', () => {
    const ddl = [
      'CREATE TABLE kalem (',
      '  siparis_id NUMBER(9) NOT NULL,',
      '  sira NUMBER(4) NOT NULL,',
      '  PRIMARY KEY (siparis_id, sira))',
    ].join('\n');

    expect(run(ddl).configuration).toContain('builder.HasKey(x => new { x.SiparisId, x.Sira });');
    expect(run(ddl).warnings.map((warning) => warning.key)).toContain('compositeKey');
  });

  it('anahtar DDL’de null’a izin verse de non-nullable olur', () => {
    const ddl = 'CREATE TABLE t (id NUMBER(9), PRIMARY KEY (id))';
    expect(run(ddl).entity).toContain('public int Id { get; set; }');
  });
});

describe('kısıtlar ve uyarılar', () => {
  it('tablo kısıtlarını kolon sanmaz', () => {
    const ddl = [
      'CREATE TABLE t (',
      '  id NUMBER(9) NOT NULL,',
      '  CONSTRAINT pk_t PRIMARY KEY (id),',
      '  CONSTRAINT fk_t FOREIGN KEY (id) REFERENCES u (id),',
      '  CHECK (id > 0))',
    ].join('\n');
    expect(run(ddl).columns.map((column) => column.name)).toEqual(['id']);
  });

  it('birincil anahtar yoksa uyarır', () => {
    expect(run('CREATE TABLE t (ad VARCHAR2(10))').warnings.map((warning) => warning.key)).toContain(
      'noPrimaryKey',
    );
  });

  it('şema öneki ve tırnaklı ad kabul edilir', () => {
    expect(run('CREATE TABLE hbys."Siparis Kalem" (id NUMBER(9))').className).toBe('SiparisKalem');
  });

  it('parantez içindeki virgülü kolon ayracı sanmaz', () => {
    // NUMBER(12,2) içindeki virgül; naif split fazladan kolon üretirdi.
    expect(run('CREATE TABLE t (a NUMBER(12,2), b VARCHAR2(10))').columns).toHaveLength(2);
  });
});

describe('girdi doğrulama', () => {
  it('boş girdi hata döner', () => {
    expect(generateEntity('  ', options)).toEqual({ ok: false, error: 'ddlEmpty' });
  });

  it('CREATE TABLE olmayan girdi hata döner', () => {
    expect(generateEntity('select 1 from dual', options)).toEqual({ ok: false, error: 'ddlNoTable' });
  });

  it('kolonsuz tablo hata döner', () => {
    expect(generateEntity('CREATE TABLE t ()', options)).toEqual({ ok: false, error: 'ddlNoColumns' });
  });
});
