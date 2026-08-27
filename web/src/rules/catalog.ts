import type { RuleKey as SqlRuleKey } from '../tools/sql-fix/sqlFix';
import type { RuleKey as LinqRuleKey } from '../tools/linq-11g/linq11g';
import type { RuleKey as CultureRuleKey } from '../tools/turkish-culture/turkishCulture';
import type { ToolId } from '../tools/types';

/**
 * Lint kurallarının kataloğu — her kurala kendi adresi.
 *
 * Kurallar bugüne kadar bir aracın içinde gömülüydü ve hepsi tek bir URL'i
 * paylaşıyordu. Oysa aranan şey araç değil kural: kimse "LINQ lint aracı"
 * aramıyor, "AnyAsync oracle çalışmıyor" arıyor. Katalog, zaten yazılmış
 * olan başlık ve açıklamaları tek tek bulunabilir hâle getiriyor.
 *
 * Her girdide bir ÖRNEK var ve örnek çevrilmiyor — kod, iki dilde de aynı
 * kod. Örnek iki iş yapıyor: sayfada çalışan bir gösterim oluyor, ve testte
 * kuralın gerçekten tetiklendiğini doğrulayan sabit oluyor. İkincisi, bir
 * kuralın sessizce eşleşmeyi bırakmasını imkânsız kılıyor.
 */

export interface RuleEntry {
  /** Adresteki kimlik: `<araç>-<kural>` kebab-case. */
  id: string;
  tool: ToolId;
  /** Sözlükteki `rules` anahtarı. */
  key: string;
  /** Kuralı tetikleyen en kısa girdi. */
  sample: string;
}

/** `booleanInSelect` → `boolean-in-select` */
const kebab = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll('_', '-').toLowerCase();

function entries<K extends string>(tool: ToolId, samples: Record<K, string>): RuleEntry[] {
  return Object.entries(samples).map(([key, sample]) => ({
    id: `${tool}-${kebab(key)}`,
    tool,
    key,
    sample: sample as string,
  }));
}

const SQL_FIX: Record<SqlRuleKey, string> = {
  hostStringLiteral: "'select k.baslik from kitap k ' +\n'where k.tur_id = :tur'",
  // Kırılmaz boşluk kaçış dizisiyle: kaynakta gözle ayırt edilemezdi.
  invisibleChar: 'select ad, soyad from uye',
  smartQuote: 'select * from uye where ad = ‘Ali’',
  pastePrefix: 'SQL> select ad from uye\n  2  where uye_id = 42',
  unterminatedString: "select * from uye where ad = 'Ali",
  unterminatedIdentifier: 'select "Kolon Adi from t',
  unterminatedComment: 'select 1 from dual /* kapanmadı',
  unclosedParen: 'select nvl(a, 0 from dual',
  extraParen: 'select (1)) from dual',
  trailingSemicolon: 'select 1 from dual;',
  sqlPlusSlash: 'select 1 from dual;\n/',
  extraComma: 'select a, b, from t',
  gluedKeyword: 'select * from siparisWHERE kanal_id = 5',
  doubleQuotedString: 'select * from uye where ad = "Ali"',
  tableAliasAs: 'select * from siparis AS s',
  bracketIdentifier: 'select [ad] from [Siparis]',
  atParameter: 'select * from siparis where kanal_id = @kanal',
  tsqlFunction: 'select isnull(tutar, 0), len(aciklama), getdate() from siparis',
  tsqlNoEquivalent: 'select charindex(:aranan, aciklama) from siparis',
  plusConcat: "select ad + ' ' + soyad from uye",
  topClause: 'select top 10 ad from uye order by ad',
  offsetFetch: 'select ad from uye order by ad offset 20 rows fetch next 10 rows only',
  groupByScope: 'select k.tur_id, k.baslik, count(*) from kitap k group by k.tur_id',
  aggregateInWhere: 'select tur_id from kitap where count(*) > 5 group by tur_id',
  joinWithoutOn: 'select * from siparis s inner join kitap k',
  unknownAlias: 'select h.baslik from kitap k',
  mixedJoins: 'select * from siparis s, kanal c join kitap k on k.kitap_id = s.kitap_id',
  twelveCSyntax: 'select * from siparis s cross apply f_kalemler(s.siparis_id)',
  listaggOverflow: "select listagg(ad, ',') within group (order by ad) from uye",
};

const LINQ: Record<LinqRuleKey, string> = {
  anyAsync: 'if (await uow.KitapRepository.Query().AnyAsync(k => k.kitap_id == id, ct))\n{\n    return null;\n}',
  anyInSelect: 'var q = set.Select(p => new { Var = alt.Any(t => t.bagli_id == p.id) });',
  booleanInSelect: 'q.Select(x => new Cevap { Kapali = x.islemdurum == 3 })',
  queryInLambda: 'var q = set.Where(p => uow.Repo.Query().Any(t => t.bagli_id == p.id));',
  skipTake: 'var sayfa = await q.Skip(20).Take(10).ToListAsync(ct);',
  executeUpdate: 'await q.ExecuteUpdateAsync(s => s.SetProperty(x => x.durum, 3), ct);',
  containsList: 'q.Where(x => ids.Contains(x.tur_id))',
  rawSqlInterpolation: 'db.Kitap.FromSqlRaw($"select * from kitap where kitap_id = {id}")',
  dateOnly: 'public DateOnly SiparisTarihi { get; set; }',
};

const CULTURE: Record<CultureRuleKey, string> = {
  toUpperLower: 'if (ad.ToUpper() == "FILE") return false;',
  startsEndsWith: 'if (!dosya.EndsWith(".pdf")) return false;',
  indexOfString: 'var yer = metin.IndexOf("::");',
  stringCompare: 'if (string.Compare(a, b) > 0) { }',
  numberParse: 'var tutar = double.Parse(metin);',
  tryParse: 'if (int.TryParse(metin, out var sayi)) { }',
  dateParse: 'var tarih = DateTime.Parse(metin);',
  formatString: 'var s = tarih.ToString("dd/MM/yyyy");',
  stringFormat: 'var s = string.Format("{0:N2} MB", boyut);',
  regexIgnoreCase: 'var re = new Regex(kalip, RegexOptions.IgnoreCase);',
};

export const RULE_CATALOG: readonly RuleEntry[] = [
  ...entries('sql-fix', SQL_FIX),
  ...entries('linq-11g', LINQ),
  ...entries('turkish-culture', CULTURE),
];

export const RULE_IDS: readonly string[] = RULE_CATALOG.map((entry) => entry.id);

/** Bir aracın kuralı için dil öneksiz yol — bulgu listesi buradan bağlanıyor. */
export function ruleHref(tool: string, key: string): string {
  return `/r/${tool}-${kebab(key)}`;
}

export function getRule(id: string | undefined): RuleEntry | undefined {
  return id === undefined ? undefined : RULE_CATALOG.find((entry) => entry.id === id);
}

/** Katalog araca göre gruplanmış — dizin sayfası bunu kullanıyor. */
export function rulesByTool(): { tool: ToolId; rules: RuleEntry[] }[] {
  const tools = [...new Set(RULE_CATALOG.map((entry) => entry.tool))];
  return tools.map((tool) => ({
    tool,
    rules: RULE_CATALOG.filter((entry) => entry.tool === tool),
  }));
}
