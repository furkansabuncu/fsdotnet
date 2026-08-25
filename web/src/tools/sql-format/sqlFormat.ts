import { format } from 'sql-formatter';
import { err, ok, type ToolResult } from '../types';

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
 * girdi elle taranıyor: literal, tanımlayıcı ve yorumlar bir bütün olarak
 * geçirilir, boşluk yalnızca onların DIŞINDA toplanır.
 *
 * Bilinen sınır: Oracle'ın `q'[...]'` alternatif tırnak sözdizimi
 * desteklenmiyor — sıradan tırnak gibi okunur.
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

  let i = 0;
  while (i < input.length) {
    const char = input[i] as string;
    const next = input[i + 1];

    // Satır yorumu — silinir ama yerine boşluk kalır, yoksa iki token birleşir.
    if (char === '-' && next === '-') {
      while (i < input.length && input[i] !== '\n') i += 1;
      pendingSpace = true;
      continue;
    }

    // Blok yorumu.
    if (char === '/' && next === '*') {
      i += 2;
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1;
      i += 2;
      pendingSpace = true;
      continue;
    }

    // Tek tırnaklı dize ve çift tırnaklı tanımlayıcı: aynen geçer.
    if (char === "'" || char === '"') {
      const quote = char;
      let literal = quote;
      i += 1;
      while (i < input.length) {
        if (input[i] === quote) {
          // SQL'de tırnak, ikiye katlanarak kaçırılır: 'it''s'
          if (input[i + 1] === quote) {
            literal += quote + quote;
            i += 2;
            continue;
          }
          literal += quote;
          i += 1;
          break;
        }
        literal += input[i];
        i += 1;
      }
      emit(literal);
      continue;
    }

    if (WHITESPACE.test(char)) {
      pendingSpace = true;
      while (i < input.length && WHITESPACE.test(input[i] as string)) i += 1;
      continue;
    }

    emit(char);
    i += 1;
  }

  return ok(out.join('').trim());
}
