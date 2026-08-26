import { describe, expect, it } from 'vitest';
import { generateCall, type OdpResult } from './odpCall';

const run = (signature: string): OdpResult => {
  const result = generateCall(signature);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const warnings = (signature: string) => run(signature).warnings.map((warning) => warning.key);

const SIGNATURE = [
  'CREATE OR REPLACE PROCEDURE PRC_SIPARIS_LISTE (',
  '  p_kanal_id   IN  NUMBER,',
  '  p_bas_tarih  IN  DATE,',
  '  p_aciklama   OUT VARCHAR2,',
  '  p_sonuc      OUT SYS_REFCURSOR',
  ') IS',
].join('\n');

describe('imza okuma', () => {
  it('prosedür adını ve parametreleri çıkarır', () => {
    const result = run(SIGNATURE);
    expect(result.routine).toBe('PRC_SIPARIS_LISTE');
    expect(result.parameters.map((parameter) => parameter.name)).toEqual([
      'p_kanal_id',
      'p_bas_tarih',
      'p_aciklama',
      'p_sonuc',
    ]);
  });

  it('yönleri doğru okur', () => {
    expect(run(SIGNATURE).parameters.map((parameter) => parameter.direction)).toEqual([
      'Input',
      'Input',
      'Output',
      'Output',
    ]);
  });

  it('IN OUT tanınır', () => {
    const result = run('PROCEDURE p (x IN OUT NUMBER)');
    expect(result.parameters[0]?.direction).toBe('InputOutput');
  });

  it('yön yazılmamışsa IN varsayılır', () => {
    expect(run('PROCEDURE p (x NUMBER)').parameters[0]?.direction).toBe('Input');
  });

  it('şema öneki adı bozmaz', () => {
    expect(run('PROCEDURE hbys.prc_test (x NUMBER)').routine).toBe('prc_test');
  });

  it('parametresiz prosedür de okunur', () => {
    const result = run('PROCEDURE prc_temizle IS');
    expect(result.parameters).toEqual([]);
    expect(result.warnings.map((warning) => warning.key)).toContain('noParameters');
  });

  it('fonksiyon olarak işaretler', () => {
    expect(run('FUNCTION fn_topla (a NUMBER) RETURN NUMBER').isFunction).toBe(true);
  });
});

describe('tip eşlemesi', () => {
  it.each([
    ['NUMBER', 'Decimal'],
    ['VARCHAR2', 'Varchar2'],
    ['DATE', 'Date'],
    ['CLOB', 'Clob'],
    ['BLOB', 'Blob'],
    ['SYS_REFCURSOR', 'RefCursor'],
    ['TIMESTAMP', 'TimeStamp'],
    ['TIMESTAMP WITH TIME ZONE', 'TimeStampTZ'],
  ])('%s → OracleDbType.%s', (oracle, expected) => {
    expect(run(`PROCEDURE p (x IN ${oracle})`).parameters[0]?.dbType).toBe(expected);
  });

  it('NUMBER Decimal’e düşer, Int32’ye değil', () => {
    // İmzada hassasiyet yazmıyor; Int32 seçmek 10 haneli anahtarda taşar.
    expect(run('PROCEDURE p (x NUMBER)').parameters[0]?.dbType).toBe('Decimal');
  });

  it('PL/SQL BOOLEAN bağlanamaz, uyarı üretir', () => {
    expect(warnings('PROCEDURE p (x IN BOOLEAN)')).toContain('booleanUnsupported');
  });

  it('bilinmeyen tip uyarı üretir', () => {
    expect(warnings('PROCEDURE p (x IN t_kayit_tablosu)')).toContain('unknownType');
  });
});

describe('üretilen kod', () => {
  it('BindByName açık geliyor', () => {
    // Varsayılan false; kapalıyken parametreler sıraya göre bağlanıyor.
    expect(run(SIGNATURE).code).toContain('BindByName = true');
  });

  it('OUT metnine tampon boyutu veriyor', () => {
    expect(run(SIGNATURE).code).toContain(
      'command.Parameters.Add("p_aciklama", OracleDbType.Varchar2, 4000, null, ParameterDirection.Output);',
    );
    expect(warnings(SIGNATURE)).toContain('outSize');
  });

  it('IN parametrelerine değer atıyor', () => {
    expect(run(SIGNATURE).code).toContain(
      'command.Parameters.Add("p_kanal_id", OracleDbType.Decimal, ParameterDirection.Input).Value = pKanalId;',
    );
  });

  it('ref cursor’ı ExecuteNonQuery SONRASI okuyor', () => {
    const code = run(SIGNATURE).code;
    expect(code).toContain('await command.ExecuteNonQueryAsync(cancellationToken);');
    expect(code).toContain('(OracleRefCursor)command.Parameters["p_sonuc"].Value');
    expect(code.indexOf('ExecuteNonQueryAsync')).toBeLessThan(code.indexOf('OracleRefCursor'));
  });

  it('ref cursor yoksa okuyucu bloğu yazılmaz', () => {
    expect(run('PROCEDURE p (x IN NUMBER)').code).not.toContain('OracleRefCursor');
  });

  it('skaler OUT parametrelerini geri okuyor', () => {
    expect(run(SIGNATURE).code).toContain('var pAciklama = command.Parameters["p_aciklama"].Value');
  });

  it('IN parametresi için geri okuma yazmaz', () => {
    expect(run(SIGNATURE).code).not.toContain('var pKanalId = command.Parameters');
  });
});

describe('girdi doğrulama', () => {
  it('boş girdi hata döner', () => {
    expect(generateCall('   ')).toEqual({ ok: false, error: 'odpEmpty' });
  });

  it('prosedür imzası olmayan girdi hata döner', () => {
    expect(generateCall('select 1 from dual')).toEqual({ ok: false, error: 'odpNoRoutine' });
  });
});
