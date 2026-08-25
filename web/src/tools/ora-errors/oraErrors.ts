export type OraGroup =
  | 'syntax'
  | 'object'
  | 'data'
  | 'constraint'
  | 'plsql'
  | 'connection'
  | 'concurrency'
  | 'resource';

export interface OraError {
  code: number;
  /** Oracle'ın bastığı resmî metin — logda birebir bu görünür, çevrilmez. */
  message: string;
  /** Pratikte bu hatanın en sık sebebi. */
  cause: string;
  group: OraGroup;
}

const e = (code: number, message: string, group: OraGroup, cause: string): OraError => ({
  code,
  message,
  group,
  cause,
});

/**
 * Günlük Oracle geliştirmede en sık karşılaşılan hatalar.
 *
 * Mesajlar İngilizce bırakıldı çünkü logda birebir öyle görünür — aradığınız
 * şey tam olarak o metin. Değer katan kısım `cause` alanı: resmî belge "ne"
 * olduğunu söyler, burası "neden" olduğunu.
 */
export const ORA_ERRORS: readonly OraError[] = [
  e(1, 'unique constraint violated', 'constraint', 'Var olan bir anahtar tekrar eklendi; sequence ile tablo arasındaki senkron da bozulmuş olabilir.'),
  e(54, 'resource busy and acquire with NOWAIT specified', 'concurrency', 'Başka bir oturum satırı/tabloyu kilitli tutuyor; genelde commit edilmemiş bir işlem.'),
  e(60, 'deadlock detected while waiting for resource', 'concurrency', 'İki oturum birbirinin kilidini bekliyor. Satırlara hep aynı sırada dokunmak çözer.'),
  e(904, 'invalid identifier', 'object', 'Kolon adı yok ya da yanlış yazılmış. Tırnaklı oluşturulmuş kolonlar kasa duyarlıdır.'),
  e(907, 'missing right parenthesis', 'syntax', 'Parantez kapanmamış — ya da desteklenmeyen bir sözdizimi parantez sanılmış.'),
  e(911, 'invalid character', 'syntax', 'Genelde sondaki noktalı virgül: PL/SQL dışında tek ifadede `;` gönderilemez.'),
  e(918, 'column ambiguously defined', 'syntax', 'JOIN edilen iki tabloda aynı kolon adı var; takma adla nitelendirin.'),
  e(920, 'invalid relational operator', 'syntax', 'Karşılaştırma operatörü eksik ya da hatalı.'),
  e(923, 'FROM keyword not found where expected', 'syntax', 'SELECT listesinde eksik virgül ya da tırnak.'),
  e(933, 'SQL command not properly ended', 'syntax', 'Oracle\'ın desteklemediği bir sözdizimi — ör. T-SQL alışkanlığıyla yazılmış `TOP` ya da `AS` kullanımı.'),
  e(936, 'missing expression', 'syntax', 'WHERE ya da SELECT boş kalmış; dinamik SQL birleştirilirken sık olur.'),
  e(942, 'table or view does not exist', 'object', 'Ad yanlış, farklı şemada, ya da yetki yok — yetkisizlik de bu hatayı verir.'),
  e(979, 'not a GROUP BY expression', 'syntax', 'SELECT\'te agrega olmayan bir kolon var ama GROUP BY\'da yok.'),
  e(1000, 'maximum open cursors exceeded', 'resource', 'Kapatılmayan cursor/command sızıntısı; `using` kullanılmamış olabilir.'),
  e(1008, 'not all variables bound', 'data', 'Sorguda bir bind var ama değeri verilmemiş. ODP.NET\'te `BindByName` unutulduysa da görülür.'),
  e(1013, 'user requested cancel of current operation', 'connection', 'Sorgu iptal edildi ya da komut zaman aşımına uğradı.'),
  e(1017, 'invalid username/password; logon denied', 'connection', 'Kimlik bilgisi yanlış; şifre kasa duyarlıdır.'),
  e(1031, 'insufficient privileges', 'object', 'Nesne var ama işlem için GRANT verilmemiş.'),
  e(1400, 'cannot insert NULL into', 'constraint', 'NOT NULL kolona değer gelmedi; entity\'de nullable işaretlenmiş olabilir.'),
  e(1403, 'no data found', 'plsql', 'PL/SQL `SELECT INTO` hiç satır döndürmedi. SQL tarafında hata değildir, PL/SQL\'de istisnadır.'),
  e(1422, 'exact fetch returns more than requested number of rows', 'plsql', '`SELECT INTO` birden fazla satır döndürdü; filtre yetersiz.'),
  e(1427, 'single-row subquery returns more than one row', 'data', 'Skaler beklenen alt sorgu çoklu satır verdi.'),
  e(1438, 'value larger than specified precision allowed for this column', 'data', 'NUMBER(p,s) taşması — ör. NUMBER(5,2) kolona 1234.56 yazmak.'),
  e(1476, 'divisor is equal to zero', 'data', 'Bölen sıfır; `NULLIF(payda, 0)` ile korunur.'),
  e(1555, 'snapshot too old', 'concurrency', 'Uzun süren sorgu, UNDO alanı geri dönüştürülmüş. Genelde yavaş bir raporlama sorgusu.'),
  e(1722, 'invalid number', 'data', 'Metin sayıya çevrilemedi. En sık sebebi: sayısal bir kolonla tırnaklı değer karşılaştırmak.'),
  e(1745, 'invalid host/bind variable name', 'syntax', 'Bind adı geçersiz — ya da metin içinde iki nokta üst üste bind sanılmış (`to_char(x, \'hh24:mi\')`).'),
  e(1756, 'quoted string not properly terminated', 'syntax', 'Tek tırnak kapanmamış; değer içindeki kesme işareti ikiye katlanmamış olabilir.'),
  e(1795, 'maximum number of expressions in a list is 1000', 'data', 'IN listesi 1000 elemanı aştı. Parçalayın ya da geçici tablo/koleksiyon kullanın.'),
  e(1830, 'date format picture ends before converting entire input string', 'data', 'TO_DATE maskesi girdiden kısa.'),
  e(1843, 'not a valid month', 'data', 'Tarih metni beklenen maskeye uymuyor; NLS_DATE_LANGUAGE farkı da sebep olabilir.'),
  e(1858, 'a non-numeric character was found where a numeric was expected', 'data', 'TO_DATE/TO_NUMBER maskesiyle girdi uyuşmuyor.'),
  e(1861, 'literal does not match format string', 'data', 'Tarih literali ile maske farklı. Açık maske vermek (`TO_DATE(x, \'YYYY-MM-DD\')`) çözer.'),
  e(2290, 'check constraint violated', 'constraint', 'Değer CHECK kuralını geçmedi.'),
  e(2291, 'integrity constraint violated - parent key not found', 'constraint', 'FK\'nın işaret ettiği ana kayıt yok.'),
  e(2292, 'integrity constraint violated - child record found', 'constraint', 'Silinmek istenen kaydın bağlı çocuk kayıtları var.'),
  e(3113, 'end-of-file on communication channel', 'connection', 'Bağlantı koptu; sunucu süreci öldü ya da ağ/firewall araya girdi.'),
  e(3114, 'not connected to ORACLE', 'connection', 'Bağlantı kapanmış; havuzdan alınan bağlantı geçersiz olabilir.'),
  e(4031, 'unable to allocate bytes of shared memory', 'resource', 'Shared pool doldu — sık sebebi bind kullanmayan, her seferinde farklı literal içeren sorgular.'),
  e(4063, 'object has errors', 'plsql', 'Paket/view derlenemez durumda; bağımlı bir nesne değişmiş olabilir.'),
  e(4068, 'existing state of packages has been discarded', 'plsql', 'Paket yeniden derlendi, oturumun paket durumu geçersizleşti. Genelde tekrar deneyince geçer.'),
  e(6502, 'PL/SQL: numeric or value error', 'plsql', 'Değişkene sığmayan değer — en sık VARCHAR2 uzunluk taşması.'),
  e(6508, 'PL/SQL: could not find program unit being called', 'plsql', 'Çağrılan prosedür yok ya da geçersiz durumda.'),
  e(6550, 'line/column: PL/SQL compilation error', 'plsql', 'Çağrı imzası uyuşmuyor — yanlış parametre sayısı ya da tipi.'),
  e(8177, "can't serialize access for this transaction", 'concurrency', 'SERIALIZABLE seviyede çakışan güncelleme; işlem yeniden denenmeli.'),
  e(12154, 'TNS: could not resolve the connect identifier specified', 'connection', 'tnsnames.ora\'da servis adı yok ya da TNS_ADMIN yanlış.'),
  e(12170, 'TNS: Connect timeout occurred', 'connection', 'Sunucuya ulaşılamıyor — ağ, firewall ya da yanlış host.'),
  e(12505, 'TNS: listener does not currently know of SID', 'connection', 'SID yanlış; çoğu kurulumda SID yerine SERVICE_NAME gerekir.'),
  e(12514, 'TNS: listener does not currently know of service requested', 'connection', 'Servis adı yanlış ya da veritabanı listener\'a kayıtlı değil.'),
  e(12541, 'TNS: no listener', 'connection', 'Listener çalışmıyor ya da port yanlış.'),
  e(12560, 'TNS: protocol adapter error', 'connection', 'Yerelde ORACLE_SID/ORACLE_HOME ayarlanmamış, ya da servis durmuş.'),
  e(12899, 'value too large for column', 'data', 'Metin kolona sığmadı. Türkçe karakterler UTF-8\'de 2 bayt tuttuğu için `VARCHAR2(n BYTE)` beklenenden erken dolar — `n CHAR` kullanın.'),
  e(28000, 'the account is locked', 'connection', 'Hesap kilitlendi; genelde arka arkaya hatalı şifre denemesi.'),
  e(28001, 'the password has expired', 'connection', 'Şifre süresi doldu; profildeki PASSWORD_LIFE_TIME.'),
];

