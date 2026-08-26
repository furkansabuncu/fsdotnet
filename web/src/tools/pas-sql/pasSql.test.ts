import { describe, expect, it } from 'vitest';
import { extractSql, type SqlBlock } from './pasSql';

const blocks = (source: string): SqlBlock[] => {
  const result = extractSql(source);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

const first = (source: string): SqlBlock => blocks(source)[0]!;

describe('birleştirme', () => {
  it('satır satır eklenmiş SQL’i tek metne getirir', () => {
    const source = [
      "  qrySiparis.SQL.Text := 'select s.siparis_id, k.baslik ' +",
      "                         'from siparis s ' +",
      "                         'join kitap k on k.kitap_id = s.kitap_id';",
    ].join('\n');

    expect(first(source).sql).toBe(
      'select s.siparis_id, k.baslik from siparis s join kitap k on k.kitap_id = s.kitap_id',
    );
  });

  it('birleşim yerinde kaybolan boşluğu geri koyar', () => {
    // Delphi'de en sık hata bu: 'from siparis' + 'where ...' → siparisWHERE
    const source = "q.SQL.Text := 'select * from siparis' + 'where kanal_id = 5';";
    expect(first(source).sql).toBe('select * from siparis where kanal_id = 5');
  });

  it('ikiye katlanmış tırnağı tek tırnağa çevirir', () => {
    const source = "q.SQL.Text := 'select * from uye where ad = ''Ali''';";
    expect(first(source).sql).toBe("select * from uye where ad = 'Ali'");
  });

  it('fazla boşluğu sadeleştirir', () => {
    expect(first("q.SQL.Text := 'select   a,    b   from t';").sql).toBe('select a, b from t');
  });
});

describe('bağlama değişkenleri', () => {
  it('tekilleştirerek listeler', () => {
    const source =
      "q.SQL.Text := 'select * from siparis where kanal_id = :kanal and iptal_kanal = :kanal and tur = :tur';";
    expect(first(source).binds).toEqual(['kanal', 'tur']);
  });

  it('bağlama yoksa boş liste verir', () => {
    expect(first("q.SQL.Text := 'select 1 from dual';").binds).toEqual([]);
  });
});

describe('enterpolasyon', () => {
  it('değişkeni yakalar ve yerine işaret koyar', () => {
    const source = "q.SQL.Text := 'select * from uye where uye_id = ' + IntToStr(FUyeId);";
    const block = first(source);

    expect(block.sql).toBe('select * from uye where uye_id = {IntToStr(FUyeId)}');
    // Enjeksiyon kapısı; ayrı listelenmesinin sebebi bu.
    expect(block.interpolations).toEqual(['IntToStr(FUyeId)']);
  });

  it('parantez içindeki + birleştirme sanılmaz', () => {
    const source = "q.SQL.Text := 'select * from t where a = ' + IntToStr(x + y);";
    expect(first(source).interpolations).toEqual(['IntToStr(x + y)']);
  });

  it('düz değişkeni de yakalar', () => {
    const source = "q.SQL.Text := 'select * from ' + FTabloAdi + ' where 1 = 1';";
    const block = first(source);
    expect(block.interpolations).toEqual(['FTabloAdi']);
    expect(block.sql).toContain('{FTabloAdi}');
  });
});

describe('kaynak konumu', () => {
  it('tek satırlık bloğun satırını verir', () => {
    expect(first("q.SQL.Text := 'select 1 from dual';").lines).toBe('1');
  });

  it('çok satırlı bloğun aralığını verir', () => {
    const source = ['begin', "  q.SQL.Text := 'select a ' +", "    'from t';", 'end;'].join('\n');
    expect(first(source).lines).toBe('2-3');
  });

  it('ifadenin sahibini bulur', () => {
    expect(first("qryHasta.SQL.Add('select 1 from dual');").owner).toBe('qryHasta.SQL');
    expect(first("  FSorgu := 'select 1 from dual';").owner).toBe('FSorgu');
  });

  it('sahibi yoksa null verir', () => {
    expect(first("ShowMessage('select 1 from dual');").owner).toBeNull();
  });
});

describe('eleme', () => {
  it('SQL olmayan metinleri atlar', () => {
    const source = [
      "  ShowMessage('Kayit bulunamadi');",
      "  q.SQL.Text := 'select 1 from dual';",
      "  Caption := 'Siparis Listesi';",
    ].join('\n');

    expect(blocks(source)).toHaveLength(1);
  });

  it('birden çok sorguyu ayrı ayrı verir', () => {
    const source = [
      "  q1.SQL.Text := 'select a from t1';",
      "  q2.SQL.Text := 'select b from t2';",
    ].join('\n');

    expect(blocks(source).map((block) => block.sql)).toEqual([
      'select a from t1',
      'select b from t2',
    ]);
  });

  it('kapanmamış tırnağı atlar', () => {
    // Yarım yapıştırılmış kod; bloğu uydurmaktansa geçmek doğru.
    expect(extractSql("q.SQL.Text := 'select 1 from dual")).toEqual({
      ok: false,
      error: 'pasNoSql',
    });
  });

  it('boş girdi hata döner', () => {
    expect(extractSql('   ')).toEqual({ ok: false, error: 'pasEmpty' });
  });

  it('SQL içermeyen dosya hata döner', () => {
    expect(extractSql("ShowMessage('Merhaba');")).toEqual({ ok: false, error: 'pasNoSql' });
  });
});
