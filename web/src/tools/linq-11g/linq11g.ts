import { err, ok, type ToolResult } from '../types';
import { scanCSharp } from '../../lint/csharp';
import {
  buildContext,
  closeParen,
  codeMatches,
  enclosingCall,
  finding,
  patternRule,
  runRules,
  type Rule,
} from '../../lint/engine';
import type { Finding } from '../../lint/types';

/**
 * Oracle 11g altında ÇALIŞMA ANINDA patlayan EF Core / LINQ kalıpları.
 *
 * Buradaki kuralların hepsi derlenir. Sorun tam olarak bu: hata birim
 * testinde değil, sorgu ilk kez 11g'ye gittiğinde çıkıyor ve mesaj
 * (`ORA-00904: "FALSE": geçersiz belirleyici`) nedeni değil semptomu
 * söylüyor. Liste sahada alınmış hatalardan çıktı, "best practice"
 * tahmininden değil.
 *
 * Şema ya da derleyici gerektiren hiçbir şey yok; araç metne bakıyor.
 * Dolayısıyla emin olamadığı yerde SUSUYOR — yanlış alarm, bir lint
 * aracını kullanılmaz yapan tek şeydir.
 */

/**
 * Kural anahtarları — bir TİP değil, çalışma zamanı DİZİSİ; tip ondan
 * türetiliyor (`TOOL_IDS` ile aynı kalıp).
 *
 * Sebebi kural kataloğu: her kuralın kendi adresi var ve katalogun eksiksiz
 * olduğunu doğrulayan test bu listeyi okuyor. Yalnızca tip olsaydı test
 * ikinci bir kopya tutmak zorunda kalır, o kopya da er geç kayardı.
 */
export const RULE_KEYS = [
  'anyAsync',
  'anyInSelect',
  'booleanInSelect',
  'queryInLambda',
  'skipTake',
  'executeUpdate',
  'containsList',
  'rawSqlInterpolation',
  'dateOnly',
] as const;

export type RuleKey = (typeof RULE_KEYS)[number];

type LinqRule = Rule<RuleKey>;

/* ------------------------------------------------------------------ */
/* Kurallar                                                             */
/* ------------------------------------------------------------------ */

/**
 * `AnyAsync()` 11g'de çalışmıyor.
 *
 * Düzeltme güvenli ve mekanik: metot adı değişiyor ve çağrının SONUNA
 * `!= null` ekleniyor. `await x.FirstOrDefaultAsync(…) != null` ifadesi
 * `(await …) != null` olarak ayrıştığı için `if` içinde de, atamada da
 * doğru kalıyor.
 */
const anyAsync: LinqRule = {
  key: 'anyAsync',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const match of codeMatches(context, /\.AnyAsync\s*\(/g)) {
      const open = match.index + match[0].length - 1;
      const close = closeParen(context, open);
      const rename = { start: match.index, end: match.index + '.AnyAsync'.length, text: '.FirstOrDefaultAsync' };

      // Parantez kapanmıyorsa (yarım yapıştırılmış kod) düzeltme önerme.
      const edits =
        close === -1 ? [] : [rename, { start: close + 1, end: close + 1, text: ' != null' }];

      findings.push(
        finding(context, 'anyAsync', 'error', match.index, match.index + match[0].length, edits, 'AnyAsync → FirstOrDefaultAsync(…) != null'),
      );
    }
    return findings;
  },
};

/**
 * `Any(...)` yalnızca bir `Where` predicate'i içinde EXISTS'e çevrilebiliyor.
 * `Select` projeksiyonunda kullanıldığında 11g patlıyor.
 *
 * Kural bilerek dar: serbest bir `list.Any()` çağrısı sıradan C#'tır ve
 * hiç SQL'e gitmez — onu işaretlemek aracı kullanılmaz yapardı.
 */
const anyInSelect: LinqRule = {
  key: 'anyInSelect',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const match of codeMatches(context, /\.Any\s*\(/g)) {
      const enclosing = enclosingCall(context, match.index);
      if (enclosing === null || !/^Select$/i.test(enclosing.name)) continue;

      findings.push(
        finding(context, 'anyInSelect', 'error', match.index, match.index + match[0].length, [], 'Select içinde Any(…)'),
      );
    }
    return findings;
  },
};

/**
 * `Select` içinde bool ÜRETMEK — `ORA-00904: "FALSE": geçersiz belirleyici`.
 *
 * Oracle'da `TRUE`/`FALSE` literali yok. `Where` zaten aynı şartı
 * içeriyorsa EF ifadeyi sabit `TRUE`/`FALSE`'a katlıyor ve hata
 * kesinleşiyor. Yalnızca `==` ve `!=` aranıyor: `<` ve `>` generic
 * söz diziminde de geçiyor ve ayırt etmek metinden mümkün değil.
 */
