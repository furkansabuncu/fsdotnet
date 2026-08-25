import type { ToolCategory, ToolErrorKey, ToolId } from '../tools/types';

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
    github: 'fsdev on GitHub',
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
        'Turkish has two i letters. Dotless ı uppercases to I, and dotted i uppercases to İ. A culture-aware uppercase under tr-TR therefore turns "file" into "FİLE" and "HASTA_ID" into "hasta_ıd" on the way back down. That is correct for Turkish prose and wrong for everything else.',
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
  },

  notFound: {
    title: 'Page not found',
    body: 'That address does not match any tool or page here.',
    back: 'Back to all tools',
  },

  demo: {
    open: 'open',
    summary: 'A looping demo of fsdev tools converting example input.',
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
    placeholder: 'One per line: hasta_id, eklemeTarihi…',
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
    placeholder: 'select * from hasta where id = :id …',
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
  } satisfies Record<ToolErrorKey, string>,
};

export type Dictionary = typeof en;
