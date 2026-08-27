import type { ToolCategory, ToolErrorKey, ToolId } from '../tools/types';
import type { Dialect, NoteKey, Unit } from '../tools/date-format/dateFormat';
import type { RuleKey } from '../tools/sql-fix/sqlFix';
import type { RuleKey as LinqRuleKey } from '../tools/linq-11g/linq11g';
import type { RuleKey as CultureRuleKey } from '../tools/turkish-culture/turkishCulture';
import type { RouteReason } from '../tools/errorRouting';

/**
 * Kanonik sözlük.
 *
 * Bu nesnenin ŞEKLİ `Dictionary` tipini üretir; `tr.ts` o tipe uymak zorunda.
 * Yani buraya bir anahtar eklenip Türkçesi yazılmazsa proje DERLENMEZ —
 * eksik çeviri çalışma zamanında değil, derleme zamanında yakalanır.
 *
 * Yerine değer geçen metinler düz dize değil fonksiyon: imzaları da tip
 * kontrolüne giriyor, böylece iki dilde farklı parametre alması imkânsız.
 */
export const en = {
  htmlLang: 'en',

  /**
   * Search-result copy. Kept apart from the interface strings because the
   * audience is different: these are read in a result list by someone who has
   * not seen the site yet, so they name the problem rather than the feature.
   */
  seo: {
    homeTitle: 'Developer tools for the .NET ecosystem',
    homeDescription:
      'Oracle error lookup, IN (…) lists chunked past ORA-01795, bind substitution, mojibake repair, .NET regex. Free, no account, and everything runs in your browser.',
    /** Card blurbs are short by design; the meta description gets the promise. */
    toolDescription: (blurb: string) =>
      `${blurb} Free and instant — it runs in your browser, so nothing is uploaded.`,
  },

  header: {
    searchAria: 'Search tools',
    searchPlaceholder: 'Search tools...',
    toLightTheme: 'Switch to light theme',
    toDarkTheme: 'Switch to dark theme',
    github: 'fsdotnet on GitHub',
    languageAria: 'Language',
  },

  home: {
    /* Başlık üç parça çünkü vurgulu kısmın YERİ dile göre değişiyor:
       İngilizce'de sonda, Türkçe'de başta. İki parçalı şablon bunu kaldırmaz. */
    titleBefore: 'Developer tools for the ',
    titleAccent: '.NET ecosystem',
    titleAfter: '',
    subtitle:
      'SQL to LINQ, JSON to C#, .NET regex, Quartz cron — plus every converter you already reach for. Nothing is uploaded unless a tool genuinely needs a compiler.',
    statReady: (count: number) => `${count} tools, all built`,
    statClient: (count: number) => `${count} run entirely in your browser`,
    statPrivacy: 'No account, no tracking, no upload',
  },

  categories: {
    dotnet: { label: '.NET & Data', blurb: 'The tools no other toolbox has.' },
    converters: { label: 'Converters', blurb: 'Move data between formats without losing your mind.' },
    formatters: { label: 'Formatters', blurb: 'Make unreadable input readable again.' },
    security: { label: 'Security & Tokens', blurb: 'Nothing here ever leaves your browser.' },
    testing: { label: 'Testing & Time', blurb: 'Patterns, schedules and timestamps.' },
  } satisfies Record<ToolCategory, { label: string; blurb: string }>,

  /** Araç ADLARI çevrilmez — teknik terimler ("Base64", "JWT Decoder") her iki
      dilde de aynı okunur. Yalnızca açıklamalar çevrilir. */
  /* Kart tek satır gösterir ve kırpar. Bu yüzden açıklamalar ~45 karakteri
     geçmemeli — uzun cümle ortadan kesilince hem çirkin hem bilgisiz kalıyor. */
  toolDescriptions: {
    base64: 'Encode and decode, URL-safe included.',
    mojibake: 'Repair text broken by wrong encodings.',
    rtf: 'Strip RTF markup, code page decoded correctly.',
    'in-list': 'Build IN (…) lists, chunked past 1000.',
    'ora-errors': 'ORA-xxxxx codes with their real cause.',
    'bind-params': 'Fill :binds with values to run the query.',
    'sql-diff': 'Compare two queries, differences highlighted.',
    unicode: 'Code points, invisible characters, NFC/NFD.',
    case: 'camelCase, snake_case, PascalCase and back.',
    'tr-data': 'Turkish test data with valid TCKN and IBAN.',
    'json-to-csharp': 'Records, classes or TypeScript interfaces.',
    'sql-to-linq': 'SELECT to query or method syntax.',
    'xml-json': 'Both ways, attributes and CDATA preserved.',
    'csv-json': 'Table to JSON array or INSERT rows.',
    epoch: 'Unix seconds, millis and .NET ticks.',
    'sql-format': 'Indent a one-liner, or minify it.',
    'code-format': 'Format or minify JSON, XML, HTML, CSS.',
    jwt: 'Header, payload and claims — locally.',
    hash: 'CRC32, MD5, SHA family and HMAC.',
    uuid: 'Bulk v4 random or v7 time-ordered IDs.',
    regex: 'The real .NET engine, next to JavaScript.',
    cron: 'Unix and Quartz, with the next runs.',
    'http-status': 'Codes, headers and .NET constants.',
    'date-format': 'Oracle, .NET, Delphi and dayjs patterns.',
    'sql-fix': 'Find why a query will not run, and fix it.',
    'linq-11g': 'EF Core patterns that break on Oracle 11g.',
    'pas-sql': 'Pull embedded SQL out of a Delphi unit.',
    'oracle-identity': 'Sequence and trigger for an auto key.',
    'turkish-culture': 'Code that breaks only under tr-TR.',
    'guid-raw': 'The byte order that silently loses rows.',
    'ddl-entity': 'CREATE TABLE to an entity and its mapping.',
    'odp-call': 'Ref cursor call skeleton, written correctly.',
    'conn-string': 'Take one apart, build one, mask the password.',
    'merge-sql': 'Upsert without hand-writing USING dual.',
  } satisfies Record<ToolId, string>,

  /**
   * Aracın altındaki açıklama bölümü — arama sonucundan gelen ziyaretçi için.
   *
   * Sekiz araçta var, hepsinde değil: bunlar katalogda başka yerde karşılığı
   * olmayanlar, yani metnin gerçekten bir şey anlattığı yerler. Genel bir
   * dönüştürücüye "Base64 nedir" yazmak kimseye bir şey katmaz.
   */
  toolGuides: {
    mojibake: {
      heading: 'Why Turkish text turns into Ã¼ and ÅŸ',
      body: [
        'Mojibake is what you get when text encoded in UTF-8 is read back as if it were something else — usually Windows-1252 or Windows-1254. UTF-8 stores "ü" as two bytes, 0xC3 0xBC. Read one byte at a time as Windows-1252, those two bytes are the characters Ã and ¼, so a single letter becomes a pair. Every Turkish character with a diacritic breaks the same way: ç becomes Ã§, ş becomes ÅŸ, ğ becomes ÄŸ.',
        'The damage almost always happens at a boundary: a database column declared with the wrong character set, an HTTP response missing charset=utf-8, an Excel export, or a legacy client that predates UTF-8. Because the bytes are still there — just reinterpreted — the text can usually be recovered exactly, by encoding it back to bytes with the wrong code page and decoding those bytes as UTF-8.',
        'This tool does that, and it handles the harder second case too: text that was mangled twice, where the correct character survived with an orphan lead byte glued to it (Tüürkçe rather than TÃ¼rkÃ§e). It repairs the input in place and reports how many passes were needed, so you can tell a single corruption from a repeated one.',
      ],
      faq: [
        {
          q: 'Is any information lost?',
          a: 'Usually not. The bytes are intact and only misread, so the repair is exact. Information is lost only when the wrong code page had no character for a byte and replaced it with a question mark or U+FFFD — at that point the original is gone and no tool can recover it.',
        },
        {
          q: 'How do I stop it happening again?',
          a: 'Fix the boundary, not the data. Declare charset=utf-8 on responses, use NVARCHAR2 or an AL32UTF8 database character set on Oracle, and set the client encoding explicitly rather than relying on the operating system default — which on a Turkish Windows install is Windows-1254, not UTF-8.',
        },
      ],
    },

    'ora-errors': {
      heading: 'ORA codes, and what actually causes them',
      body: [
        'Oracle error messages name the symptom, not the cause. ORA-01722 says "invalid number", which is true and unhelpful: the real question is which column, and why a string reached it. This list pairs each code with the situation that produces it in practice, so you can start from the likely cause instead of the message.',
        'It searches on the code, the message text and the cause, so a half-remembered fragment is enough — type "table or view" and you get ORA-00942, type 1795 and you get the expression limit. Codes are grouped by area (data, object, constraint, resource) because errors that look unrelated often come from the same place.',
      ],
      faq: [
        {
          q: 'Why do I get ORA-01722 on a column that only holds numbers?',
          a: 'Almost always an implicit conversion: comparing a VARCHAR2 column to a number literal makes Oracle convert every row, and one row is not numeric. Compare against a string, or fix the column type.',
        },
        {
          q: 'What is the difference between ORA-00942 and ORA-01031?',
          a: 'Oracle reports "table or view does not exist" for objects you cannot see, whether or not they exist — hiding existence from unprivileged users. ORA-01031 means you can see the object but lack the specific privilege for the operation.',
        },
      ],
    },

    'in-list': {
      heading: 'ORA-01795: the 1000-expression limit on IN lists',
      body: [
        'Oracle allows at most 1000 expressions in a literal IN list. Paste 1200 ids from a spreadsheet and the query fails with ORA-01795 — not slowly, not partially, but immediately at parse time. The limit applies only to literal lists; IN (SELECT …) against a table or a collection has no such ceiling.',
        'When you cannot use a subquery — a one-off investigation, a support ticket, ids that exist only in an email — the fix is to split the list and OR the parts together. This tool does the split, deduplicates, drops the trailing blank line every spreadsheet paste ends with, and quotes each value only when it needs quoting.',
        'That last part matters more than it looks. A code like 007 is not the number 7: leave it unquoted and Oracle drops the leading zeros, the comparison silently fails, and the row you were looking for is simply absent from the result. Values that look numeric but start with a zero stay quoted.',
      ],
      faq: [
        {
          q: 'Is splitting the list slower than one IN?',
          a: 'Slightly, but the alternative is a query that does not run at all. If the list is large and recurring, load the ids into a global temporary table and join instead — that scales past any list length and lets the optimiser see a cardinality.',
        },
        {
          q: 'Does SQL Server have the same limit?',
          a: 'No fixed limit of 1000, but very long IN lists hurt there too: each one produces a distinct query plan, filling the plan cache. Chunking is still worth doing above a few thousand values.',
        },
      ],
    },

    'bind-params': {
      heading: 'Turning a logged query and its bind values into something runnable',
      body: [
        'Application logs give you the query with :placeholders on one line and the parameter values on another. To reproduce the problem in a SQL client you have to put them back together by hand, which is tedious and easy to get wrong on the sixth parameter. This tool does the substitution and formats each value for the target dialect.',
        'It only recognises real bind variables. A colon inside a string literal or a comment is not a bind, and neither is the :mi in a format mask — TO_CHAR(tarih, \'HH24:MI\') contains no parameter, though a naive parser sees one. Oracle itself makes the opposite mistake and raises ORA-01745 when a genuine bind is named like a reserved word.',
        'The output is for debugging only. Keep the binds in production code: substituting values into SQL text is how injection happens, and it also throws away the shared cursor, so every call reparses.',
      ],
      faq: [
        {
          q: 'How are dates handled?',
          a: 'A date-only value becomes DATE \'2026-08-24\' and a value with a time becomes TO_DATE with an explicit format mask, so the result does not depend on the session NLS_DATE_FORMAT.',
        },
        {
          q: 'What is ORA-01745?',
          a: '"Invalid host/bind variable name". Usually a bind named after a reserved word, or a colon that Oracle read as a bind when you meant a literal — the :mi case above is the classic one.',
        },
      ],
    },

    case: {
      heading: 'Turkish casing, and why "file".ToUpper() can return FİLE',
      body: [
        'Turkish has two i letters. Dotless ı uppercases to I, and dotted i uppercases to İ. A culture-aware uppercase under tr-TR therefore turns "file" into "FİLE" and "KITAP_ID" into "kitap_ıd" on the way back down. That is correct for Turkish prose and wrong for everything else.',
        'It becomes a bug the moment an identifier passes through it: a column name, a file extension, an HTTP header, a culture code. In .NET, ToUpper() and ToLower() use the current culture by default, so the same code produces different results depending on the machine it runs on — which is why the failure usually appears in production and not on the developer laptop.',
        'This converter shows both results side by side. Anything that is an identifier wants invariant casing; only text shown to a human wants the Turkish rules.',
      ],
      faq: [
        {
          q: 'What should I use in C#?',
          a: 'ToUpperInvariant() and ToLowerInvariant() for identifiers, and string.Equals(a, b, StringComparison.OrdinalIgnoreCase) for comparisons. Reach for the culture-aware overloads only when the result is displayed to a person.',
        },
        {
          q: 'Does JavaScript have the same problem?',
          a: 'Not by default: toUpperCase() is locale-independent, so it never produces İ. Only toLocaleUpperCase(\'tr\') does — which means the bug is opt-in in the browser and opt-out in .NET.',
        },
      ],
    },

    rtf: {
      heading: 'Extracting plain text from RTF without breaking Turkish',
      body: [
        'RTF does not store text as UTF-8. Non-ASCII characters are written as \\\'hh escapes — a single byte in whatever code page the document declares with \\ansicpg. Strip the markup with a regular expression and you keep those bytes but lose the code page, so Turkish characters decode against the wrong table and "Tanı" comes out as "Taný".',
        'This converter reads the declared code page and decodes the byte runs against it, which is why Turkish survives. It also accumulates consecutive escapes before decoding, so a multi-byte character in a legacy code page is not split into two wrong ones.',
        'Where the document declares no code page at all, the tool says so and states which one it assumed, rather than guessing silently. You can override the choice if you know the source.',
      ],
      faq: [
        {
          q: 'Which code page do Turkish RTF files use?',
          a: 'Usually cp1254 (Windows Turkish). Files produced by older Delphi or Office versions on a Turkish Windows install often declare it; some declare cp1252 by mistake, which is exactly the case where overriding helps.',
        },
        {
          q: 'Does it keep formatting?',
          a: 'No — the output is plain text by design. Bold, tables and colours are dropped; line breaks and paragraph boundaries are preserved.',
        },
      ],
    },

    unicode: {
      heading: 'Finding the character you cannot see',
      body: [
        'Two strings that look identical on screen can be different bytes, and the difference is invisible: a non-breaking space instead of a space, a zero-width joiner left behind by a copy from Word, a right-to-left override, or the same accented letter written as one code point in one string and two in the other. Comparisons fail, keys do not match, and nothing in the text looks wrong.',
        'This inspector lists every code point with its category and flags the ones that matter: invisible characters, bidirectional overrides — which can make the displayed order differ from the real order — and text that is not in NFC form. Combining marks are the quiet one: "ğ" can be a single code point or "g" plus a combining breve, and only one of those equals what is in your database.',
        'It can also normalise to NFC or strip the invisible characters, replacing space-class ones with a plain space rather than deleting them, so word boundaries survive.',
      ],
      faq: [
        {
          q: 'Why does my string comparison fail when the text looks the same?',
          a: 'Most often NFC versus NFD. Text copied from macOS is frequently decomposed; text from Windows is usually composed. Normalise both sides before comparing, and store one form consistently.',
        },
        {
          q: 'Are bidirectional overrides dangerous?',
          a: 'They can be. In source code they let the displayed order of a line differ from the order the compiler reads — the Trojan Source class of attack. Seeing them flagged in a code review is the point.',
        },
      ],
    },

    'tr-data': {
      heading: 'Turkish test data that passes real validation',
      body: [
        'Test data made of random digits fails the first validator it meets. A Turkish national identity number has two check digits computed from the first nine, and an IBAN carries a MOD-97-10 checksum over the whole rearranged string. Any generator that ignores those produces values your own form rejects.',
        'Every TCKN and IBAN this tool emits passes its real checksum, so you can paste them into a form, a seed script or a test fixture and get past validation. They are still fictional — the algorithm being correct does not make the number belong to anyone.',
        'Output comes as a table, JSON or CSV, so the same records can go into a fixture file, a request body or a spreadsheet without reformatting.',
      ],
      faq: [
        {
          q: 'How is the TCKN check digit calculated?',
          a: 'The tenth digit comes from the odd-position digits times seven minus the even-position digits, modulo ten; the eleventh is the sum of the first ten, modulo ten. Both are computed here, so the results validate.',
        },
        {
          q: 'Could a generated number belong to a real person?',
          a: 'A checksum-valid number is only structurally valid — it says nothing about whether it was ever issued. Treat the output as test data and never as a real identity.',
        },
      ],
    },

    'date-format': {
      heading: 'The same date, four incompatible patterns',
      body: [
        'Every one of these dialects spells a date pattern with the same handful of letters, and each of them means something different by them. In Oracle the month is MM and the minute is MI. In .NET the month is MM and the minute is mm. In Delphi the month is mm and the minute is nn — so a Delphi pattern written as hh:mm prints the hour followed by the month, and it does it silently, because the pattern is perfectly valid.',
        'The second trap is the hour. Oracle reads a bare HH as HH12, not as 24-hour: a timestamp at 13:05 prints as 01:05 with no AM/PM anywhere to give it away. Delphi reads hh as 24-hour, but flips to 12-hour if the same pattern happens to contain am/pm. Only .NET and dayjs make the distinction visible, with uppercase H for 24-hour and lowercase h for 12.',
        'The third is the separator. In .NET and Delphi, / and : are not characters — they are placeholders for the culture’s date and time separators. Under tr-TR the date separator is a dot, so dd/MM/yyyy prints 24.08.2026. This tool quotes the slash in its output for that reason, and leaves the colon alone because almost every culture keeps it.',
        'Rather than mapping each dialect to each of the others, the pattern is parsed into named fields first — year, padded month, 24-hour hour — and then written back out in the target dialect. That is also why the tool can tell you when a field simply has no equivalent: .NET has no quarter or ISO week specifier, and Oracle has no way to say "milliseconds, but trim the trailing zeros".',
      ],
      faq: [
        {
          q: 'Why did FM appear in the Oracle output?',
          a: 'Because a field in the source pattern was unpadded. Without FM, Oracle zero-pads numbers and pads MONTH and DAY with spaces out to nine characters. FM is a toggle rather than a prefix, so a second FM turns padding back on — which is why FMDD.FMMM.YYYY prints the day unpadded and the month padded, a result almost nobody intends.',
        },
        {
          q: 'Why does the .NET output start with a percent sign?',
          a: 'A .NET format string of exactly one character is read as a standard format specifier, not a custom one: ToString("M") gives "August 24", not "8". Writing %M forces it to be read as the custom month specifier. The tool adds the percent sign only when the whole pattern collapses to a single character.',
        },
        {
          q: 'Will the month and day names come out in Turkish?',
          a: 'That depends on the runtime, not the pattern. Oracle takes them from NLS_DATE_LANGUAGE, .NET from the thread culture, dayjs from the loaded locale. The sample output here uses the language of this page, so it shows you the shape rather than promising you the wording.',
        },
      ],
    },

    'sql-fix': {
      heading: 'Why a query that looks correct refuses to run',
      body: [
        'Most queries that will not run are not broken grammar. They are damaged in transit. A query copied out of Word arrives with curly quotes and non-breaking spaces; one copied from a chat window brings an SQL*Plus prompt or a markdown fence with it; one built by concatenating strings in Delphi or C# loses the space at the seam, so a table name and the next clause become one word. Oracle reports these as ORA-00911, invalid character — which is true, and tells you nothing, because the character it is complaining about is invisible on screen.',
        'The second group is dialect. A query written for SQL Server is valid SQL and still fails on Oracle: square brackets around identifiers, AS in front of a table alias, @ in front of a parameter, ISNULL instead of NVL, and double quotes around a text value — which Oracle reads as a column name and answers with ORA-00904. SELECT TOP and OFFSET / FETCH are the same story one level up: they need to be rewritten as ROWNUM, not renamed.',
        'This tool is a linter with auto-fixes, not a repair service. Every finding is listed on its own and applied on its own, and it says which ones it will not touch. That is a deliberate choice: a query that errors is a loud failure and you see it, while a query that was quietly "fixed" is a silent one and returns the wrong rows. Deleting a stray comma is safe; changing the shape of a statement is your decision, not the tool’s.',
        'What it cannot do is anything that needs the database. A misspelled table or column, an ambiguous column across two joined tables, a type that will not convert — those need the schema, and the schema is not here. Nothing you paste leaves the browser, which is the other half of the same design: internal queries have no business being uploaded to a website to be checked.',
      ],
      faq: [
        {
          q: 'Is my query uploaded anywhere?',
          a: 'No. Every check runs in this tab; there is no request to a server and no analytics on the content. That matters here more than on most tools, because the queries people want to check are usually the ones they are least allowed to share.',
        },
        {
          q: 'Why did it only report one finding on my Delphi query?',
          a: 'Because the whole input was still a quoted string from a .pas file. Until that is unwrapped, every other check would be examining one long text literal and everything it said would be wrong. Apply that fix, move the result into the input, and the query gets checked properly on the second pass.',
        },
        {
          q: 'It found nothing but the query still fails. Now what?',
          a: 'Then the problem needs the database. The most common causes are a name that does not exist, a column that exists in both joined tables (ORA-00918), a value that will not convert (ORA-01722), or missing privileges. None of those can be decided from the text of the query alone.',
        },
      ],
    },

    'linq-11g': {
      heading: 'EF Core code that compiles and then fails on Oracle 11g',
      body: [
        'Every pattern this tool reports is valid C#. It builds, the unit tests pass against an in-memory provider, and then the query reaches an 11g database and throws. The message that comes back names the symptom rather than the cause: ORA-00904: "FALSE": invalid identifier tells you nothing about the fact that you wrote a comparison inside a Select projection, and CS0854 does not mention that the call it objects to was a Query() two lines up.',
        'The largest group is things Oracle 11g simply does not have. It has no boolean type, so EF Core cannot emit TRUE or FALSE — a projection like Closed = x.status == 3 becomes a literal in the SELECT list and the statement dies. It has no OFFSET … FETCH either, which arrived in 12c, so Skip and Take generate SQL the server will not parse. AnyAsync fails for a related reason on the provider versions in wide use.',
        'The second group is about where a construct sits rather than what it is. Any(…) is translated to EXISTS, but only inside a Where predicate; the same call inside a Select is not translatable. Query() is fine anywhere except inside a lambda that becomes an expression tree, because expression trees cannot contain a call with optional arguments. That is why this tool looks at the enclosing call rather than matching a method name — and why it stays quiet on list.Any(), which never goes near SQL.',
        'Nothing here needs a schema or a compiler, so nothing you paste leaves the browser. The cost of that is precision: the checks read text, so they are written to under-report rather than over-report. A linter that cries wolf gets switched off, and then the real finding goes unseen too.',
      ],
      faq: [
        {
          q: 'Why does it not flag Any() inside Where?',
          a: 'Because that one is correct. Any is turned into an EXISTS subquery when it appears in a Where predicate, which is exactly the supported shape. Reporting it would make the tool wrong in the most common valid case.',
        },
        {
          q: 'It rewrote AnyAsync to FirstOrDefaultAsync(…) != null — is that always safe?',
          a: 'For the expression itself, yes: await binds tighter than !=, so the result stays a bool in an if, in an assignment and in a return. What changes is the work the database does — FirstOrDefaultAsync fetches a row rather than answering a yes/no, so on a wide table it is worth projecting a single column first.',
        },
        {
          q: 'We are on 12c or 19c. Is this still useful?',
          a: 'Partly. Skip / Take and identity columns are fine from 12c on, so those findings become noise. The ones about where a construct sits — Any in a projection, a bool produced in Select, Query() inside a lambda — are not version-specific and still apply.',
        },
      ],
    },

    'pas-sql': {
      heading: 'Getting the SQL out of a Delphi unit',
      body: [
        'In an older VCL application the queries do not live in a data layer. They are assembled inside form event handlers, one string literal per line, joined with +, and interrupted wherever a value has to be pasted in. Reading them is the first step of any migration and it is pure tedium: you are reassembling by eye something a machine can reassemble exactly.',
        'The reassembly has one detail worth automating on its own. Where two literals meet, the space at the seam is either doubled or missing, and the missing case is silent — from siparis + where kanal_id = 5 becomes from sipariswhere kanal_id = 5, which Oracle reports as an invalid identifier somewhere else entirely. The tool restores that space using the same rule the SQL linter uses to detect it.',
        'The second thing it separates is how values get in. A bind variable (:kanal_id) is a placeholder the database sees; an interpolated Pascal expression (+ IntToStr(FUyeId)) is text pasted into the statement before the database sees anything. They look similar in the source and they are not remotely the same thing — one is parameterised, the other is an injection point and a hard-parse generator. The output marks interpolated fragments in place and lists them separately.',
        'The parser understands Pascal string expressions and nothing else. That is deliberate: what you are looking for is the expression, not the control flow around it, and a full Object Pascal parser would be a project of its own for no extra benefit here.',
      ],
      faq: [
        {
          q: 'Does the extracted SQL run as-is?',
          a: 'Where the query was fully parameterised, yes. Where a value was interpolated you will see a {…} marker instead — that is the tool refusing to invent a value it cannot know. Replace each marker with a bind variable, which is what the migrated code should use anyway.',
        },
        {
          q: 'Why is the text of the query not left exactly as written?',
          a: 'Because as written it spans a dozen literals with inconsistent whitespace. Runs of spaces are collapsed and clause keywords get a space around them, which is the smallest change that makes the result readable and runnable. Nothing inside a string literal is touched.',
        },
        {
          q: 'Can I paste a whole unit?',
          a: 'Yes. Every string expression that looks like SQL is reported as its own block, with the source line range and the variable it was assigned to, so a unit with fifteen queries comes back as fifteen blocks rather than one merged blob.',
        },
      ],
    },

    'oracle-identity': {
      heading: 'Auto-increment on Oracle, before identity columns existed',
      body: [
        'Oracle had no identity column until 12c. Before that an auto-incrementing primary key is two objects: a SEQUENCE that produces numbers and a BEFORE INSERT trigger that puts one into the row. Everyone who writes this by hand eventually forgets the same clause, and the failure it causes does not look like a missing clause.',
        'That clause is WHEN (NEW.id IS NULL). Without it the trigger overwrites the key on every insert, including inserts that supplied one deliberately. Data migration is where this surfaces: you load rows with their original keys, the trigger silently replaces them, and every foreign key in the imported set now points at the wrong row. Nothing errors. With the clause, an explicit key is respected and only NULL gets a generated value.',
        'The second trap is the name. Oracle 11g allows 30 characters for an identifier, and the limit applies to the objects being created — not to your table. A table called kurum_disi_sevk_talep_kaydi is 27 characters and perfectly legal, but SEQ_ in front of it is 31 and TRG_…_BI is 34. ORA-00972 arrives when the script runs, which usually means during a deployment rather than while you are writing it.',
        'From 12c on none of this is necessary: an identity column does the same job in one line, without a trigger firing per row. GENERATED BY DEFAULT ON NULL AS IDENTITY keeps the same explicit-value behaviour the WHEN clause was giving you.',
      ],
      faq: [
        {
          q: 'Why CACHE 20 rather than NOCACHE?',
          a: 'NOCACHE writes to the data dictionary for every single number, which becomes a serialisation point under concurrent inserts. CACHE is the default for good reason. The cost is gaps: unused cached numbers are lost when the instance restarts, so the key is an identifier and not a count. A rolled-back insert also never returns its number, cache or not.',
        },
        {
          q: 'Should the trigger use :NEW.id := seq.NEXTVAL instead?',
          a: 'It works from 11g onward and is slightly faster. SELECT … INTO is generated here because it also works on older releases, and a migration script usually has to run on more than one environment.',
        },
        {
          q: 'Can I drop the trigger and let the application set the key?',
          a: 'Yes, and on a busy table it is often better: the application calls seq.NEXTVAL, keeps the value, and avoids a per-row trigger plus a round trip to read the key back. The trigger exists so that inserts written elsewhere — a script, a report tool, an old form — still get a key.',
        },
      ],
    },

    'turkish-culture': {
      heading: 'Why "file".ToUpper() is FİLE on a Turkish server',
      body: [
        'Turkish has two letter i. The dotted one, i, capitalises to İ; the dotless one, ı, capitalises to I. So under the tr-TR culture "file".ToUpper() produces FİLE, and a comparison with "FILE" fails. Nothing throws. The code works on the developer machine, passes review, and starts behaving differently the day it runs on a server whose culture is Turkish.',
        'The same class of problem covers numbers and dates. The decimal separator in tr-TR is a comma, so double.Parse("3.14") either throws or reads 314 depending on the value. The date separator is a full stop, and in a .NET format string / is not a slash but a placeholder for whatever the culture uses — so "dd/MM/yyyy" prints dots. None of these are bugs in .NET; they are the documented behaviour of the culture-sensitive overloads, which are the ones you get when you do not say otherwise.',
        'That is what the checks here look for: the overload that did not say. ToUpper() without a culture, StartsWith with only a string, Parse without an IFormatProvider, RegexOptions.IgnoreCase without CultureInvariant. Roslyn analyzers CA1305, CA1307 and CA1310 cover part of the same ground; this tool is the version you can point at a snippet in a code review without configuring anything.',
        'The rule of thumb is short: if a machine reads the value, use the invariant or ordinal overload. If a person reads it, use the culture-aware one. Almost every string in an identifier, a file name, a database key or a protocol is read by a machine.',
      ],
      faq: [
        {
          q: 'Is ToUpperInvariant always the right fix?',
          a: 'For comparison and storage, yes — that is what invariant is for. For text shown to a user it is the wrong one: a Turkish reader expects İstanbul, not ISTANBUL. The distinction is who reads the result, not which is safer.',
        },
        {
          q: 'Why flag StartsWith? It looks like a plain prefix check.',
          a: 'Because the single-argument overload is culture-sensitive by default, which surprises almost everyone. It is also measurably slower than the ordinal comparison, since it runs the full collation. Analyzer CA1310 flags the same call.',
        },
        {
          q: 'Our server runs with InvariantGlobalization enabled. Does this still matter?',
          a: 'Less, but not none. Invariant globalization mode removes ICU and makes culture-sensitive operations behave like the invariant culture — which is fine until the same code is reused in a service that does not set it, or a client library sets CurrentCulture explicitly. Writing the intent down costs nothing and survives the move.',
        },
      ],
    },

    'guid-raw': {
      heading: 'The GUID that is in the database but never found again',
      body: [
        'Oracle has no GUID type. A GUID is stored in a RAW(16) column, which holds whatever sixteen bytes you give it and asks no questions. .NET, meanwhile, has two ways of turning a Guid into bytes and they disagree with each other — which is where the rows go missing.',
        'Guid.ToByteArray() writes the first three fields little-endian, a compatibility decision inherited from COM. So the GUID 00112233-4455-6677-8899-aabbccddeeff becomes the bytes 33 22 11 00 55 44 77 66 88 99 aa bb cc dd ee ff. Guid.ToString("N") writes exactly what you read: 00112233445566778899aabbccddeeff. Insert one row through a parameter carrying ToByteArray() and another through HEXTORAW of the string form, and the same GUID is now two different keys.',
        'Nothing errors, at any point. The insert succeeds, the select returns nothing, and the bug is usually found much later by someone comparing a screen to a table. If you have inherited a schema where both conventions are already present, the byte-swapped and text-order forms are shown side by side here so you can tell which one a given row used.',
        'The fix for new code is to pick one convention and write it down. Storing the text form in a RAW via HEXTORAW is the one that stays readable in SQL*Plus and in a report; storing ToByteArray() is the one that comes for free from a parameter. Neither is wrong — mixing them is.',
      ],
      faq: [
        {
          q: 'Which order does SYS_GUID() produce?',
          a: 'SYS_GUID() returns 16 bytes and Oracle prints them in the order they are stored, so it matches the text-order line here. A GUID generated in the database and one generated by Guid.NewGuid() then written with ToByteArray() are not directly comparable.',
        },
        {
          q: 'Should I use CHAR(36) instead and avoid all this?',
          a: 'It removes the ambiguity at the cost of 36 bytes per row instead of 16, plus a larger index. On a small table that is a fair trade for readability. On a large one, RAW(16) with a written-down convention is the better answer.',
        },
        {
          q: 'Does the same problem exist on SQL Server?',
          a: 'A related one. SQL Server uniqueidentifier sorts the bytes in yet another order, so a GUID primary key that looks sequential in .NET is not sequential in the index. That is an ordering problem rather than an identity problem — the rows are still found.',
        },
      ],
    },

    'ddl-entity': {
      heading: 'Why NUMBER is the hard part of scaffolding an Oracle table',
      body: [
        'Oracle has one numeric type. NUMBER covers a boolean flag, a small lookup id, a bigint key and a currency amount, and which of those it is depends entirely on the precision and scale in the declaration. Most scaffolding tools were built against SQL Server, where TINYINT, INT, BIGINT and DECIMAL are separate types, so they either map every NUMBER to decimal or guess.',
        'Neither is free. Mapping everything to decimal makes every key a decimal, which spreads through the domain model and every method signature that touches it. Guessing int is worse: NUMBER(10) holds ten digits and int holds nine, so the overflow arrives with real data rather than in a test. The split used here follows the actual capacity — up to 4 digits short, 9 int, 18 long, above that decimal — and NUMBER(1) becomes bool because that is what a flag column is, though you can turn that off.',
        'Nullability is the other thing the DDL already answers and generators often get wrong. A column without NOT NULL is nullable, full stop; the entity should say so, because a non-nullable property over a nullable column turns a data problem into a null reference much further from the cause. A key column is forced non-nullable regardless, since Oracle enforces that anyway.',
        'The mapping is generated as an IEntityTypeConfiguration rather than attributes. Column names, lengths and requiredness are provider concerns and putting them on the entity spreads Oracle-specific detail through the domain — which is exactly the thing that makes the next database migration expensive.',
      ],
      faq: [
        {
          q: 'Why not use dotnet ef dbcontext scaffold?',
          a: 'Use it when you can — it reads the live schema and gets relationships too. This tool is for the times you have a DDL script and no connection: a change request, a code review, a migration file, or a database you are not allowed to point a tool at.',
        },
        {
          q: 'Are the generated column names right for my project?',
          a: 'HasColumnName is emitted only where the property name differs from the column name. If your context uses a naming convention that already uppercases and snake-cases, those lines are redundant and can be deleted — the entity and the key mapping are still the useful part.',
        },
        {
          q: 'What about foreign keys and navigations?',
          a: 'Not generated. A REFERENCES clause tells you a constraint exists, but not what the navigation should be called, whether it is a collection, or whether the relationship is required — and a wrong navigation is harder to spot than a missing one.',
        },
      ],
    },

    'odp-call': {
      heading: 'Calling an Oracle stored procedure from .NET without the four traps',
      body: [
        'A procedure that returns rows on Oracle does it through a SYS_REFCURSOR output parameter. There is no result set to read: ExecuteReader returns nothing useful, and the cursor has to be taken out of the parameter after ExecuteNonQuery has run. That alone catches most people arriving from SQL Server, but it is the least dangerous of the four, because it fails immediately and obviously.',
        'The dangerous one is BindByName. It defaults to false, which means ODP.NET binds parameters by position, not by name — the order you added them to the collection. Add them in a different order than the signature and you get either ORA-06550 or, far worse, the wrong values bound to the right-looking names. Two NUMBER parameters swapped this way produce a query that runs perfectly and returns the wrong rows.',
        'Third: an OUT VARCHAR2 parameter needs an explicit Size, or you get ORA-06502: buffer too small. IN parameters do not need one, which is exactly why this keeps being forgotten — the same code shape works for input and fails for output.',
        'Fourth: the signature does not say how big a NUMBER is. The generated call uses OracleDbType.Decimal because it cannot overflow. Narrowing to Int32 for an id column is usually right and usually worth doing, but it should be a decision rather than a default that silently truncates a ten-digit key.',
      ],
      faq: [
        {
          q: 'Can I use Dapper or EF Core instead of raw ODP.NET?',
          a: 'For a procedure with a single ref cursor, Dapper handles it cleanly and is less code. This skeleton is for the cases those abstractions do not cover well — several out parameters, a cursor plus scalars, or a package procedure whose signature you need to see mapped explicitly.',
        },
        {
          q: 'Why is the ref cursor not read with ExecuteReader?',
          a: 'Because the procedure does not return a result set; it assigns one to an output parameter. ExecuteNonQuery runs the procedure, the parameter then holds an OracleRefCursor, and GetDataReader() on that gives you the reader.',
        },
        {
          q: 'The procedure has a PL/SQL BOOLEAN parameter and this refuses to map it.',
          a: 'ODP.NET cannot bind PL/SQL BOOLEAN — it is not a SQL type. The usual answers are to change the signature to NUMBER(1), or to add a small wrapper procedure that converts. Neither is a workaround you can skip.',
        },
      ],
    },

    'conn-string': {
      heading: 'Why the same connection string works on one machine and not another',
      body: [
        'Data Source in an Oracle connection string accepts three quite different things, all written as the value of the same key. It can be an Easy Connect address — host:1521/service — which contains everything needed to connect. It can be a full TNS descriptor, the parenthesised DESCRIPTION block, which also contains everything and can additionally carry failover addresses. Or it can be a bare name.',
        'The bare name is where ORA-12154 comes from. A name is not an address; it is a key looked up in tnsnames.ora on the machine doing the connecting. So the connection string is identical on the developer laptop and the application server, and only one of them can resolve it. Nothing in the string itself hints at this, which is why the tool names the kind explicitly rather than just listing the fields.',
        'The second thing worth seeing is the password. It sits in the string in plain text, and connection strings get pasted into tickets, chat messages and screenshots constantly. The masked line here is the one that is safe to share — same string, same structure, no secret.',
        'Everything is parsed in the browser. That matters more for this tool than for most: a connection string is, by construction, a credential.',
      ],
      faq: [
        {
          q: 'Should I use Easy Connect or a descriptor?',
          a: 'Easy Connect for a single host — it is shorter and self-contained, so there is nothing to deploy alongside it. A descriptor when you need more than one address, a failover or load-balancing policy, or a non-default connect timeout. A TNS alias only when an administrator owns the file and wants to change the target without touching the application.',
        },
        {
          q: 'Is turning pooling off ever right?',
          a: 'Rarely. Oracle connection setup is expensive enough that a short request spends most of its time in the handshake. The cases that justify it are long-lived batch processes and debugging a pool exhaustion problem — and the second one is a diagnosis, not a fix.',
        },
        {
          q: 'What is the difference between SERVICE_NAME and SID?',
          a: 'A SID names a single database instance; a service name names a service that may be provided by several instances, which is what makes RAC and failover possible. New code should use SERVICE_NAME. SID still appears in older descriptors and still works.',
        },
      ],
    },

    'merge-sql': {
      heading: 'The two things everyone gets wrong in an Oracle MERGE',
      body: [
        'MERGE is the statement you want when a row should be inserted if it is new and updated if it is not — one round trip, one lock, no race between a SELECT and an INSERT. It is also verbose enough that most people copy it from the last place they wrote it, which is how the same two mistakes keep travelling.',
        'The first is the source. USING does not take a value list; it takes a table. On Oracle that means wrapping the values in a SELECT over dual: USING (SELECT :id AS ID FROM dual) src. Written without it the statement simply does not parse, so this one is loud.',
        'The second is quiet and worth knowing: a column that appears in the ON clause cannot be updated. Oracle answers ORA-38104, columns referenced in the ON clause cannot be updated. The key is already how the row was found, so setting it again is meaningless — but it is easy to include it when you paste the same column list into both halves. This builder leaves key columns out of the UPDATE and tells you it did, because dropping them silently would hide a real intent.',
        'One thing MERGE does not give you is a guarantee against duplicates. If two sessions merge the same new key at the same time, both can miss the match and both can insert. A unique constraint is what actually prevents that; MERGE reduces the window, it does not close it.',
      ],
      faq: [
        {
          q: 'Should I use MERGE or an INSERT with an exception handler?',
          a: 'MERGE for a set of rows or when the update genuinely has work to do. The INSERT … EXCEPTION WHEN DUP_VAL_ON_INDEX pattern is fine for a single row and is often faster, because the common case is one statement with no matching step.',
        },
        {
          q: 'Can I merge more than one row at a time?',
          a: 'Yes, and that is where MERGE earns its keep. Replace the SELECT over dual with a real query or a table collection, and the ON clause matches per row. The single-row form generated here is the starting point, not the limit.',
        },
        {
          q: 'Why is there no DELETE branch?',
          a: 'WHEN MATCHED THEN UPDATE … DELETE WHERE exists, but it deletes only rows the update just touched, which surprises people often enough to be worth writing separately and deliberately.',
        },
      ],
    },

    jwt: {
      heading: 'What a decoded JWT does and does not tell you',
      body: [
        'A JSON Web Token is not encrypted. The header and payload are base64url text, which means anyone holding the token can read every claim in it — the user id, the roles, the tenant, whatever was put there. Decoding it proves nothing about whether it is genuine; it only shows what it says.',
        'What makes a token trustworthy is the signature, and verifying that needs the key. A tool running in your browser does not have your signing key and should not ask for it, so this decoder deliberately stops at reading. It shows the algorithm from the header and whether the token has expired, and it says plainly that the signature was not checked. A decoder that implied otherwise would be worse than useless.',
        'Two claims are worth reading every time. exp is an expiry in Unix seconds, and a token that looks valid but is an hour old is the most common cause of an unexpected 401. nbf is not-before, which produces the same 401 from the opposite direction and is usually a clock-skew problem between two servers rather than a bug.',
        'Because tokens are credentials, nothing here is uploaded. That is the whole reason this decoder exists next to the online ones: pasting a production token into a page that posts it somewhere is a real incident, and it has happened to real teams.',
      ],
      faq: [
        {
          q: 'Can I verify the signature here?',
          a: 'No, and that is deliberate. Verification needs the signing secret or public key. Sending a secret to a web page — even one that promises to run locally — is not a habit worth building, so the tool does not offer a box for it.',
        },
        {
          q: 'The token decodes but the API rejects it.',
          a: 'Check exp and nbf against the server clock first, then the aud and iss claims, which are validated by default in most .NET setups and produce the same generic 401. After that it is the signature, which means the key or the algorithm rather than the token content.',
        },
        {
          q: 'Is it safe to put sensitive data in a JWT payload?',
          a: 'No. Anyone who holds the token can read it, including the browser it is stored in and anything that logs a request header. A JWT proves who the caller is; it is not a place to carry anything the caller should not see.',
        },
      ],
    },

    hash: {
      heading: 'Which hash for what, and why MD5 is hand-written here',
      body: [
        'The browser gives you SHA-1, SHA-256, SHA-384 and SHA-512 through WebCrypto and refuses everything else. MD5 is not in the API at all — the standards group left it out on purpose, because it is broken for anything security-related and having it available invites misuse. CRC32 is not there either, for the opposite reason: it is not a cryptographic function at all.',
        'Both are still needed. MD5 turns up constantly in checksums of existing files, in legacy protocol handshakes and in database rows written years ago; you cannot verify those without computing it. So MD5 and CRC32 are implemented here directly and checked against the RFC 1321 and RFC 2202 vectors, which is the only way to trust a hand-written hash.',
        'The choice between them is not about strength but about job. CRC32 detects accidental corruption in a transfer and is fast and tiny; it is trivially forgeable, so it never guards anything. SHA-256 is the default for integrity and signatures. HMAC is the one to use when a shared secret is involved — hashing key + message with a plain hash is a real vulnerability class, and HMAC exists precisely to avoid it.',
        'None of these belong anywhere near a password. Fast is the wrong property for password storage: bcrypt, scrypt, Argon2 and PBKDF2 are slow on purpose. A SHA-256 of a password is not much better than the password.',
      ],
      faq: [
        {
          q: 'Is MD5 ever acceptable?',
          a: 'For non-adversarial checksums, yes — verifying a file downloaded over a flaky link, or matching against an existing MD5 you did not choose. Never for signatures, passwords, tokens or anything where someone benefits from a collision. Collisions in MD5 are cheap to produce today.',
        },
        {
          q: 'Why does the same input give a different hash than my tool?',
          a: 'Almost always encoding or line endings. Text is hashed here as UTF-8 without a byte order mark; a file saved as UTF-8 with a BOM or with CRLF line endings has different bytes and therefore a different hash. The bytes are what is hashed, not the characters.',
        },
        {
          q: 'Does anything leave the browser?',
          a: 'No. That matters here because the inputs are often keys, tokens and file contents. SHA runs through the browser WebCrypto implementation; MD5 and CRC32 run in JavaScript in the same tab.',
        },
      ],
    },

    regex: {
      heading: 'Where the .NET regex engine and JavaScript quietly disagree',
      body: [
        'Some .NET patterns simply do not compile in JavaScript, and those are the easy ones — you find out immediately. Balancing groups are the clearest example: (?<open>\\()+(?<-open>\\))+(?(open)(?!)) matches balanced parentheses in .NET and is a syntax error in JavaScript, because JavaScript has neither the subtraction construct nor conditional matching.',
        'The dangerous differences are the ones that compile in both and then behave differently. In .NET, \\d matches any Unicode decimal digit, including Arabic-Indic ٤٢, while in JavaScript it is ASCII 0-9 unless you add the u flag and use \\p{Nd}. \\w includes Unicode letters in .NET and is ASCII in JavaScript. And $ in .NET also matches before a trailing newline, so a pattern that validates a form field passes with a stray line ending that JavaScript would reject.',
        'The one that catches Turkish projects specifically is RegexOptions.IgnoreCase, which follows the thread culture. Under tr-TR, I and i are different letters, so a case-insensitive pattern stops matching what you expect. RegexOptions.CultureInvariant is the fix, and it is worth setting by default on anything that is not matching human-facing text.',
        'This tool runs both engines side by side — the real System.Text.RegularExpressions through the API, and JavaScript locally — and lists the constructs in your pattern where the two are known to differ. When the API is unavailable it falls back to the JavaScript engine alone and says so, because a silent single-engine answer would be the misleading case.',
      ],
      faq: [
        {
          q: 'Why does this one tool need a server?',
          a: 'Because there is no way to run System.Text.RegularExpressions in a browser. Every other tool on the site is client-side; this is the single case where the answer genuinely requires .NET, and it is the reason the API exists at all.',
        },
        {
          q: 'My pattern works here but hangs in production.',
          a: 'That is catastrophic backtracking, and this page is bounded against it — the server applies a 250 ms match timeout. Your application does not have one unless you set it. Pass a matchTimeout to the Regex constructor, and prefer a possessive or atomic construct over nested quantifiers like (a+)+.',
        },
        {
          q: 'Is a named group written the same way in both?',
          a: 'Nearly. (?<name>…) works in both. The .NET alternative spelling (?\'name\'…) does not exist in JavaScript, and .NET allows two groups to share a name while JavaScript rejects that outright.',
        },
      ],
    },

    cron: {
      heading: 'The cron rule almost every tool gets wrong',
      body: [
        'In classic Unix cron, day-of-month and day-of-week are combined with OR, not AND — but only when both are restricted. 0 0 13 * 5 does not mean "Friday the 13th"; it means "the 13th of the month, and also every Friday". If either field is *, the other simply applies. This is documented behaviour and it surprises people every time, including the authors of several online cron explainers.',
        'Quartz, which is what a .NET scheduler is usually running, resolves the same ambiguity differently: it forbids the situation. Exactly one of the two day fields must be ?, so the expression cannot be ambiguous in the first place. That also means a Quartz expression has six or seven fields rather than five — a Unix expression pasted into Quartz is not just wrong, it does not parse.',
        'The other quiet difference is where seconds live. Quartz puts seconds first, so 0 0 12 * * ? is noon and not "every minute of the twelfth hour". Reading a Quartz expression as Unix shifts every field by one position and produces a schedule that looks plausible.',
        'Because a schedule is hard to reason about from the syntax alone, this tool shows the next runs. That is usually the fastest way to find out that an expression means something other than what was intended — the misreadings above all look correct until you see the dates.',
      ],
      faq: [
        {
          q: 'How do I actually express "Friday the 13th"?',
          a: 'You cannot in a single classic cron expression, because of the OR rule. The usual answer is to schedule it for every 13th and check the weekday in the job itself. Quartz can express it directly with 0 0 0 13 * FRI in the right dialect, since its day fields are mutually exclusive rather than combined.',
        },
        {
          q: 'What do L and # mean?',
          a: 'Quartz extensions. L in day-of-month is the last day of the month, and 6#3 in day-of-week is the third Friday. Neither exists in classic cron, so an expression using them will not run on a Unix crontab.',
        },
        {
          q: 'Are the next runs shown in my time zone?',
          a: 'They are calculated in the browser time zone. A scheduler usually runs in the server time zone, and Quartz can be given an explicit one — so if the two differ, the times here differ by that offset. Daylight saving transitions are where that gap does the most damage.',
        },
      ],
    },

    epoch: {
      heading: 'Unix seconds, milliseconds and .NET ticks',
      body: [
        'Three counters turn up in the same codebase and none of them are interchangeable. Unix time counts seconds since 1970-01-01 UTC. JavaScript counts milliseconds from the same point. .NET DateTime.Ticks counts 100-nanosecond intervals since 0001-01-01 — a different unit and a different origin, which is why a tick value pasted into a Unix converter comes back as a date somewhere in the far future.',
        'Telling them apart by eye is easier than it looks: today a Unix second is 10 digits, a millisecond is 13, and a tick is 18. The gaps are wide enough that length is a reliable guess, which is what the automatic detection here uses — and you can override it when the guess is wrong.',
        'Ticks need one implementation detail to be right. A tick value is around 6 × 10^17, which is larger than Number.MAX_SAFE_INTEGER, so any conversion that goes through a JavaScript number silently loses precision. The arithmetic here is done with BigInt for exactly that reason; a converter that does not will be off by a few hundred nanoseconds and never tell you.',
        'The last trap is not arithmetic at all. Unix time and ticks are both instants, but a .NET DateTime also carries a Kind — Utc, Local or Unspecified — and Unspecified is the default when a value comes out of a database. Two instants that print the same can be hours apart once the Kind is applied, so store DateTimeOffset when the offset matters.',
      ],
      faq: [
        {
          q: 'Why is my tick value one date here and another in C#?',
          a: 'Almost always Kind. DateTime.Ticks does not encode a time zone, so converting it to an instant means assuming one. This page treats ticks as UTC. If the value came from DateTime.Now rather than UtcNow, it is local time recorded without saying so.',
        },
        {
          q: 'How do I get a Unix timestamp in .NET?',
          a: 'DateTimeOffset.UtcNow.ToUnixTimeSeconds() and ToUnixTimeMilliseconds(), with FromUnixTimeSeconds to go back. Subtracting the 1970 epoch by hand still appears in older code and is where off-by-one-hour bugs come from, because it is usually done with a local DateTime.',
        },
        {
          q: 'What about seconds before 1970?',
          a: 'They are negative, and that is well defined. Enter a negative number and it resolves normally. Some systems store them as unsigned instead, which is where a 1969 date turns into the year 2106.',
        },
      ],
    },

    uuid: {
      heading: 'Why a v4 GUID is a bad primary key and v7 is not',
      body: [
        'A v4 UUID is 122 random bits. As a primary key that is exactly the wrong shape: every insert lands at a random point in the index, so the page it needs is rarely the page already in memory and the index splits constantly. On a table taking sustained inserts this shows up as write amplification and a B-tree that is far larger than the data justifies.',
        'UUID v7, standardised in RFC 9562, fixes the ordering without giving up the useful part. The first 48 bits are a Unix millisecond timestamp, so values generated in different milliseconds sort in the same order they were created. Inserts land at the end of the index, which is where a sequence would put them, while the remaining bits keep the value unguessable enough for a public identifier.',
        'The caveat is inside a single millisecond, where ordering falls back to the random tail. RFC 9562 describes an optional counter that makes even that monotonic; it is not implemented here, because page splits happen at millisecond scale and the practical gain is small. If you need strict monotonicity for a sort key, that is a sequence, not a UUID.',
        'One thing neither version gives you is compactness. Sixteen bytes per row plus every index that carries the key is real cost next to a four-byte int. The reason to pay it is that the value can be created by the client, is unique across systems without coordination, and does not leak a row count — none of which a sequence offers.',
      ],
      faq: [
        {
          q: 'Is v7 safe to expose in a URL?',
          a: 'The identifier is not guessable, but the timestamp is readable — anyone holding the value knows when the row was created to the millisecond. That is usually fine and occasionally is not, for example on anything where creation time is itself sensitive.',
        },
        {
          q: 'Should I switch existing v4 keys to v7?',
          a: 'Not for its own sake. The gain is on insert-heavy tables; on a table that is mostly read, the index locality never mattered. Mixing the two in one column is harmless — both are valid UUIDs and the version is in the value.',
        },
        {
          q: 'How should the value be stored on Oracle?',
          a: 'RAW(16), which is where the byte-order question starts. .NET Guid.ToByteArray() reorders the first three fields, so a value written that way does not match the same GUID written as text through HEXTORAW. Pick one convention and write it down.',
        },
      ],
    },

    'sql-to-linq': {
      heading: 'Why SQL to LINQ can only ever be a starting point',
      body: [
        'The mapping between SQL and LINQ is one-way ambiguous. A LEFT JOIN in SQL says nothing about whether the C# side should be nullable; a GROUP BY says nothing about whether the projection wants an anonymous type or a record; a table name says nothing about which DbSet it corresponds to. Those answers live in the model, not in the query text, so a translator has to guess them — and a translator that guesses silently produces code that compiles and is wrong.',
        'This one guesses too, but it never deletes. Anything it cannot translate is left in the output as a TODO line rather than dropped, which turns a silent wrong answer into a visible incomplete one. That is the whole design position: for a code generator, being obviously unfinished is a feature, and being quietly incorrect is the failure mode that costs a day.',
        'The mechanical parts it does handle are the tedious ones. Aliases are renamed to valid range variables, because SQL is case-insensitive and C# is not — a query written FROM KITAP H that emits h.AD in the body simply will not compile. NVL, ISNULL and two-argument COALESCE become the null-coalescing operator. IN lists become Contains, BETWEEN becomes a pair of comparisons, and LIKE becomes StartsWith, EndsWith or Contains depending on where the wildcards sit.',
        'It runs in the browser. The original plan was to use a real parser on the server, but the only mature option was ScriptDom, which reads T-SQL and not Oracle — so the server would have added a dependency without adding correctness for the queries this site is actually for.',
      ],
      faq: [
        {
          q: 'Why does the output not compile as-is?',
          a: 'Usually because the entity and property names are guesses. A table becomes a PascalCase DbSet name and columns keep their SQL spelling, which is right only if your model matches that convention. Rename them and the rest of the shape holds.',
        },
        {
          q: 'Query syntax or method syntax?',
          a: 'Joins and groupings read better in query syntax; a chain of filters and projections reads better as methods. Both are generated, and EF Core translates them identically — the choice is about the person reading the code, not the query plan.',
        },
        {
          q: 'It skipped part of my query.',
          a: 'Look for the TODO line — that is where. Window functions, hierarchical queries and PL/SQL-specific constructs have no LINQ equivalent, and for those the right answer is often to keep the SQL and call it with FromSqlInterpolated rather than to translate it at all.',
        },
      ],
    },

    'json-to-csharp': {
      heading: 'Turning a JSON sample into a type without guessing wrong',
      body: [
        'A single JSON object is not enough information to write a type from, and most generators pretend otherwise. The interesting case is an array: if the first element has a field and the second does not, that field is optional — but a generator that reads only the first element produces a required property and every later deserialisation fails on a null it declared impossible. Every element is merged here before a type is decided, which is the difference between a usable type and a plausible one.',
        'Nullability comes out of the same merge. A field present in every element with a non-null value becomes non-nullable; a field that is missing anywhere, or null anywhere, becomes nullable. That is inference from evidence rather than a default, and it is only as good as the sample — a two-element sample cannot tell you about the field that is null once a month.',
        'Numbers are the other place to be careful. JSON has one numeric type, so a generator has to choose. A value with a decimal point becomes decimal rather than double, because money is the common case and double is the wrong type for it. A whole number becomes long when it does not fit in an int, which matters more often than it sounds — timestamps in milliseconds do not fit.',
        'The same inference produces C# records, classes or TypeScript interfaces from one sample. Records are the default for a DTO: value equality and immutability are what you want for something deserialised off the wire and not mutated afterwards.',
      ],
      faq: [
        {
          q: 'Record or class?',
          a: 'Record for a payload you read and pass around — value equality and init-only properties describe it accurately. Class when something binds to it and mutates it, which includes some older serialisers and most model-binding scenarios that expect a parameterless constructor.',
        },
        {
          q: 'Why decimal instead of double?',
          a: 'Because a decimal fraction in JSON is usually money or a rate, and binary floating point cannot represent 0.1 exactly. double is the right choice for measurements and scientific values; if that is your case, change it. Getting this wrong is silent until someone sums a column.',
        },
        {
          q: 'What about property names that are not valid C# identifiers?',
          a: 'They are converted to PascalCase and given a JsonPropertyName attribute carrying the original, which is the only way to keep both a legal identifier and a correct wire format. A name that starts with a digit or is a reserved word is handled the same way.',
        },
      ],
    },
  },

  errorRouter: {
    title: 'Paste an error, a query or some broken text',
    placeholder: 'ORA-00911, CS0854, TÃ¼rkÃ§e, a SELECT, a JWT…',
    noMatch: 'Nothing recognised — try the search above.',

    /** Neden bu araç: bir satırlık gerekçe, kutunun içinde okunuyor. */
    reasons: {
      invalidCharacter: 'a trailing semicolon or an invisible character',
      identifierTooLong: 'a generated name past the 30-character limit',
      inListLimit: 'an IN list longer than 1000 expressions',
      notGroupBy: 'a select column missing from GROUP BY',
      groupFunction: 'an aggregate in WHERE instead of HAVING',
      missingKeyword: 'syntax Oracle does not accept',
      invalidIdentifier: 'a name, quoting or alias problem',
      invalidNumber: 'a value that will not convert',
      bufferTooSmall: 'an OUT parameter with no size',
      stringTooLong: 'LISTAGG past 4000 bytes',
      expressionTree: 'a call that cannot go inside an expression tree',
      mojibake: 'text read back with the wrong encoding',
      bindPlaceholders: 'a logged query with bind placeholders',
      delphiSource: 'a string expression from a .pas file',
      jwtToken: 'a JSON Web Token',
      sqlText: 'a query — check it for what stops it running',
    } satisfies Record<RouteReason, string>,
  },

  share: {
    label: 'Share link',
    copied: 'Copied',
    tooLong: 'Too long to put in a link — copy the output instead.',
  },

  rules: {
    title: 'Rule catalogue',
    description: (count: number) =>
      `Every one of the ${count} checks the linters here run, each with the input that triggers it and what it does about it. These are the mistakes that compile, pass review, and fail later.`,
    sample: 'Input',
    fixed: 'After the fix',
    noFix: 'No automatic fix',
    manualHint: 'This one is reported, not rewritten — the correction changes the meaning of the statement, so it is a decision rather than a substitution.',
    openTool: 'open the tool',
    tryIt: (tool: string) => `Try it with your own input in ${tool}`,
  },

  nav: {
    aria: 'Tool navigation',
    home: 'Home',
  },

  card: {
    api: 'API',
    soon: 'Soon',
  },

  palette: {
    dialogAria: 'Command palette',
    closeAria: 'Close command palette',
    listAria: 'Tools',
    placeholder: 'Search tools…',
    noResults: 'No results found.',
    noResultsHint: 'Try ‘json’, ‘hash’ or ‘cron’.',
    navigate: 'navigate',
    open: 'open',
    close: 'close',
    count: (count: number) => `${count} ${count === 1 ? 'tool' : 'tools'}`,
  },

  shell: {
    input: 'Input',
    output: 'Output',
    clear: 'Clear input',
    copy: 'Copy output',
    copied: 'Copied',
    valid: 'Valid',
    /** Durum satırı: "412 B, 3 lines". */
    measure: (bytes: string, lines: number) =>
      `${bytes} B, ${lines} ${lines === 1 ? 'line' : 'lines'}`,
  },

  toolPage: {
    backAria: 'Back to all tools',
    backLink: 'Back to all tools',
    viaApi: 'via API',
    runsLocally: 'runs locally',
    related: 'Related tools',
  },

  notFound: {
    title: 'Page not found',
    body: 'That address does not match any tool or page here.',
    back: 'Back to all tools',
  },

  demo: {
    open: 'open',
    summary: 'A looping demo of fsdotnet tools converting example input.',
  },

  footer: {
    blurb:
      'Developer toolbox for the .NET ecosystem. Client-side by default — your tokens, keys and payloads never leave the browser.',
    tools: 'Tools',
    project: 'Project',
    builtWith: 'Built with',
    repo: 'GitHub repository',
    license: 'MIT License',
    adr: 'Architecture decisions',
    mitLicensed: 'MIT licensed',
    builtBy: 'Built by Furkan Sabuncu',
    runLocally: 'all tools run locally',
  },

  base64: {
    encode: 'encode',
    decode: 'decode',
    directionAria: 'Conversion direction',
    urlSafe: 'URL-safe',
    plainText: 'Plain text',
    base64: 'Base64',
    placeholderEncode: 'Type or paste text…',
    placeholderDecode: 'Paste Base64…',
  },

  mojibake: {
    brokenText: 'Broken text',
    repaired: 'Repaired',
    placeholder: 'Paste text with Ã, Ä, Å or similar artefacts…',
    waiting: 'waiting for input',
    clean: 'no mojibake detected',
    report: (passes: number, removed: number) =>
      `${passes} ${passes === 1 ? 'pass' : 'passes'} · ${removed} chars removed`,
    example: 'Example',
  },

  rtf: {
    document: 'RTF document',
    plainText: 'Plain text',
    placeholder: 'Paste an RTF document…',
    codepageAria: 'Code page',
    auto: 'Auto',
    detected: (codepage: number) => `cp${codepage} declared`,
    fallback: (codepage: number) => `no code page declared · assuming cp${codepage}`,
    forced: (codepage: number) => `forced to cp${codepage}`,
    example: 'Example',
  },

  sqlFormat: {
    query: 'SQL query',
    formatted: 'Formatted',
    minified: 'Minified',
    placeholder: 'Paste a SQL query…',
    dialectAria: 'SQL dialect',
    modeAria: 'Output mode',
    format: 'format',
    minify: 'minify',
    caseAria: 'Keyword case',
    upper: 'UPPER',
    lower: 'lower',
    preserve: 'as-is',
    example: 'Example',
    saved: (percent: number) => `${percent}% smaller`,
  },

  epoch: {
    input: 'Timestamp or date',
    output: 'All representations',
    placeholder: 'Paste a timestamp, or a date like 2026-08-24T09:30:00Z…',
    unitAria: 'Input unit',
    auto: 'auto',
    seconds: 'seconds',
    milliseconds: 'millis',
    ticks: 'ticks',
    now: 'Now',
    read: (unit: string) => `read as ${unit}`,
    labelIso: 'ISO 8601',
    labelUtc: 'UTC',
    labelLocal: 'Local',
    labelSeconds: 'Unix (s)',
    labelMillis: 'Unix (ms)',
    labelTicks: '.NET ticks',
  },

  dateFormat: {
    input: (dialect: string) => `${dialect} pattern`,
    placeholder: 'DD.MM.YYYY HH24:MI',
    sourceAria: 'Source dialect',
    sample: 'Sample output:',
    copy: (dialect: string) => `Copy the ${dialect} pattern`,
    dropped: (fields: string) => `No equivalent here, left out: ${fields}`,
    referenceTitle: 'The same field in all four dialects',
    referenceField: 'Field',
    noEquivalent: 'No equivalent in this dialect',

    /* Lehçe adları çevrilmez — hepsi ürün adı. Ayrı bir anahtar olarak
       duruyorlar çünkü tabloda ve satır başlıklarında tek kaynaktan
       okunuyorlar. */
    dialects: {
      oracle: 'Oracle',
      dotnet: '.NET',
      js: 'dayjs',
      delphi: 'Delphi',
    } satisfies Record<Dialect, string>,

    units: {
      year4: 'Year, 4 digits',
      year2: 'Year, 2 digits',
      quarter: 'Quarter',
      month2: 'Month, 01–12',
      month1: 'Month, 1–12',
      monthShort: 'Month name, short',
      monthLong: 'Month name, full',
      day2: 'Day, 01–31',
      day1: 'Day, 1–31',
      dayOfYear: 'Day of year',
      weekdayShort: 'Weekday, short',
      weekdayLong: 'Weekday, full',
      weekdayNumber: 'Weekday number',
      hour24_2: 'Hour, 24h, 00–23',
      hour24_1: 'Hour, 24h, 0–23',
      hour12_2: 'Hour, 12h, 01–12',
      hour12_1: 'Hour, 12h, 1–12',
      minute2: 'Minute, 00–59',
      minute1: 'Minute, 0–59',
      second2: 'Second, 00–59',
      second1: 'Second, 0–59',
      fraction1: 'Tenths of a second',
      fraction2: 'Hundredths of a second',
      fraction3: 'Milliseconds',
      meridiemUpper: 'AM / PM',
      meridiemLower: 'am / pm',
      offsetColon: 'UTC offset, +03:00',
      offsetCompact: 'UTC offset, +0300',
      offsetHours: 'UTC offset, +03',
      zoneName: 'Time zone name',
      era: 'Era, AD / BC',
      isoWeek: 'ISO week',
      isoYear: 'ISO week-year',
      secondsOfDay: 'Seconds since midnight',
      localeDate: 'Locale short date',
      localeTime: 'Locale short time',
    } satisfies Record<Unit, string>,

    notes: {
      oracleFm:
        'FM added: without it Oracle zero-pads numbers and pads MONTH and DAY with spaces out to nine characters. FM is a toggle rather than a prefix — a second one turns padding back on.',
      oracleNamePad:
        'MONTH and DAY are padded with spaces out to nine characters. Write FMMONTH to trim them.',
      oracleHh12:
        'A bare HH in Oracle means HH12, not 24-hour: 13:05 prints as 01:05. Use HH24 unless you also print AM/PM.',
      oracleMinute: 'Minutes are MI in Oracle. MM is the month.',
      dotnetSingle:
        'Written as %M because a one-character .NET format string is read as a standard specifier: ToString("M") gives a whole date, not the month.',
      dotnetSeparator:
        '/ and : are culture placeholders in .NET, not literal characters. The slash is quoted here because under tr-TR it prints as a dot; the colon is left alone since almost every culture keeps it — quote it too if it has to be exact.',
      dotnetMeridiem:
        'tt follows the culture: AM under en-US, ÖÖ under tr-TR. There is no lowercase specifier.',
      delphiMinute: 'Minutes are nn in Delphi. mm is the month, so hh:mm prints the month.',
      delphiHour:
        'Delphi reads hh as 24-hour unless am/pm appears in the same pattern. This one has a 12-hour field but no am/pm.',
      delphiSeparator:
        '/ and : are the DateSeparator and TimeSeparator globals in Delphi. The slash is quoted here so it stays a slash under a Turkish locale.',
      dayjsPlugin:
        'One of these tokens needs a dayjs plugin — advancedFormat, isoWeek or timezone. Moment has them built in.',
      dropped: 'Some fields have no equivalent in this dialect and were left out.',
      approx: 'One token is the closest match rather than an exact one — check the sample output.',
    } satisfies Record<NoteKey, string>,
  },

  sqlFix: {
    input: 'Query that will not run',
    output: 'With the selected fixes applied',
    placeholder: 'Paste a query — nothing is uploaded…',
    clean: 'nothing found',
    count: (total: number, fixable: number) => `${total} found · ${fixable} fixable`,
    findingsTitle: 'Findings',
    apply: 'apply',
    manual: 'no auto-fix',
    applyToInput: 'Move to input',
    reset: 'Example',

    samples: {
      tsql: 'T-SQL → Oracle',
      delphi: 'Delphi string',
      paste: 'Paste damage',
    },

    /* Başlık listede taranmak için kısa; ipucu "neden çalışmıyor"u
       anlatıyor — asıl değer orada, çünkü Oracle'ın kendi mesajı
       semptomu söylüyor, sebebi değil. */
    rules: {
      hostStringLiteral: {
        title: 'This is source code, not SQL',
        hint: 'The whole input is a quoted, concatenated string from a .pas or .cs file. Unwrap it first — until then every other check would be reading one long text literal.',
      },
      invisibleChar: {
        title: 'Invisible character',
        hint: 'A non-breaking space or zero-width character, almost always from Word, Teams or a PDF. Oracle answers ORA-00911 and the query looks perfect on screen.',
      },
      smartQuote: {
        title: 'Curly quote',
        hint: 'A word processor replaced the straight quote with a typographic one. SQL only understands the straight version.',
      },
      pastePrefix: {
        title: 'Paste debris at the start of the line',
        hint: 'An SQL*Plus prompt, a line number, an email quote marker or a markdown fence came along with the copy.',
      },
      unterminatedString: {
        title: 'Unclosed quote',
        hint: 'A string literal is never closed, so everything after it is being read as text. Where the closing quote belongs cannot be guessed.',
      },
      unterminatedIdentifier: {
        title: 'Unclosed double quote',
        hint: 'A quoted identifier is never closed. In Oracle double quotes name a column, they do not open a string.',
      },
      unterminatedComment: {
        title: 'Unclosed block comment',
        hint: 'A /* was opened and never closed, so the rest of the query is commented out.',
      },
      unclosedParen: {
        title: 'Unclosed parenthesis',
        hint: 'This bracket is never closed. No fix is offered because where the closing bracket belongs changes what the query means.',
      },
      extraParen: {
        title: 'Extra closing parenthesis',
        hint: 'There is no opening bracket for this one, so deleting it is safe.',
      },
      trailingSemicolon: {
        title: 'Trailing semicolon',
        hint: 'Fine in SQL*Plus or SQL Developer, but ODP.NET and JDBC send the statement as-is and Oracle answers ORA-00911.',
      },
      sqlPlusSlash: {
        title: 'SQL*Plus run marker',
        hint: 'The lone slash tells SQL*Plus to execute the buffer. It is not part of the statement.',
      },
      extraComma: {
        title: 'Comma with nothing after it',
        hint: 'Usually what is left behind after deleting a column. Oracle answers ORA-00936, missing expression.',
      },
      gluedKeyword: {
        title: 'Keyword glued to the word before it',
        hint: 'The classic result of building a query by concatenating strings: the space at the seam is missing, so a table name and a clause became one word.',
      },
      doubleQuotedString: {
        title: 'Double quotes around a value',
        hint: 'In Oracle double quotes name an identifier, so this is read as a column and you get ORA-00904. Text literals take single quotes.',
      },
      tableAliasAs: {
        title: 'AS before a table alias',
        hint: 'SQL Server allows it, Oracle does not — ORA-00933. AS is still correct in front of a column alias.',
      },
      bracketIdentifier: {
        title: 'Square-bracket identifier',
        hint: 'Brackets are T-SQL. Oracle needs the bare name, or double quotes when the name contains a space — and then its capitalisation becomes binding.',
      },
      atParameter: {
        title: 'Bind variable written with @',
        hint: 'T-SQL marks parameters with @, Oracle with a colon. A database link (table@link) is left alone.',
      },
      tsqlFunction: {
        title: 'T-SQL function with a direct equivalent',
        hint: 'The arguments mean the same thing, so the name can simply be swapped.',
      },
      tsqlNoEquivalent: {
        title: 'T-SQL function without a direct equivalent',
        hint: 'Not fixed automatically: the argument order or the structure changes, and a silent rewrite would give you a query that runs and returns the wrong thing.',
      },
      plusConcat: {
        title: 'Text joined with +',
        hint: 'Oracle joins text with ||. With +, one string operand makes Oracle try to read the other as a number — ORA-01722.',
      },
      topClause: {
        title: 'SELECT TOP',
        hint: 'T-SQL only. The equivalent that works on every Oracle version is a ROWNUM wrapper around the ordered query.',
      },
      offsetFetch: {
        title: 'OFFSET / FETCH paging',
        hint: 'Oracle understands this from 12c on. On 11g it has to become nested ROWNUM paging — the outer bound is applied first, then the offset.',
      },
      groupByScope: {
        title: 'Not covered by GROUP BY',
        hint: 'Every expression in the select list that is not an aggregate has to appear in GROUP BY too — ORA-00979. The comparison here is textual and alias-aware, so it can miss a rewritten expression; it never claims a column is wrong, only that it is not listed.',
      },
      aggregateInWhere: {
        title: 'Aggregate in the WHERE clause',
        hint: 'WHERE filters rows before grouping, so a group function has nothing to work on — ORA-00934. The condition belongs in HAVING. Not moved automatically: it changes how the AND / OR around it combine.',
      },
      joinWithoutOn: {
        title: 'JOIN with no ON condition',
        hint: 'ORA-00905. CROSS JOIN and NATURAL JOIN are the two that legitimately have none, and they are not reported.',
      },
      unknownAlias: {
        title: 'Prefix is not defined in FROM or JOIN',
        hint: 'This qualifier matches neither a table name nor an alias in the query — usually a rename that was only half applied. Oracle answers ORA-00904, which names the column and not the missing alias.',
      },
      mixedJoins: {
        title: 'Comma join mixed with ANSI join',
        hint: 'Both are valid in the same query, but half the join conditions end up in WHERE and a missing one no longer looks missing — the result is a cartesian product with no error.',
      },
      twelveCSyntax: {
        title: 'Syntax that arrived after 11g',
        hint: 'Not available on 11g, and there is no rename that fixes it: each of these needs a structural rewrite. APPLY and LATERAL become subqueries or joins, an identity column becomes a sequence plus a trigger.',
      },
      listaggOverflow: {
        title: 'LISTAGG with no overflow handling',
        hint: 'The concatenated result is capped at 4000 bytes and raises ORA-01489 above it — which only happens once the data grows, so usually in production. ON OVERFLOW itself needs 12.2; on 11g the answer is to limit the rows or move to a CLOB.',
      },
    } satisfies Record<RuleKey, { title: string; hint: string }>,
  },

  linq11g: {
    input: 'C# — engine method or query',
    output: 'With the safe rewrites applied',
    placeholder: 'Paste a LINQ query or an engine method…',
    clean: 'nothing found',
    count: (total: number, fixable: number) => `${total} found · ${fixable} fixable`,
    findingsTitle: 'Findings',
    apply: 'apply',
    manual: 'no auto-fix',
    applyToInput: 'Move to input',
    sample: 'Example',

    rules: {
      anyAsync: {
        title: 'AnyAsync() does not run on 11g',
        hint: 'Use FirstOrDefaultAsync(…) != null instead. The rewrite is safe: await binds tighter than !=, so the expression stays a bool in an if and in an assignment alike.',
      },
      anyInSelect: {
        title: 'Any(…) inside a Select projection',
        hint: 'Any is only turned into EXISTS inside a Where predicate. In a projection 11g fails. Pull the subquery into a local and put the Any in the Where.',
      },
      booleanInSelect: {
        title: 'Producing a bool in the projection',
        hint: 'Oracle has no TRUE / FALSE literal, so this becomes ORA-00904: "FALSE": invalid identifier. Select the raw value and derive the bool in memory afterwards.',
      },
      queryInLambda: {
        title: 'Query() called inside a lambda',
        hint: 'CS0854 — an expression tree cannot contain a call with optional arguments. Assign the subquery to a local first, then use it inside the lambda.',
      },
      skipTake: {
        title: 'Skip / Take',
        hint: 'EF Core turns these into OFFSET … FETCH, which arrived in 12c. On 11g the query has to be paged with a nested ROWNUM wrapper written by hand.',
      },
      executeUpdate: {
        title: 'ExecuteUpdate / ExecuteDelete',
        hint: 'A set-based statement with no change tracking. Check that the Oracle provider in use supports it, and that skipping SaveChanges does not bypass logic the surrounding code relies on.',
      },
      containsList: {
        title: 'Collection Contains becomes an IN list',
        hint: 'Oracle raises ORA-01795 past 1000 expressions in an IN list, and every distinct list length also produces a new query to hard-parse. Chunk the list.',
      },
      rawSqlInterpolation: {
        title: 'Interpolated string passed to a Raw method',
        hint: 'FromSqlRaw pastes the interpolated value straight into the SQL — that is injection. FromSqlInterpolated takes the same syntax and turns every hole into a bind variable.',
      },
      dateOnly: {
        title: 'DateOnly / TimeOnly',
        hint: 'Oracle has no matching column type and provider support is uneven. DateTime with the time part ignored is the safer mapping.',
      },
    } satisfies Record<LinqRuleKey, { title: string; hint: string }>,
  },

  pasSql: {
    input: 'Delphi .pas source',
    placeholder: 'Paste a unit or a single event handler…',
    sample: 'Example',
    empty: 'No SQL found yet.',
    count: (total: number) => `${total} statement${total === 1 ? '' : 's'}`,
    binds: 'binds',
    interpolations: 'interpolated into the text:',
  },

  oracleIdentity: {
    table: 'Table name',
    column: 'key column',
    output: 'Script',
    placeholder: 'siparis',
    versionAria: 'Oracle version',
    startWith: 'start',
    allowExplicit: 'allow explicit values',

    warnings: {
      nameTooLong: 'Longer than the identifier limit. The script fails with ORA-00972 when it runs, not when you write it — and the name that breaks is the generated one, not your table.',
      invalidIdentifier: 'Not a valid unquoted identifier. Oracle names start with a letter and continue with letters, digits, _, $ or #; anything else has to be double-quoted, and then its capitalisation becomes binding forever.',
      sequenceGaps: 'A sequence leaves gaps. CACHE 20 loses the unused numbers when the instance restarts, and a rolled-back insert never gives its number back. Treat the key as an identifier, not a count.',
      identityPreferred: 'From 12c on there is no reason for a trigger: an identity column does the same job, is faster, and ON NULL still lets you insert an explicit value.',
    },
  },

  turkishCulture: {
    input: 'C# source',
    output: 'With the explicit calls written in',
    placeholder: 'Paste a method or a class…',
    clean: 'nothing found',
    count: (total: number, fixable: number) => `${total} found · ${fixable} fixable`,
    findingsTitle: 'Findings',
    apply: 'apply',
    manual: 'no auto-fix',
    applyToInput: 'Move to input',
    sample: 'Example',

    rules: {
      toUpperLower: {
        title: 'ToUpper / ToLower follows the current culture',
        hint: 'Under tr-TR the capital of i is İ and the lowercase of I is ı, so "file".ToUpper() gives FİLE and a comparison with "FILE" quietly fails. Use the Invariant overload for anything the machine reads; use the culture-aware one only for text a person reads.',
      },
      startsEndsWith: {
        title: 'StartsWith / EndsWith is culture-sensitive by default',
        hint: 'Most people assume these compare byte by byte. They do not — the default overload uses the current culture, which also makes them measurably slower. Analyzer CA1310 flags the same thing.',
      },
      indexOfString: {
        title: 'IndexOf(string) is culture-sensitive',
        hint: 'The character overload is ordinal, the string overload is not — the same method name behaves differently depending on what you pass it. Analyzer CA1307.',
      },
      stringCompare: {
        title: 'string.Compare orders by culture',
        hint: 'Not fixed automatically: whether you want Ordinal or OrdinalIgnoreCase is your decision, and the wrong one silently reverses comparisons rather than failing.',
      },
      numberParse: {
        title: 'Parse without a format provider',
        hint: 'The decimal separator in tr-TR is a comma, so "3.14" either throws or reads as 314. Anything that came from a file, an API or a database should be parsed with InvariantCulture.',
      },
      tryParse: {
        title: 'TryParse without a format provider',
        hint: 'Same problem as Parse, but no automatic fix: the culture-aware overload also wants NumberStyles and pushes the out argument to the end, so appending an argument would not compile.',
      },
      dateParse: {
        title: 'DateTime.Parse without a format provider',
        hint: 'Day and month swap places between cultures, and 01/02/2026 is a different date in en-US than in tr-TR. For a machine-readable string, parse with InvariantCulture — or better, ParseExact with the format you actually expect.',
      },
      formatString: {
        title: 'ToString with a format string but no provider',
        hint: 'In a .NET format string / and : are placeholders for the culture separators, not literal characters. Under tr-TR "dd/MM/yyyy" prints dots.',
      },
      stringFormat: {
        title: 'string.Format without a provider',
        hint: 'Numbers and dates inside the template take the current culture. The provider goes first, not last — which is why the fix inserts rather than appends.',
      },
      regexIgnoreCase: {
        title: 'RegexOptions.IgnoreCase follows the server culture',
        hint: 'Under tr-TR, I and i are different letters, so a case-insensitive pattern stops matching what you expect. Add CultureInvariant unless the culture behaviour is what you meant.',
      },
    } satisfies Record<CultureRuleKey, { title: string; hint: string }>,
  },

  guidRaw: {
    inputGuid: 'GUID',
    inputRaw: 'RAW(16) hex — .NET byte order',
    output: 'Every representation',
    placeholder: '00112233-4455-6677-8899-aabbccddeeff',
    directionAria: 'Direction',
    fromGuid: 'from GUID',
    fromRaw: 'from RAW',
    labelGuid: 'GUID',
    labelSameOrder: 'RAW, text order',
    labelDotnetBytes: 'RAW, ToByteArray()',
    labelLiteral: 'Oracle literal',
  },

  ddlEntity: {
    input: 'CREATE TABLE',
    output: 'Entity and mapping',
    placeholder: 'Paste a CREATE TABLE statement…',
    pascalCase: 'PascalCase names',
    numberOneAsBool: 'NUMBER(1) is a flag',
    sample: 'Example',

    warnings: {
      unknownType: 'No mapping for this type, so it fell back to string. Object types, collections and spatial columns need a converter or a view.',
      noPrimaryKey: 'No primary key in the DDL. EF Core needs one to track an entity — a keyless view is configured with HasNoKey() instead.',
      compositeKey: 'Composite key. It is mapped, but note that a composite key rules out an identity column and makes every navigation heavier.',
      numberPrecision: 'NUMBER with no precision goes up to 38 digits, so the safe mapping is decimal. If the column actually holds an id, narrowing it to int or long is your call — and worth making.',
    },
  },

  odpCall: {
    input: 'PROCEDURE or FUNCTION signature',
    output: 'ODP.NET call',
    placeholder: 'Paste a CREATE PROCEDURE header…',
    sample: 'Example',

    warnings: {
      bindByName: 'BindByName is false by default, which binds parameters by POSITION, not by name. Add them in a different order than the signature and you get wrong values or ORA-06550 — and it often works by accident in testing.',
      outSize: 'An OUT text parameter needs an explicit Size or ODP.NET raises ORA-06502: buffer too small. IN parameters do not; that asymmetry is why it keeps being forgotten.',
      refCursor: 'A ref cursor is read from the parameter AFTER ExecuteNonQuery — ExecuteReader never returns it. Cast the parameter value to OracleRefCursor and call GetDataReader().',
      booleanUnsupported: 'ODP.NET cannot bind a PL/SQL BOOLEAN. Change the signature to NUMBER(1) or wrap the procedure.',
      unknownType: 'Not a built-in type — probably a package type, a record or a collection. Those cannot be bound directly; expose the data through a ref cursor or scalar parameters.',
      noParameters: 'No parameters found. If the procedure really has none, the call is complete as it stands.',
    },
  },

  connString: {
    input: 'Connection string',
    built: 'Built connection string',
    output: 'What it actually says',
    placeholder: 'User Id=…;Password=…;Data Source=…',
    modeAria: 'Mode',
    modeParse: 'take apart',
    modeBuild: 'build',
    useDescriptor: 'TNS descriptor',
    labelKind: 'Data Source',
    labelHost: 'host',
    labelPort: 'port',
    labelService: 'service',
    labelUser: 'user',
    labelRedacted: 'safe to share',

    kinds: {
      easyConnect: 'Easy Connect',
      descriptor: 'TNS descriptor',
      tnsAlias: 'TNS alias — resolved from tnsnames.ora',
      unknown: 'not recognised',
    },

    warnings: {
      tnsAlias: 'Data Source is just a name, so where this connects is decided by tnsnames.ora on the client machine — not by this string. That is the usual cause of ORA-12154 working on one machine and failing on another.',
      plainPassword: 'The password is in the string in plain text. The masked line above is the one safe to paste into a ticket or a chat.',
      noPassword: 'No password and no integrated security. The connection will prompt or fail depending on the provider.',
      integratedSecurity: 'Integrated security uses the operating system account, so the application pool identity is what actually connects — not the developer running it locally.',
      poolingOff: 'Pooling is off. Every connection then pays the full handshake, which on Oracle is expensive enough to dominate a short request.',
      unknownSource: 'Data Source is empty or in a shape this tool does not recognise.',
    },
  },

  mergeSql: {
    table: 'table',
    keys: 'key columns',
    columns: 'Columns to insert and update',
    output: 'MERGE statement',
    placeholder: 'kanal_id, tutar, aciklama',
    withUpdate: 'update when matched',

    warnings: {
      keyInUpdate: 'A key column was left out of the UPDATE list. Oracle refuses to update a column named in the ON clause — ORA-38104. It is still inserted.',
      noColumns: 'No columns beyond the key, so the statement only inserts a key row. That is valid, but rarely what was meant.',
      insertOnly: 'Insert only: an existing row is left exactly as it is, silently. Turn on the update branch if a match should change something.',
    },
  },

  jwt: {
    token: 'JWT',
    output: 'Decoded',
    placeholder: 'Paste a JWT — it never leaves this tab…',
    sectionHeader: 'HEADER',
    sectionPayload: 'PAYLOAD',
    sectionClaims: 'CLAIMS',
    signatureNote: (algorithm: string) => `signed with ${algorithm} · signature not verified`,
    unsigned: 'unsigned token',
    expired: 'expired',
    notYetValid: 'not valid yet',
    example: 'Example',
  },

  uuid: {
    output: 'Generated',
    versionAria: 'UUID version',
    v4: 'v4 random',
    v7: 'v7 time-ordered',
    countAria: 'How many',
    uppercase: 'UPPERCASE',
    braces: 'braces',
    generate: 'Generate',
    count: (n: number) => `${n} ${n === 1 ? 'identifier' : 'identifiers'}`,
  },

  httpStatus: {
    searchLabel: 'Search codes, names or .NET constants',
    placeholder: 'Try 404, "teapot" or Status422…',
    filterAria: 'Status class',
    all: 'all',
    dotnetLabel: 'ASP.NET Core constant',
    empty: 'No status code matches that.',
    count: (n: number) => `${n} ${n === 1 ? 'code' : 'codes'}`,
    copied: 'Copy the .NET constant',
  },

  color: {
    inputLabel: 'Color',
    placeholder: '#0080ff, rgb(0 128 255), hsl(210 100% 50%)…',
    formats: 'Formats',
    contrast: 'Contrast',
    onWhite: 'on white',
    onBlack: 'on black',
    normalText: 'normal text',
    largeText: 'large text',
    pass: 'AA',
    passAAA: 'AAA',
    fail: 'fail',
  },

  csv: {
    input: 'CSV',
    output: 'Result',
    placeholder: 'Paste CSV — the first row is the header…',
    modeAria: 'Output format',
    json: 'JSON',
    sql: 'SQL INSERT',
    delimiterAria: 'Delimiter',
    comma: 'comma',
    semicolon: 'semicolon',
    tab: 'tab',
    pipe: 'pipe',
    headerRow: 'first row is header',
    tableLabel: 'Table name',
    rows: (n: number) => `${n} ${n === 1 ? 'row' : 'rows'}`,
    example: 'Example',
  },

  unicode: {
    input: 'Text',
    placeholder: 'Paste text to inspect — try something copied from Word…',
    codePoints: 'code points',
    utf16Units: 'UTF-16 units',
    utf8Bytes: 'UTF-8 bytes',
    graphemes: 'graphemes',
    suspiciousTitle: 'Invisible or risky characters',
    suspiciousNone: 'No invisible characters found.',
    suspiciousCount: (n: number) => `${n} found`,
    bidiWarning: 'Contains bidirectional overrides — displayed order can differ from the real order.',
    normalizeTitle: 'Normalisation',
    notNfc: 'Not in NFC — combining marks present. Comparisons against NFC text will fail.',
    isNfc: 'Already NFC.',
    toNfc: 'Convert to NFC',
    strip: 'Remove invisible',
    tableTitle: 'Code points',
    truncated: (shown: number, total: number) => `showing first ${shown} of ${total}`,
    example: 'Example',
  },

  caseConvert: {
    input: 'Identifiers',
    placeholder: 'One per line: kitap_id, eklemeTarihi…',
    localeAria: 'Casing locale',
    invariant: 'invariant',
    turkish: 'tr-TR',
    localeWarning: 'Turkish casing changes this result — i↔İ and I↔ı. Identifiers almost always want invariant.',
    example: 'Example',
  },

  trData: {
    output: 'Generated',
    countAria: 'How many records',
    formatAria: 'Output format',
    table: 'table',
    json: 'JSON',
    csv: 'CSV',
    fieldsTitle: 'Fields',
    generate: 'Generate',
    rows: (n: number) => `${n} ${n === 1 ? 'record' : 'records'}`,
    checksumNote: 'Every TCKN and IBAN passes its real checksum.',
  },

  inList: {
    input: 'Values',
    output: 'SQL',
    placeholder: 'Paste a column of IDs — newline, comma or tab separated…',
    columnLabel: 'Column',
    quoteAria: 'Quoting',
    auto: 'auto',
    always: 'quote',
    never: 'raw',
    dedupe: 'remove duplicates',
    chunkLabel: 'Chunk at',
    stats: (count: number, chunks: number) =>
      chunks === 1 ? `${count} values` : `${count} values · split into ${chunks}`,
    duplicates: (n: number) => `${n} duplicates removed`,
    oracleNote: 'Over 1000 expressions Oracle raises ORA-01795, so the list is split and OR-ed.',
  },

  oraErrors: {
    searchLabel: 'Search code, message or cause',
    placeholder: 'ORA-01722, "table or view", sequence…',
    filterAria: 'Error group',
    all: 'all',
    empty: 'No error matches that.',
    count: (n: number) => `${n} ${n === 1 ? 'error' : 'errors'}`,
    causeLabel: 'Typical cause',
  },

  bindParams: {
    input: 'Query with binds',
    output: 'Runnable query',
    placeholder: 'select * from kitap where id = :id …',
    styleAria: 'Bind style',
    oracle: ':name',
    sqlserver: '@name',
    paramsTitle: 'Parameters',
    noBinds: 'No bind variables found in this query.',
    typeAria: 'Value type',
    typeAuto: 'auto',
    typeNumber: 'number',
    typeText: 'text',
    typeDate: 'date',
    typeNull: 'NULL',
    missing: (names: string) => `Waiting for a value: ${names}`,
    debugNote: 'For debugging only — keep binds in production code.',
    example: 'Example',
  },

  sqlDiff: {
    before: 'Before',
    after: 'After',
    placeholderBefore: 'Paste the old version…',
    placeholderAfter: 'Paste the new version…',
    normalize: 'format both sides first',
    normalizeHint: 'Ignores indentation-only changes.',
    added: 'added',
    removed: 'removed',
    unchanged: 'unchanged',
    identical: 'The two sides are identical.',
    truncated: (max: number) => `Only the first ${max} lines are compared.`,
    example: 'Example',
  },

  jsonToCsharp: {
    input: 'JSON sample',
    outputCsharp: 'C#',
    outputTypescript: 'TypeScript',
    placeholder: 'Paste a response body — the shape is inferred from it…',
    targetAria: 'Output target',
    record: 'record',
    class: 'class',
    typescript: 'TypeScript',
    rootLabel: 'Root type',
    pascalCase: 'PascalCase + [JsonPropertyName]',
    nullableRefTypes: 'nullable reference types',
    fractionAria: 'Type for fractional numbers',
    noteCsharp: 'every element of an array is merged',
    noteTypescript: 'keys kept exactly as they are on the wire',
  },

  sqlToLinq: {
    input: 'SELECT statement',
    output: 'LINQ',
    placeholder: 'Paste a SELECT — joins, WHERE, GROUP BY and ORDER BY are read…',
    syntaxAria: 'LINQ syntax',
    querySyntax: 'query',
    methodSyntax: 'method',
    contextLabel: 'DbContext',
    draftNote: 'A draft, not a compiler — read it before you run it.',
  },

  xmlJson: {
    xml: 'XML',
    json: 'JSON',
    directionAria: 'Direction',
    toJson: 'XML → JSON',
    toXml: 'JSON → XML',
    placeholderXml: 'Paste an XML document — a SOAP body works too…',
    placeholderJson: 'Paste JSON — @name becomes an attribute…',
    keepAttributes: 'keep attributes',
    inferTypes: 'numbers and booleans',
    newtonsoftNote: 'same shape as SerializeXmlNode',
  },

  codeFormat: {
    input: 'Source',
    formatted: 'Formatted',
    minified: 'Minified',
    placeholder: 'Paste JSON, XML, HTML or CSS…',
    languageAria: 'Language',
    auto: 'auto',
    modeAria: 'Mode',
    format: 'format',
    minify: 'minify',
    indentLabel: 'Indent',
    detected: (language: string) => `detected: ${language}`,
  },

  hash: {
    input: 'Text',
    placeholder: 'Type or paste — nothing is sent anywhere…',
    digests: 'Digests',
    algorithm: 'Algorithm',
    digest: 'Digest',
    encodingAria: 'Output encoding',
    hmacLabel: 'HMAC key',
    hmacPlaceholder: 'empty = plain digest',
    hmacOn: 'HMAC',
    plainDigest: 'plain digest',
    bytes: (count: string) => `${count} bytes in`,
    weak: 'weak',
    weakTitle: 'Broken for signatures and passwords — verification of old data only.',
    notAvailable: 'not keyable',
    note: 'SHA digests come from the browser WebCrypto API; CRC32 and MD5 are computed here because WebCrypto refuses to implement them.',
  },

  cron: {
    expression: 'Cron expression',
    placeholder: '*/15 * * * *',
    flavourAria: 'Flavour',
    unix: 'Unix (5)',
    quartz: 'Quartz (6-7)',
    unixShape: 'min hour dom month dow',
    quartzShape: 'sec min hour dom month dow [year]',
    fields: 'Fields',
    field: 'Field',
    raw: 'Written',
    expands: 'Expands to',
    nextRuns: 'Next runs',
    fieldNames: {
      second: 'Second',
      minute: 'Minute',
      hour: 'Hour',
      dayOfMonth: 'Day of month',
      month: 'Month',
      dayOfWeek: 'Day of week',
      year: 'Year',
    },
    orRuleNote:
      'When day-of-month and day-of-week are both restricted, classic cron fires if EITHER matches — not both. Quartz avoids the question by requiring ? in one of them.',
  },

  regex: {
    pattern: 'Pattern',
    patternPlaceholder: String.raw`(?<name>\w+)`,
    testString: 'Test string',
    replacement: 'Replacement',
    replacementPlaceholder: 'Leave empty to skip — $1, $<name> and $& work',
    matches: 'Matches',
    noMatches: 'No match.',
    noCapture: 'did not capture',
    engineAria: 'Engine',
    javascript: 'JavaScript',
    dotnet: '.NET',
    running: 'running…',
    matchCount: (count: number) => `${count} ${count === 1 ? 'match' : 'matches'}`,
    truncated: 'first 500 shown',
    serverNotConfigured: 'The .NET engine needs the API, and no API address is configured for this deployment.',
    serverUnreachable: 'The .NET engine did not answer.',
    fallbackToJs: 'Showing the JavaScript result instead.',
    flavourTitle: 'JavaScript vs .NET',
    flags: {
      ignoreCase: 'i',
      multiline: 'm',
      dotAll: 's',
      unicode: 'u',
      cultureInvariant: 'invariant',
    },
    notes: {
      balancingGroup: 'Balancing groups exist only in .NET; JavaScript will not compile this.',
      conditional: 'Conditional patterns exist only in .NET.',
      inlineOptions: 'Inline options are a .NET feature; in JavaScript flags go on the regex itself.',
      anchors: String.raw`\A, \z, \Z and \G exist only in .NET — use ^ and $ in JavaScript.`,
      quotedGroupName: "The (?'name') spelling is .NET only; JavaScript needs (?<name>).",
      digitUnicode: String.raw`In .NET \d also matches non-ASCII digits (٤٢). JavaScript needs the u flag and \p{Nd}.`,
      wordUnicode: String.raw`In .NET \w includes Unicode letters. JavaScript keeps it ASCII.`,
      dollarNewline: 'In .NET $ also matches before a trailing newline. JavaScript matches only at the very end.',
      unicodeCategory: String.raw`.NET reads \p{…} always; JavaScript needs the u flag.`,
      turkishCase:
        'RegexOptions.IgnoreCase follows the server culture. Under tr-TR, I and i are different letters — turn on CultureInvariant unless you meant that.',
    },
  },

  /** Araç fonksiyonları düz metin değil ANAHTAR döndürür; çeviri burada. */
  errors: {
    base64Alphabet: 'Not valid Base64 — contains characters outside the alphabet.',
    base64Length: 'Not valid Base64 — length is not a multiple of 4.',
    base64Utf8: 'Decoded, but the result is not valid UTF-8 text — it may be binary data.',
    sqlInvalid: 'Could not parse this as SQL — check for an unclosed quote or bracket.',
    epochEmpty: 'Enter a timestamp or a date.',
    epochUnparsable: 'Not a timestamp or a date this browser can read.',
    epochOutOfRange: 'Outside the range JavaScript dates can represent.',
    jwtEmpty: 'Paste a JWT to inspect it.',
    jwtShape: 'A JWT has exactly three dot-separated parts.',
    jwtSegment: 'A segment is not valid base64url, or not valid UTF-8.',
    jwtJson: 'A segment decoded, but it is not valid JSON.',
    csvEmpty: 'Paste some CSV to convert.',
    csvNoRows: 'Only a header row — there is no data to convert.',
    inListEmpty: 'Paste at least one value.',
    rtfNotRtf: String.raw`This does not look like RTF — an RTF document starts with {\rtf.`,
    jsonEmpty: 'Paste some JSON.',
    jsonInvalid: 'Not valid JSON.',
    jsonNotObject: 'Needs an object or an array — there is nothing to build a type from.',
    xmlEmpty: 'Paste an XML document.',
    xmlInvalid: 'Could not parse this as XML.',
    xmlRootShape: 'XML needs one root element, so the JSON has to be an object.',
    xmlBadName: 'This key cannot be an XML element name.',
    formatUnknownLanguage: 'Could not tell what this is — pick the language yourself.',
    cronEmpty: 'Enter a cron expression.',
    cronFieldCount: 'Wrong number of fields for this flavour.',
    cronField: 'A field is out of range or malformed.',
    cronUnreachable: 'This expression never fires — check the day and month together.',
    regexEmpty: 'Enter a pattern.',
    regexInvalid: 'The engine rejected this pattern.',
    regexServerDown: 'The .NET engine is not available.',
    sqlSelectOnly: 'Only SELECT statements can be translated.',
    sqlNoFrom: 'The statement has no FROM clause.',
    dateFormatEmpty: 'Enter a date format pattern.',
    dateFormatNoTokens: 'Nothing here is a date field — this is all literal text.',
    sqlFixEmpty: 'Paste a query to check.',
    linqEmpty: 'Paste some C# to check.',
    pasEmpty: 'Paste a Delphi unit.',
    pasNoSql: 'No SQL statement found in this source.',
    identityEmpty: 'Enter a table and a column name.',
    cultureEmpty: 'Paste some C# to check.',
    guidEmpty: 'Enter a GUID or a 32-character hex string.',
    guidInvalid: 'A GUID is 32 hexadecimal digits.',
    ddlEmpty: 'Paste a CREATE TABLE statement.',
    ddlNoTable: 'No CREATE TABLE found in this text.',
    ddlNoColumns: 'The table has no columns to map.',
    odpEmpty: 'Paste a procedure signature.',
    odpNoRoutine: 'No PROCEDURE or FUNCTION header found.',
    connEmpty: 'Paste a connection string.',
    connNoPairs: 'No Key=Value pairs in this text.',
    mergeEmpty: 'Enter a table name and at least one key column.',
    mergeBadName: 'Not a valid unquoted table name.',
  } satisfies Record<ToolErrorKey, string>,
};

export type Dictionary = typeof en;
