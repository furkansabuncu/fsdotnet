import { describe, expect, it } from 'vitest';
import { generateMerge, type MergeOptions, type MergeResult } from './mergeSql';

const base: MergeOptions = {
  table: 'siparis',
  keys: 'siparis_id',
  columns: 'kanal_id, tutar, aciklama',
  update: true,
  bindPrefix: ':',
};

const run = (patch: Partial<MergeOptions> = {}): MergeResult => {
  const result = generateMerge({ ...base, ...patch });
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('MERGE üretimi', () => {
  it('çalıştırılabilir bir ifade üretir', () => {
    expect(run().sql).toBe(
      [
        'MERGE INTO SIPARIS tgt',
        'USING (SELECT :siparis_id AS SIPARIS_ID, :kanal_id AS KANAL_ID, :tutar AS TUTAR, :aciklama AS ACIKLAMA FROM dual) src',
        '   ON (tgt.SIPARIS_ID = src.SIPARIS_ID)',
        'WHEN MATCHED THEN UPDATE SET',
        '       tgt.KANAL_ID = src.KANAL_ID,',
        '       tgt.TUTAR = src.TUTAR,',
        '       tgt.ACIKLAMA = src.ACIKLAMA',
        'WHEN NOT MATCHED THEN INSERT (',
        '       SIPARIS_ID,',
        '       KANAL_ID,',
        '       TUTAR,',
        '       ACIKLAMA',
        '     ) VALUES (',
        '       src.SIPARIS_ID,',
        '       src.KANAL_ID,',
        '       src.TUTAR,',
        '       src.ACIKLAMA',
        '     );',
      ].join('\n'),
    );
  });

  it('kaynak tarafı dual üzerinden bir tablo olur', () => {
    // USING doğrudan değer listesi kabul etmiyor; herkesin unuttuğu yer.
    expect(run().sql).toContain('FROM dual) src');
  });

  it('bileşik anahtarı AND ile bağlar', () => {
    expect(run({ keys: 'siparis_id, sira' }).sql).toContain(
      'ON (tgt.SIPARIS_ID = src.SIPARIS_ID AND tgt.SIRA = src.SIRA)',
    );
  });

  it('bağlama öneki değiştirilebilir', () => {
    expect(run({ bindPrefix: '@' }).sql).toContain('@siparis_id AS SIPARIS_ID');
  });
});

describe('anahtar kolonu güncellenemez', () => {
  it('güncelleme listesinden çıkarır ve bildirir', () => {
    // ORA-38104: ON yan tümcesindeki kolon UPDATE edilemez.
    const result = run({ columns: 'siparis_id, tutar' });
    expect(result.columns).toEqual(['TUTAR']);
    expect(result.warnings).toContain('keyInUpdate');
    expect(result.sql).not.toContain('tgt.SIPARIS_ID = src.SIPARIS_ID,');
  });

  it('anahtar yine de INSERT listesinde kalır', () => {
    expect(run({ columns: 'tutar' }).sql).toContain('src.SIPARIS_ID');
  });
});

describe('yalnızca ekleme', () => {
  it('update kapalıyken MATCHED bloğu yazılmaz', () => {
    const result = run({ update: false });
    expect(result.sql).not.toContain('WHEN MATCHED');
    expect(result.warnings).toContain('insertOnly');
  });
});

describe('girdi doğrulama', () => {
  it('tablo adı boşsa hata döner', () => {
    expect(generateMerge({ ...base, table: '  ' })).toEqual({ ok: false, error: 'mergeEmpty' });
  });

  it('anahtar yoksa hata döner', () => {
    expect(generateMerge({ ...base, keys: '' })).toEqual({ ok: false, error: 'mergeEmpty' });
  });

  it('geçersiz tablo adı hata döner ve adı söyler', () => {
    expect(generateMerge({ ...base, table: '1siparis' })).toEqual({
      ok: false,
      error: 'mergeBadName',
      detail: '1SIPARIS',
    });
  });

  it('güncellenecek kolon yoksa uyarır', () => {
    expect(run({ columns: '' }).warnings).toContain('noColumns');
  });
});
