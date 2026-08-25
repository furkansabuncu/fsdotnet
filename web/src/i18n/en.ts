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
    web: { label: 'Web & Design', blurb: 'Everyday lookups for building interfaces.' },
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
    color: 'HEX, RGB, HSL, OKLCH and WCAG contrast.',
  } satisfies Record<ToolId, string>,

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
    colorEmpty: 'Enter a color.',
    colorInvalid: 'Not a color this tool can read — try #0080ff or rgb(0 128 255).',
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
