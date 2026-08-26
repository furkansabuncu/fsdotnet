import { describe, expect, it } from 'vitest';
import { buildConnectionString, parseConnectionString, type ConnectionInfo } from './connString';

const parse = (input: string): ConnectionInfo => {
  const result = parseConnectionString(input);
  if (!result.ok) throw new Error(`beklenmeyen hata: ${result.error}`);
  return result.value;
};

describe('Easy Connect', () => {
  const value = 'User Id=hbys;Password=gizli;Data Source=db01.local:1521/ORCLPDB';

  it('konağı, portu ve servisi ayırır', () => {
    expect(parse(value)).toMatchObject({
      kind: 'easyConnect',
      host: 'db01.local',
      port: '1521',
      service: 'ORCLPDB',
    });
  });

  it('port yazılmamışsa 1521 varsayar', () => {
    expect(parse('Data Source=db01/ORCLPDB').port).toBe('1521');
  });

  it('şifreyi maskeler', () => {
    expect(parse(value).redacted).toBe('User Id=hbys;Password=********;Data Source=db01.local:1521/ORCLPDB');
  });

  it('maskesiz hâli değeri korur', () => {
    expect(parse(value).normalised).toContain('Password=gizli');
  });
});

describe('TNS tanımlayıcısı', () => {
  const value =
    'User Id=hbys;Password=x;Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db01)(PORT=1522))(CONNECT_DATA=(SERVICE_NAME=ORCL)))';

  it('tanımlayıcı olarak sınıflandırır', () => {
    expect(parse(value).kind).toBe('descriptor');
  });

  it('içindeki adres bilgisini çıkarır', () => {
    expect(parse(value)).toMatchObject({ host: 'db01', port: '1522', service: 'ORCL' });
  });

  it('parantez içindeki noktalı virgülsüz yapıyı bölmez', () => {
    // Naif split(';') burada değil, `=` sayısında yanılırdı.
    expect(parse(value).fields).toHaveLength(3);
  });

  it('SID de servis olarak okunur', () => {
    const sid = 'Data Source=(DESCRIPTION=(ADDRESS=(HOST=db01)(PORT=1521))(CONNECT_DATA=(SID=ORCL)))';
    expect(parse(sid).service).toBe('ORCL');
  });
});

describe('TNS takma adı', () => {
  it('yalnız bir ad varsa takma ad sayılır ve uyarılır', () => {
    // Adres bu dizede DEĞİL, tnsnames.ora dosyasında.
    const result = parse('User Id=hbys;Password=x;Data Source=ORCLPROD');
    expect(result.kind).toBe('tnsAlias');
    expect(result.warnings).toContain('tnsAlias');
  });
});

describe('uyarılar', () => {
  it('açık şifreyi bildirir', () => {
    expect(parse('Data Source=db/x;Password=gizli').warnings).toContain('plainPassword');
  });

  it('şifre yoksa bildirir', () => {
    expect(parse('Data Source=db01:1521/ORCL;User Id=hbys').warnings).toContain('noPassword');
  });

  it('integrated security şifresizliği açıklıyorsa ayrıca bildirilir', () => {
    const result = parse('Data Source=db01:1521/ORCL;Integrated Security=yes');
    expect(result.warnings).toContain('integratedSecurity');
    expect(result.warnings).not.toContain('noPassword');
  });

  it('havuzlama kapalıysa bildirir', () => {
    expect(parse('Data Source=db01:1521/ORCL;Pooling=false').warnings).toContain('poolingOff');
  });

  it('anlaşılmayan kaynağı bildirir', () => {
    expect(parse('Data Source=;User Id=x').warnings).toContain('unknownSource');
  });
});

describe('girdi doğrulama', () => {
  it('boş girdi hata döner', () => {
    expect(parseConnectionString('  ')).toEqual({ ok: false, error: 'connEmpty' });
  });

  it('anahtar=değer içermeyen girdi hata döner', () => {
    expect(parseConnectionString('sadece metin')).toEqual({ ok: false, error: 'connNoPairs' });
  });
});

describe('buildConnectionString', () => {
  const options = {
    host: 'db01',
    port: '1521',
    service: 'ORCLPDB',
    user: 'hbys',
    password: 'gizli',
    descriptor: false,
  };

  it('Easy Connect kurar', () => {
    expect(buildConnectionString(options)).toBe(
      'User Id=hbys;Password=gizli;Data Source=db01:1521/ORCLPDB',
    );
  });

  it('tanımlayıcı kurar', () => {
    expect(buildConnectionString({ ...options, descriptor: true })).toBe(
      'User Id=hbys;Password=gizli;Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=db01)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=ORCLPDB)))',
    );
  });

  it('port boşsa 1521 kullanır', () => {
    expect(buildConnectionString({ ...options, port: ' ' })).toContain('db01:1521/');
  });

  it('kurulan dize geri çözülebiliyor', () => {
    const built = buildConnectionString({ ...options, descriptor: true });
    expect(parse(built)).toMatchObject({ kind: 'descriptor', host: 'db01', service: 'ORCLPDB' });
  });
});
