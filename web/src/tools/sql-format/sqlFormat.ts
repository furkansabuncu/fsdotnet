import { format } from 'sql-formatter';
import { err, ok, type ToolResult } from '../types';
import { scan } from '../sql-fix/scan';

/**
 * Desteklenen lehçeler.
 *
 * Oracle (`plsql`) başta duruyor: bu araç her şeyden önce Oracle tabanlı bir
 * HBYS'de günlük iş için yazıldı. Orijinal planda araç T-SQL ayrıştırıcısıyla
 * (ScriptDom) sunucu tarafında olacaktı — o ayrıştırıcı Oracle'ı okuyamadığı
 * için hem lehçe hem çalışma yeri değişti (ADR-0001'deki tablo güncellendi).
 */
export const DIALECTS = [
  { id: 'plsql', label: 'Oracle (PL/SQL)' },
  { id: 'transactsql', label: 'SQL Server (T-SQL)' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'sql', label: 'Standard SQL' },
] as const;

export type SqlDialect = (typeof DIALECTS)[number]['id'];
export type KeywordCase = 'upper' | 'lower' | 'preserve';

export interface SqlFormatOptions {
  dialect: SqlDialect;
  keywordCase: KeywordCase;
}

/**
 * Sorguyu girintiler.
 *
 * Biçimlendirmenin kendisi `sql-formatter`'a ait: doğru bir SQL
 * biçimlendiricisi tek başına bir proje, kötü bir kopyasını yazmak yanlış
 * olurdu. Buradaki iş lehçe seçimi, hata dönüşümü ve minify.
 */
export function formatSql(input: string, options: SqlFormatOptions): ToolResult<string> {
  if (input.trim() === '') return ok('');

  try {
    return ok(
      format(input, {
        language: options.dialect,
        tabWidth: 2,
        keywordCase: options.keywordCase,
        // Kullanıcı "UPPER" seçtiğinde NVL ve NUMBER'ın küçük kalmasını
        // beklemez; kasa ayarı sözcük türlerinin hepsini kapsar.
        functionCase: options.keywordCase,
        dataTypeCase: options.keywordCase,
        // identifierCase BİLEREK dışarıda: tablo/kolon adlarına dokunmak
        // Oracle'da tırnaklı tanımlayıcıları bozar — biçimlendirici
        // sorgunun anlamını değiştiremez.
      }),
    );
  } catch {
    // Kütüphane ayrıştıramadığında fırlatıyor; araçlarımız exception
    // fırlatmaz, hata beklenen bir sonuçtur.
    return err('sqlInvalid');
  }
}

/** Minify sırasında bir parçanın dokunulmaz olup olmadığı. */
const WHITESPACE = /\s/;
/**
 * Sorguyu tek satıra indirir.
 *
 * Naif bir `replace(/\s+/g, ' ')` string literal'lerin İÇİNDEKİ boşluğu da
 * ezer — `'a   b'` sessizce `'a b'` olur ve sorgunun anlamı değişir. Bu yüzden
 * girdi bölgelere ayrılıyor: literal, tanımlayıcı ve yorumlar bir bütün
 * olarak geçirilir, boşluk yalnızca kodun içinde toplanır.
 *
 * Bölge ayrımı `sql-fix/scan` ile ORTAK. Eskiden burada kendi tarayıcısı
 * vardı; iki kopya tutmak, birinde düzeltilen bir tırnak kaçışının ötekinde
 * bozuk kalması demekti.
 */
export function minifySql(input: string): ToolResult<string> {
  if (input.trim() === '') return ok('');

  const out: string[] = [];
  /** Bekleyen boşluk; gerekliliğine bir sonraki parça yazılırken karar verilir. */
  let pendingSpace = false;

  const lastChar = () => {
    const previous = out[out.length - 1];
    return previous === undefined ? '' : previous[previous.length - 1];
  };

  const emit = (text: string) => {
    if (pendingSpace) {
      pendingSpace = false;
      const previous = lastChar();
      const first = text[0] ?? '';
      // Boşluk yalnızca iki token'ı ayırmak için gerekliyse yazılır.
      // Gereksiz olduğu yerler: `(` ve `,` SONRASI, `,` `)` `;` ÖNCESİ.
      // `)` sonrası bilerek dışarıda — `)and` gibi yapışmalar riskli.
      const redundant =
        previous === '' || previous === '(' || previous === ',' || ',);'.includes(first);
      if (!redundant) out.push(' ');
    }
    out.push(text);
  };

  for (const span of scan(input).spans) {
    const text = input.slice(span.start, span.end);

    // Yorum silinir ama yerine boşluk kalır, yoksa iki token birleşir.
    if (span.kind === 'comment') {
      pendingSpace = true;
      continue;
    }

    // Dize ve tanımlayıcı aynen geçer — içindeki boşluk veridir.
    if (span.kind !== 'code') {
      emit(text);
      continue;
    }

    for (const char of text) {
      if (WHITESPACE.test(char)) pendingSpace = true;
      else emit(char);
    }
  }

  return ok(out.join('').trim());
}
