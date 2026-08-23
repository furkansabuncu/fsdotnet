import type { Dictionary } from './en';

/**
 * Türkçe sözlük.
 *
 * `Dictionary` tipine bağlı olduğu için `en.ts`'teki her anahtarın karşılığı
 * burada olmak ZORUNDA — eksik ya da fazla anahtar derleme hatası verir.
 *
 * Çoğul notu: Türkçe'de sayıdan sonra çoğul eki gelmez ("15 araç", "15 araçlar"
 * değil). İngilizce'de `tool/tools` ayrımı yapan fonksiyonlar burada tek biçim
 * döndürüyor — çeviriyi dize şablonuyla değil fonksiyonla tutmanın sebebi bu.
 */
export const tr: Dictionary = {
  htmlLang: 'tr',
  title: 'fsbox — .NET ekosistemi için geliştirici araç kutusu',

  header: {
    searchAria: 'Araç ara',
    searchPlaceholder: 'Araç ara...',
    toLightTheme: 'Açık temaya geç',
    toDarkTheme: 'Koyu temaya geç',
    github: "fsbox'ın GitHub sayfası",
    languageAria: 'Dil',
  },

  home: {
    titleBefore: '',
    titleAccent: '.NET ekosistemi',
    titleAfter: ' için geliştirici araçları',
    subtitle:
      "SQL'den LINQ'e, JSON'dan C#'a, .NET regex, Quartz cron — ve zaten her gün kullandığınız bütün dönüştürücüler. Gerçekten derleyici gerektirmeyen hiçbir şey sunucuya gitmez.",
    statReady: (ready: number, total: number) => `${total} araçtan ${ready} tanesi hazır`,
    statClient: (count: number) => `${count} tanesi tamamen tarayıcınızda çalışıyor`,
    statPrivacy: 'Hesap yok, takip yok, yükleme yok',
  },

  categories: {
    dotnet: { label: '.NET ve Veri', blurb: 'Başka araç kutusunda olmayanlar.' },
    converters: { label: 'Dönüştürücüler', blurb: 'Formatlar arası geçişi dert etmeden yapın.' },
    formatters: { label: 'Biçimlendiriciler', blurb: 'Okunmaz girdiyi yeniden okunur hâle getirin.' },
    security: { label: 'Güvenlik ve Token', blurb: 'Buradaki hiçbir şey tarayıcınızdan çıkmaz.' },
    testing: { label: 'Test ve Zaman', blurb: 'Desenler, zamanlamalar ve zaman damgaları.' },
    web: { label: 'Web ve Tasarım', blurb: 'Arayüz geliştirirken her gün bakılanlar.' },
  },

  toolDescriptions: {
    base64: 'Kodlayın ve çözün, URL-safe dahil.',
    mojibake: 'Yanlış kodlamayla bozulan metni onarın.',
    'json-to-csharp': 'Record ya da class, nullable uyumlu.',
    'sql-to-linq': "Gerçek parser ile T-SQL'den LINQ'e.",
    'xml-json': 'İki yönlü, öznitelikler korunur.',
    'csv-json': "Tabloyu JSON'a veya INSERT'e çevirin.",
    epoch: 'Unix saniye, milisaniye ve .NET tick.',
    'sql-format': 'Girintileyin ya da geri sıkıştırın.',
    'code-format': 'JSON, HTML ve CSS biçimlendirin.',
    jwt: 'Header, payload ve claim — yerelde.',
    hash: 'MD5, SHA-1, SHA-256, SHA-512, HMAC.',
    uuid: 'Toplu v4 ve isim uzaylı v5 kimlik.',
    regex: 'JavaScript ve .NET lehçeleri.',
    cron: 'Unix 5 alanlı ve Quartz 6 alanlı.',
    'http-status': "Kodlar, header'lar ve .NET sabitleri.",
    color: 'HEX, RGB, HSL, OKLCH ve WCAG kontrast.',
  },

  nav: {
    aria: 'Araç gezinmesi',
    home: 'Ana sayfa',
  },

  card: {
    api: 'API',
    soon: 'Yakında',
  },

  palette: {
    dialogAria: 'Komut paleti',
    closeAria: 'Komut paletini kapat',
    listAria: 'Araçlar',
    placeholder: 'Araç ara…',
    noResults: 'Sonuç bulunamadı.',
    noResultsHint: '‘json’, ‘hash’ ya da ‘cron’ deneyin.',
    navigate: 'gez',
    open: 'aç',
    close: 'kapat',
    count: (count: number) => `${count} araç`,
  },

  shell: {
    input: 'Girdi',
    output: 'Çıktı',
    clear: 'Girdiyi temizle',
    copy: 'Çıktıyı kopyala',
    copied: 'Kopyalandı',
    valid: 'Geçerli',
    measure: (bytes: string, lines: number) => `${bytes} B, ${lines} satır`,
  },

  toolPage: {
    backAria: 'Tüm araçlara dön',
    backLink: 'Tüm araçlara dön',
    notFound: 'Araç bulunamadı',
    notFoundBody: 'Bu adres katalogdaki hiçbir araca karşılık gelmiyor.',
    viaApi: "API üzerinden",
    runsLocally: 'yerelde çalışır',
    notBuilt: 'Henüz yazılmadı',
    browseReady: 'Hazır olan araçlara göz atın',
  },

  demo: {
    open: 'aç',
    summary: 'fsbox araçlarının örnek girdiyi dönüştürdüğü döngüsel bir gösterim.',
  },

  footer: {
    blurb:
      '.NET ekosistemi için geliştirici araç kutusu. Varsayılan olarak tarayıcıda çalışır — token, anahtar ve verileriniz tarayıcıdan çıkmaz.',
    tools: 'Araçlar',
    project: 'Proje',
    builtWith: 'Kullanılanlar',
    repo: 'GitHub deposu',
    license: 'MIT Lisansı',
    adr: 'Mimari kararlar',
    mitLicensed: 'MIT lisanslı',
    builtBy: 'Furkan Sabuncu tarafından yapıldı',
    runLocally: 'tüm araçlar yerelde çalışır',
  },

  base64: {
    encode: 'kodla',
    decode: 'çöz',
    directionAria: 'Dönüşüm yönü',
    urlSafe: 'URL-safe',
    plainText: 'Düz metin',
    base64: 'Base64',
    placeholderEncode: 'Metin yazın veya yapıştırın…',
    placeholderDecode: 'Base64 yapıştırın…',
  },

  mojibake: {
    brokenText: 'Bozuk metin',
    repaired: 'Onarılmış',
    placeholder: 'Ã, Ä, Å gibi artıklar içeren metni yapıştırın…',
    waiting: 'girdi bekleniyor',
    clean: 'bozulma bulunamadı',
    report: (passes: number, removed: number) =>
      `${passes} tur · ${removed} karakter silindi`,
    example: 'Örnek',
  },

  errors: {
    base64Alphabet: 'Geçersiz Base64 — alfabede olmayan karakter içeriyor.',
    base64Length: "Geçersiz Base64 — uzunluk 4'ün katı değil.",
    base64Utf8: 'Çözüldü ama sonuç geçerli UTF-8 metin değil — ikili veri olabilir.',
  },
};
