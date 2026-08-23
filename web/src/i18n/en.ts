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
  title: 'fsbox — Developer toolbox for the .NET ecosystem',

  header: {
    searchAria: 'Search tools',
    searchPlaceholder: 'Search tools...',
    toLightTheme: 'Switch to light theme',
    toDarkTheme: 'Switch to dark theme',
    github: 'fsbox on GitHub',
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
    statReady: (ready: number, total: number) => `${ready} of ${total} tools ready`,
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
    'json-to-csharp': 'Records or classes, nullable-aware.',
    'sql-to-linq': 'T-SQL to LINQ with a real parser.',
    'xml-json': 'Both ways, attributes preserved.',
    'csv-json': 'Table to JSON array or INSERT rows.',
    epoch: 'Unix seconds, millis and .NET ticks.',
    'sql-format': 'Indent a one-liner, or minify it.',
    'code-format': 'Format JSON, HTML and CSS.',
    jwt: 'Header, payload and claims — locally.',
    hash: 'MD5, SHA-1, SHA-256, SHA-512, HMAC.',
    uuid: 'Bulk v4 and namespaced v5 identifiers.',
    regex: 'JavaScript and .NET flavours.',
    cron: 'Unix 5-field and Quartz 6-field.',
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
    notFound: 'Tool not found',
    notFoundBody: 'That URL does not match any tool in the catalogue.',
    viaApi: 'via API',
    runsLocally: 'runs locally',
    notBuilt: 'Not built yet',
    browseReady: 'Browse the tools that are ready',
  },

  demo: {
    open: 'open',
    summary: 'A looping demo of fsbox tools converting example input.',
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

  /** Araç fonksiyonları düz metin değil ANAHTAR döndürür; çeviri burada. */
  errors: {
    base64Alphabet: 'Not valid Base64 — contains characters outside the alphabet.',
    base64Length: 'Not valid Base64 — length is not a multiple of 4.',
    base64Utf8: 'Decoded, but the result is not valid UTF-8 text — it may be binary data.',
  } satisfies Record<ToolErrorKey, string>,
};

export type Dictionary = typeof en;