/*
 * `Ad = <içinde == ya da != geçen ifade>`.
 *
 * `=(?!>)` şart: onsuz lambda oku atama sanılıyor ve eşleşme `x => new C {
 * Kapali = …` diye baştan başlayıp GERÇEK atamayı yutuyor — kural sessizce
 * hiçbir şey bulmuyordu. `[^,;=]` de ikinci `=`i eliyor, yani `==` kendisi
 * atama sayılmıyor.
 */
const COMPARISON_ASSIGN = /(\w+)\s*=(?!>)\s*[^,;=][^,;]*?(?:==|!=)[^,;]*/g;

const booleanInSelect: LinqRule = {
  key: 'booleanInSelect',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const match of codeMatches(context, /\.Select\s*\(/g)) {
      const open = match.index + match[0].length - 1;
      const close = closeParen(context, open);
      if (close === -1) continue;

      const body = context.source.slice(open, close);
      COMPARISON_ASSIGN.lastIndex = 0;

      let assignment = COMPARISON_ASSIGN.exec(body);
      while (assignment !== null) {
        const start = open + assignment.index;
        findings.push(
          finding(context, 'booleanInSelect', 'error', start, start + assignment[0].length, [], assignment[1]),
        );
        assignment = COMPARISON_ASSIGN.exec(body);
      }
    }
    return findings;
  },
};

/**
 * `Query()` bir lambda içinde çağrılamıyor — CS0854, çünkü isteğe bağlı
 * argüman taşıyan bir çağrı ifade ağacına giremiyor. Alt sorgu önce
 * local'e alınmalı.
 */
const queryInLambda: LinqRule = {
  key: 'queryInLambda',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const match of codeMatches(context, /\.Query\s*\(\s*\)/g)) {
      const enclosing = enclosingCall(context, match.index);
      if (enclosing === null) continue;
      // Saran çağrının açılışı ile buranın arasında lambda oku varsa,
      // bu çağrı bir ifade ağacının içinde demektir.
      if (!context.source.slice(enclosing.open, match.index).includes('=>')) continue;

      findings.push(
        finding(context, 'queryInLambda', 'error', match.index, match.index + match[0].length, [], `${enclosing.name}(… => … Query() …)`),
      );
    }
    return findings;
  },
};

const skipTake = patternRule('skipTake', 'warning', /\.(Skip|Take)\s*\(/g, (match) => ({
  detail: `${match[1]}(…)`,
}));

const executeUpdate = patternRule(
  'executeUpdate',
  'warning',
  /\.(ExecuteUpdate|ExecuteDelete)(Async)?\s*\(/g,
  (match) => ({ detail: `${match[1]}${match[2] ?? ''}(…)` }),
);

/* `ids.Contains(x.id)` bir `Where` içindeyse IN listesine çevriliyor ve
   1000'i geçtiğinde ORA-01795. Alıcının önünde nokta olmaması şart:
   `x.ad.Contains("a")` bir LIKE'tır, IN değil. */
const containsList: LinqRule = {
  key: 'containsList',
  run(context) {
    const findings: Finding<RuleKey>[] = [];

    for (const match of codeMatches(context, /(^|[^.\w])(\w+)\.Contains\s*\(/g)) {
      const enclosing = enclosingCall(context, match.index);
      if (enclosing === null || !/^Where$/i.test(enclosing.name)) continue;

      const start = match.index + (match[1] ?? '').length;
      findings.push(
        finding(context, 'containsList', 'warning', start, match.index + match[0].length, [], `${match[2]} → IN (…)`),
      );
    }
    return findings;
  },
};

/**
 * `FromSqlRaw($"…")` — enterpolasyon SQL'e olduğu gibi giriyor, yani
 * enjeksiyon. `FromSqlInterpolated` aynı söz dizimini alıyor ama her
 * deliği BAĞLAMA DEĞİŞKENİNE çeviriyor, dolayısıyla düzeltme birebir.
 */
const rawSqlInterpolation = patternRule(
  'rawSqlInterpolation',
  'error',
  /\.(FromSqlRaw|ExecuteSqlRaw)(Async)?\s*\(\s*\$"/g,
  (match) => ({
    start: match.index,
    end: match.index + 1 + (match[1] as string).length + (match[2] ?? '').length,
    text: `.${match[1] === 'FromSqlRaw' ? 'FromSqlInterpolated' : 'ExecuteSqlInterpolated'}${match[2] ?? ''}`,
    detail: `${match[1]}${match[2] ?? ''}($"…")`,
  }),
);

const dateOnly = patternRule('dateOnly', 'warning', /\b(DateOnly|TimeOnly)\b/g, (match) => ({
  detail: match[1],
}));

const RULES: readonly LinqRule[] = [
  anyAsync,
  anyInSelect,
  booleanInSelect,
  queryInLambda,
  skipTake,
  executeUpdate,
  containsList,
  rawSqlInterpolation,
  dateOnly,
];

export function analyze(source: string): ToolResult<Finding<RuleKey>[]> {
  if (source.trim() === '') return err('linqEmpty');
  return ok(runRules(buildContext(source, scanCSharp(source).spans), RULES));
}