export const ORA_GROUPS: readonly OraGroup[] = [
  'syntax',
  'object',
  'data',
  'constraint',
  'plsql',
  'connection',
  'concurrency',
  'resource',
];

/** `ORA-01722` biçiminde etiket — logda böyle görünür. */
export function formatCode(code: number): string {
  return `ORA-${String(code).padStart(5, '0')}`;
}

/**
 * Koda, mesaja ve sebebe bakan arama.
 *
 * Kod araması dolgu sıfırlarını yok sayar: hem `1722` hem `01722` hem
 * `ORA-01722` aynı sonucu vermeli — logdan kopyalayıp yapıştırmak için.
 */
export function searchOraErrors(query: string, group: OraGroup | 'all'): OraError[] {
  const raw = query.trim().toLowerCase();
  const numeric = raw.replace(/^ora-?/, '').replace(/^0+/, '');

  return ORA_ERRORS.filter((item) => {
    if (group !== 'all' && item.group !== group) return false;
    if (raw === '') return true;

    if (numeric !== '' && /^\d+$/.test(numeric) && String(item.code).startsWith(numeric)) return true;
    return (
      item.message.toLowerCase().includes(raw) ||
      item.cause.toLowerCase().includes(raw) ||
      formatCode(item.code).toLowerCase().includes(raw)
    );
  });
}
