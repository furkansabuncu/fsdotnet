import { err, ok, type ToolResult } from '../types';
import { separateGluedKeywords } from '../../lint/sql';

/**
 * Delphi `.pas` dosyasındaki gömülü SQL'i çıkarır.
 *
 * Eski VCL uygulamalarında sorgu ayrı bir katmanda durmuyor: form
 * event'lerinin içinde, satır satır `+` ile birleştirilmiş string'ler
 * hâlinde yazılmış oluyor. Dönüşüm işinin ilk adımı her zaman aynı —
 * o parçaları bulup okunur tek bir SQL'e getirmek, sonra içindeki bağlama
 * değişkenlerini ve Pascal tarafından enterpole edilen yerleri ayırmak.
 *
 * Ayrıştırıcı Pascal'ın tamamını DEĞİL, yalnızca string ifadelerini
 * anlıyor. Fazlası gerekmiyor: aranan şey ifadenin kendisi, çevresindeki
 * kontrol akışı değil.
 */

/** Bir SQL'in dosyanın neresinden geldiği. */
export interface SqlBlock {
  /** Birleştirilmiş, okunur SQL. */
  sql: string;
  /** Kaynak satır aralığı — `12-18`. Çevrilmez. */
  lines: string;
  /** `qryHasta.SQL.Add`, `ExecSQL` gibi; bulunduysa. */
  owner: string | null;
  /** `:kanal_id` biçimindeki bağlama değişkenleri, tekilleştirilmiş. */
  binds: string[];
  /**
   * SQL'e Pascal tarafından ENTERPOLE edilen parçalar — yani metnin
   * içine değişken değeri giriyor. Enjeksiyon kapısı oldukları için
   * ayrı listeleniyor.
   */
  interpolations: string[];
}

/* Bir Pascal string ifadesinin başlayabileceği yerler. `SQL.Text :=`,
   `SQL.Add(...)`, `ExecSQL`, `Open`, ya da düpedüz bir atama. Yakalanan ad
   yalnızca etiket olarak kullanılıyor; ayrıştırma buna bağlı değil. */
const OWNER = /([A-Za-z_][\w.]*)\s*(?::=|\.\s*Add\s*\(|\.\s*Append\s*\()\s*$/;

/** SQL gibi görünmenin eşiği: en az bir yan tümce anahtar kelimesi. */
const LOOKS_LIKE_SQL = /\b(select|insert|update|delete|merge|from|where|join|values)\b/i;

const BIND = /:([A-Za-z_]\w*)/g;

/**
 * Pascal string ifadesini okur.
 *
 * `'metin'` parçaları, `''` kaçışı, `+` birleştirmesi ve aradaki her şey.
 * Bir string OLMAYAN parça (değişken, fonksiyon çağrısı, `IntToStr(x)`)
 * enterpolasyon sayılıp yerine `{parça}` konuyor: SQL'in şekli bozulmasın
 * ama neyin dışarıdan geldiği görünsün.
 */
function readExpression(source: string, start: number): { text: string; end: number; interpolations: string[] } | null {
  const parts: string[] = [];
  const interpolations: string[] = [];
  let index = start;
  let sawString = false;

  const skipSpace = () => {
    while (index < source.length && /\s/.test(source[index] as string)) index += 1;
  };

  for (;;) {
    skipSpace();
    const char = source[index];

    if (char === "'") {
      index += 1;
      let body = '';
      let closed = false;

      while (index < source.length) {
        if (source[index] === "'") {
          if (source[index + 1] === "'") {
            body += "'";
            index += 2;
            continue;
          }
          index += 1;
          closed = true;
          break;
        }
        // Satır sonu Pascal string'ini kapatır; kapanmamış sayılır.
        if (source[index] === '\n') break;
        body += source[index];
        index += 1;
      }

      if (!closed) return null;
      parts.push(body);
      sawString = true;
    } else if (char !== undefined && /[A-Za-z_(]/.test(char)) {
      /* String olmayan parça: değişken ya da çağrı. Parantez dengesi
         korunarak baştan sona alınıyor, yoksa `IntToStr(a + b)` içindeki
         `+` birleştirme sanılırdı. */
      const from = index;
      let depth = 0;

      while (index < source.length) {
        const current = source[index] as string;
        if (current === '(') depth += 1;
        else if (current === ')') {
          if (depth === 0) break;
          depth -= 1;
        } else if (depth === 0 && (current === '+' || current === ';' || current === ',' || current === '\n')) break;
        index += 1;
      }

      const piece = source.slice(from, index).trim();
      if (piece === '') return null;
      interpolations.push(piece);
      parts.push(`{${piece}}`);
    } else {
      return null;
    }

    skipSpace();
    if (source[index] !== '+') break;
    index += 1;
  }

  // İçinde hiç string sabiti olmayan bir ifade SQL taşımıyor demektir.
  if (!sawString) return null;
  return { text: parts.join(''), end: index, interpolations };
}

/** `12` → satır numarası. Bloğun kaynaktaki yerini bildirmek için. */
function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

/**
 * Birleştirmeden çıkan ham metni okunur hâle getirir.
 *
 * Delphi'de her satır ayrı bir string olduğu için birleşim yerlerinde ya
 * çift boşluk kalıyor ya hiç boşluk kalmıyor. İkincisi sessiz bir hata
 * (`from siparisWHERE`), o yüzden anahtar kelime sınırında boşluk zorlanıyor.
 */
const CLAUSE = /\b(select|from|where|group\s+by|order\s+by|having|inner\s+join|left\s+join|right\s+join|join|union|and|or|values|set)\b/gi;

function tidy(text: string): string {
  return separateGluedKeywords(text.replace(/\s+/g, ' '))
    .replace(CLAUSE, (keyword) => ` ${keyword} `)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;)])/g, '$1')
    .trim();
}

export function extractSql(source: string): ToolResult<SqlBlock[]> {
  if (source.trim() === '') return err('pasEmpty');

  const blocks: SqlBlock[] = [];
  let index = 0;

  while (index < source.length) {
    const quote = source.indexOf("'", index);
    if (quote === -1) break;

    const expression = readExpression(source, quote);
    if (expression === null) {
      index = quote + 1;
      continue;
    }

    const sql = tidy(expression.text);
    if (!LOOKS_LIKE_SQL.test(sql)) {
      index = expression.end;
      continue;
    }

    const binds = [...new Set([...sql.matchAll(BIND)].map((match) => match[1] as string))];
    const before = source.slice(0, quote);
    const startLine = lineAt(source, quote);
    const endLine = lineAt(source, expression.end - 1);

    blocks.push({
      sql,
      lines: startLine === endLine ? String(startLine) : `${startLine}-${endLine}`,
      owner: OWNER.exec(before)?.[1] ?? null,
      binds,
      interpolations: [...new Set(expression.interpolations)],
    });

    index = expression.end;
  }

  if (blocks.length === 0) return err('pasNoSql');
  return ok(blocks);
}
