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

  seo: {
    homeTitle: '.NET ekosistemi için geliştirici araçları',
    homeDescription:
      'Oracle hata kodları, ORA-01795 sınırını aşan IN (…) listeleri, bind değeri yerleştirme, bozuk Türkçe karakter onarımı, .NET regex. Ücretsiz, üyeliksiz ve tamamı tarayıcınızda çalışıyor.',
    toolDescription: (blurb: string) =>
      `${blurb} Ücretsiz ve anında — tarayıcınızda çalışır, hiçbir veri sunucuya gitmez.`,
  },

  header: {
    searchAria: 'Araç ara',
    searchPlaceholder: 'Araç ara...',
    toLightTheme: 'Açık temaya geç',
    toDarkTheme: 'Koyu temaya geç',
    github: "fsdotnet'ın GitHub sayfası",
    languageAria: 'Dil',
  },

  home: {
    titleBefore: '',
    titleAccent: '.NET ekosistemi',
    titleAfter: ' için geliştirici araçları',
    subtitle:
      "SQL'den LINQ'e, JSON'dan C#'a, .NET regex, Quartz cron — ve zaten her gün kullandığınız bütün dönüştürücüler. Gerçekten derleyici gerektirmeyen hiçbir şey sunucuya gitmez.",
    statReady: (count: number) => `${count} araç, hepsi hazır`,
    statClient: (count: number) => `${count} tanesi tamamen tarayıcınızda çalışıyor`,
    statPrivacy: 'Hesap yok, takip yok, yükleme yok',
  },

  categories: {
    dotnet: { label: '.NET ve Veri', blurb: 'Başka araç kutusunda olmayanlar.' },
    converters: { label: 'Dönüştürücüler', blurb: 'Formatlar arası geçişi dert etmeden yapın.' },
    formatters: { label: 'Biçimlendiriciler', blurb: 'Okunmaz girdiyi yeniden okunur hâle getirin.' },
    security: { label: 'Güvenlik ve Token', blurb: 'Buradaki hiçbir şey tarayıcınızdan çıkmaz.' },
    testing: { label: 'Test ve Zaman', blurb: 'Desenler, zamanlamalar ve zaman damgaları.' },
  },

  toolDescriptions: {
    base64: 'Kodlayın ve çözün, URL-safe dahil.',
    mojibake: 'Yanlış kodlamayla bozulan metni onarın.',
    rtf: 'RTF etiketlerini ayıklayın, Türkçe bozulmadan.',
    'in-list': 'IN (…) listesi kurun, 1000 üstü parçalanır.',
    'ora-errors': 'ORA-xxxxx kodları ve gerçek sebepleri.',
    'bind-params': ':bind yerine değer koyup sorguyu çalıştırın.',
    'sql-diff': 'İki sorguyu karşılaştırın, farklar vurgulu.',
    unicode: 'Kod noktaları, görünmez karakterler, NFC/NFD.',
    case: 'camelCase, snake_case, PascalCase ve tersi.',
    'tr-data': 'Geçerli TCKN ve IBAN ile Türkçe test verisi.',
    'json-to-csharp': 'Record, class ya da TypeScript arayüzü.',
    'sql-to-linq': "SELECT'ten sorgu ya da metot söz dizimine.",
    'xml-json': 'İki yönlü, öznitelik ve CDATA korunur.',
    'csv-json': "Tabloyu JSON'a veya INSERT'e çevirin.",
    epoch: 'Unix saniye, milisaniye ve .NET tick.',
    'sql-format': 'Girintileyin ya da geri sıkıştırın.',
    'code-format': 'JSON, XML, HTML, CSS biçimlendirin.',
    jwt: 'Header, payload ve claim — yerelde.',
    hash: 'CRC32, MD5, SHA ailesi ve HMAC.',
    uuid: 'Toplu v4 rastgele ya da v7 zaman sıralı.',
    regex: 'Gerçek .NET motoru, JavaScript ile yan yana.',
    cron: 'Unix ve Quartz, sonraki çalışmalarla.',
    'http-status': "Kodlar, header'lar ve .NET sabitleri.",
    'date-format': 'Oracle, .NET, Delphi ve dayjs kalıpları.',
  },

toolGuides: {
    mojibake: {
      heading: 'Türkçe karakterler neden Ã¼ ve ÅŸ oluyor?',
      body: [
        'Mojibake, UTF-8 ile kodlanmış bir metnin başka bir kodlamaymış gibi — genellikle Windows-1252 ya da Windows-1254 — okunmasıyla ortaya çıkar. UTF-8, "ü" harfini iki bayt olarak saklar: 0xC3 0xBC. Bu iki bayt teker teker Windows-1252 sanılarak okununca Ã ve ¼ karakterlerine dönüşür, yani tek bir harf ikiye çıkar. Şapkalı ya da noktalı her Türkçe harf aynı şekilde bozulur: ç → Ã§, ş → ÅŸ, ğ → ÄŸ.',
        'Bozulma neredeyse her zaman bir sınırda olur: karakter kümesi yanlış tanımlanmış bir veritabanı kolonu, charset=utf-8 taşımayan bir HTTP cevabı, Excel dışa aktarımı ya da UTF-8 öncesinden kalma bir istemci. Baytlar hâlâ orada durduğu — sadece yanlış yorumlandığı — için metin genellikle birebir geri getirilebilir: yanlış kod sayfasıyla tekrar bayta çevirip o baytları UTF-8 olarak çözmek yeterli.',
        'Bu araç bunu yapıyor ve zor olan ikinci durumu da kaldırıyor: iki kez bozulmuş, doğru karakterin yanına artık bir öncü baytın yapıştığı metinler (TÃ¼rkÃ§e yerine Tüürkçe gibi). Girdiyi yerinde onarıyor ve kaç tur gerektiğini bildiriyor, böylece tek katlı bozulmayla tekrarlananı ayırt edebiliyorsunuz.',
      ],
      faq: [
        {
          q: 'Bilgi kaybı oluyor mu?',
          a: 'Genellikle hayır. Baytlar bozulmadan duruyor, sadece yanlış okunuyor; onarım birebir. Kayıp yalnızca yanlış kod sayfasında o bayta karşılık gelen bir karakter olmadığında ve yerine soru işareti ya da U+FFFD konduğunda olur — o noktada orijinal gitmiştir, hiçbir araç geri getiremez.',
        },
        {
          q: 'Tekrar olmasını nasıl engellerim?',
          a: 'Veriyi değil sınırı düzeltin. Cevaplarda charset=utf-8 bildirin, Oracle tarafında NVARCHAR2 ya da AL32UTF8 veritabanı karakter kümesi kullanın, ve istemci kodlamasını işletim sistemi varsayılanına bırakmayın — Türkçe bir Windows kurulumunda o varsayılan UTF-8 değil, Windows-1254.',
        },
      ],
    },

    'ora-errors': {
      heading: 'ORA kodları ve arkalarındaki gerçek sebepler',
      body: [
        'Oracle hata mesajları belirtiyi söyler, sebebi değil. ORA-01722 "geçersiz sayı" der; doğrudur ama işe yaramaz, çünkü asıl soru hangi kolon olduğu ve oraya neden bir metin geldiğidir. Bu liste her kodu sahada onu üreten duruma bağlıyor, böylece mesajdan değil olası sebepten başlayabiliyorsunuz.',
        'Arama kodda, mesajda ve sebepte birden çalışıyor; yarım hatırlanan bir parça yetiyor: "table or view" yazın ORA-00942 gelsin, 1795 yazın ifade sınırı gelsin. Kodlar alana göre gruplanmış (veri, nesne, kısıt, kaynak), çünkü birbiriyle ilgisiz görünen hatalar çoğu zaman aynı yerden çıkıyor.',
      ],
      faq: [
        {
          q: 'Yalnızca sayı tutan bir kolonda neden ORA-01722 alıyorum?',
          a: 'Neredeyse her zaman örtük dönüşüm: VARCHAR2 bir kolonu sayı sabitiyle karşılaştırmak Oracle\'ı her satırı çevirmeye zorlar ve satırlardan biri sayısal değildir. Metinle karşılaştırın ya da kolon tipini düzeltin.',
        },
        {
          q: 'ORA-00942 ile ORA-01031 arasındaki fark ne?',
          a: 'Oracle göremediğiniz nesneler için — var olsun ya da olmasın — "tablo veya görünüm mevcut değil" der; yetkisiz kullanıcıdan varlığı gizler. ORA-01031 ise nesneyi gördüğünüz ama o işlem için gereken yetkiye sahip olmadığınız anlamına gelir.',
        },
      ],
    },

    'in-list': {
      heading: 'ORA-01795: IN listesindeki 1000 ifade sınırı',
      body: [
        'Oracle bir literal IN listesinde en fazla 1000 ifadeye izin verir. Bir tablodan 1200 kimlik yapıştırdığınızda sorgu ORA-01795 ile başarısız olur — yavaşlayarak ya da kısmen değil, doğrudan ayrıştırma anında. Sınır yalnızca literal listelere aittir; bir tabloya ya da koleksiyona karşı yazılan IN (SELECT …) böyle bir tavan taşımaz.',
        'Alt sorgu kullanamadığınız durumlarda — tek seferlik bir inceleme, bir destek kaydı, yalnızca bir e-postada duran kimlikler — çözüm listeyi bölüp parçaları OR ile birleştirmektir. Bu araç bölmeyi yapıyor, tekrarları atıyor, her tablo yapıştırmasının sonunda kalan boş satırı temizliyor ve her değeri yalnızca gerekiyorsa tırnaklıyor.',
        'Son madde göründüğünden önemli. 007 gibi bir kod, 7 sayısı değildir: tırnaksız bırakırsanız Oracle baştaki sıfırları düşürür, karşılaştırma sessizce tutmaz ve aradığınız satır sonuçta hiç görünmez. Sayı gibi görünen ama sıfırla başlayan değerler tırnaklı kalıyor.',
      ],
      faq: [
        {
          q: 'Listeyi bölmek tek IN\'den yavaş mı?',
          a: 'Biraz, ama alternatif hiç çalışmayan bir sorgu. Liste büyük ve tekrar eden bir işse kimlikleri geçici bir tabloya yükleyip join yapın — bu her uzunlukta ölçeklenir ve optimize ediciye gerçek bir kardinalite verir.',
        },
        {
          q: 'SQL Server\'da da aynı sınır var mı?',
          a: 'Sabit bir 1000 sınırı yok, ama çok uzun IN listeleri orada da zarar veriyor: her biri ayrı bir sorgu planı üretip plan önbelleğini dolduruyor. Birkaç bin değerin üstünde parçalamak yine mantıklı.',
        },
      ],
    },

    'bind-params': {
      heading: 'Loglanmış sorguyu ve bind değerlerini çalışabilir hâle getirmek',
      body: [
        'Uygulama logları sorguyu :yer tutucularla bir satırda, parametre değerlerini başka bir satırda verir. Sorunu bir SQL istemcisinde yeniden üretmek için ikisini elle birleştirmek gerekir; bu hem sıkıcıdır hem de altıncı parametrede hata yapmak kolaydır. Bu araç yerleştirmeyi yapıyor ve her değeri hedef lehçeye göre biçimlendiriyor.',
        'Yalnızca gerçek bind değişkenlerini tanıyor. Bir dize sabitinin ya da yorumun içindeki iki nokta bind değildir; biçim maskesindeki :mi de öyle — TO_CHAR(tarih, \'HH24:MI\') hiçbir parametre içermez ama saf bir ayrıştırıcı orada bir tane görür. Oracle\'ın kendisi ters yönde aynı hatayı yapar ve ayrılmış bir sözcük gibi adlandırılmış gerçek bir bind gördüğünde ORA-01745 verir.',
        'Çıktı yalnızca hata ayıklama içindir. Üretim kodunda bind\'leri bırakın: değerleri SQL metnine gömmek enjeksiyonun tam olarak nasıl olduğudur, ayrıca paylaşılan imleci de çöpe atar ve her çağrı yeniden ayrıştırılır.',
      ],
      faq: [
        {
          q: 'Tarihler nasıl ele alınıyor?',
          a: 'Yalnızca tarih içeren bir değer DATE \'2026-08-24\' olur; saat de içeriyorsa açık biçim maskesiyle TO_DATE üretilir. Böylece sonuç oturumun NLS_DATE_FORMAT ayarına bağlı kalmaz.',
        },
        {
          q: 'ORA-01745 ne demek?',
          a: '"Geçersiz ana bilgisayar/bind değişkeni adı". Genelde ayrılmış bir sözcükle adlandırılmış bir bind, ya da sabit sanırken Oracle\'ın bind okuduğu bir iki nokta — yukarıdaki :mi durumu klasik örneği.',
        },
      ],
    },

    case: {
      heading: 'Türkçe kasa dönüşümü ve "file".ToUpper() neden FİLE döndürür',
      body: [
        'Türkçede iki tane i harfi var. Noktasız ı büyük harfte I olur, noktalı i ise İ. Dolayısıyla tr-TR kültürüne duyarlı bir büyük harf dönüşümü "file" kelimesini "FİLE", geri dönerken de "KITAP_ID" kelimesini "kitap_ıd" yapar. Bu Türkçe düz metin için doğru, geri kalan her şey için yanlıştır.',
        'Bir tanımlayıcı bu dönüşümden geçtiği anda hataya dönüşüyor: kolon adı, dosya uzantısı, HTTP başlığı, kültür kodu. .NET\'te ToUpper() ve ToLower() varsayılan olarak geçerli kültürü kullanır, yani aynı kod çalıştığı makineye göre farklı sonuç üretir — hatanın genellikle geliştirici bilgisayarında değil üretimde ortaya çıkmasının sebebi de bu.',
        'Bu dönüştürücü iki sonucu yan yana gösteriyor. Tanımlayıcı olan her şey invariant kasa ister; yalnızca insana gösterilen metin Türkçe kurallarını ister.',
      ],
      faq: [
        {
          q: 'C#\'ta hangisini kullanmalıyım?',
          a: 'Tanımlayıcılar için ToUpperInvariant() ve ToLowerInvariant(), karşılaştırmalar için string.Equals(a, b, StringComparison.OrdinalIgnoreCase). Kültüre duyarlı aşırı yüklemelere yalnızca sonuç bir insana gösteriliyorsa uzanın.',
        },
        {
          q: 'JavaScript\'te de aynı sorun var mı?',
          a: 'Varsayılan olarak yok: toUpperCase() yerel ayardan bağımsızdır, hiçbir zaman İ üretmez. Yalnızca toLocaleUpperCase(\'tr\') üretir — yani hata tarayıcıda isteğe bağlı, .NET\'te ise varsayılan.',
        },
      ],
    },

    rtf: {
      heading: 'RTF\'ten düz metin çıkarırken Türkçeyi bozmamak',
      body: [
        'RTF metni UTF-8 olarak saklamaz. ASCII dışı karakterler \\\'hh kaçışlarıyla yazılır — belgenin \\ansicpg ile bildirdiği kod sayfasında tek bir bayt. Etiketleri bir düzenli ifadeyle ayıklarsanız o baytlar elinizde kalır ama kod sayfası kaybolur; Türkçe karakterler yanlış tabloya göre çözülür ve "Tanı" kelimesi "Taný" olarak çıkar.',
        'Bu dönüştürücü bildirilen kod sayfasını okuyup bayt dizilerini ona göre çözüyor, Türkçenin bozulmamasının sebebi bu. Ardışık kaçışları çözmeden önce biriktiriyor da, böylece eski bir kod sayfasındaki çok baytlı bir karakter iki yanlış karaktere bölünmüyor.',
        'Belge hiç kod sayfası bildirmiyorsa araç bunu söylüyor ve hangisini varsaydığını yazıyor, sessizce tahmin etmiyor. Kaynağı biliyorsanız seçimi elle değiştirebiliyorsunuz.',
      ],
      faq: [
        {
          q: 'Türkçe RTF dosyaları hangi kod sayfasını kullanır?',
          a: 'Genellikle cp1254 (Windows Türkçe). Türkçe bir Windows kurulumunda eski Delphi ya da Office sürümleriyle üretilen dosyalar çoğunlukla bunu bildirir; bazıları yanlışlıkla cp1252 bildirir ki elle değiştirmenin işe yaradığı durum tam olarak budur.',
        },
        {
          q: 'Biçimlendirme korunuyor mu?',
          a: 'Hayır — çıktı tasarım gereği düz metin. Kalın, tablo ve renkler düşüyor; satır sonları ve paragraf sınırları korunuyor.',
        },
      ],
    },

    unicode: {
      heading: 'Göremediğiniz karakteri bulmak',
      body: [
        'Ekranda birebir aynı görünen iki metin farklı baytlar olabilir ve fark görünmez: boşluk yerine kırılmasız boşluk, Word\'den kopyalarken gelen sıfır genişlikli birleştirici, sağdan sola geçersiz kılma, ya da aynı şapkalı harfin bir metinde tek kod noktası diğerinde iki kod noktası olarak yazılmış olması. Karşılaştırmalar tutmuyor, anahtarlar eşleşmiyor ve metinde gözle görülür hiçbir sorun yok.',
        'Bu inceleyici her kod noktasını kategorisiyle listeliyor ve önemli olanları işaretliyor: görünmez karakterler, iki yönlü geçersiz kılmalar — görüntülenen sırayı gerçek sıradan ayırabilirler — ve NFC biçiminde olmayan metin. Birleşen işaretler sessiz olanı: "ğ" tek bir kod noktası da olabilir, "g" artı birleşen kısa çizgi de; veritabanınızdakine eşit olan bunlardan yalnızca biri.',
        'Ayrıca NFC\'ye normalleştirebiliyor ya da görünmez karakterleri ayıklayabiliyor; boşluk sınıfındakileri silmek yerine düz boşluğa çeviriyor, böylece kelime sınırları korunuyor.',
      ],
      faq: [
        {
          q: 'Metin aynı görünürken karşılaştırma neden tutmuyor?',
          a: 'Çoğunlukla NFC\'ye karşı NFD. macOS\'tan kopyalanan metin sıklıkla ayrışık, Windows\'tan gelen genellikle birleşik olur. Karşılaştırmadan önce iki tarafı da normalleştirin ve tek bir biçimi tutarlı biçimde saklayın.',
        },
        {
          q: 'İki yönlü geçersiz kılmalar tehlikeli mi?',
          a: 'Olabilir. Kaynak kodda bir satırın görünen sırasının derleyicinin okuduğu sıradan farklı olmasına izin verirler — Trojan Source diye bilinen saldırı sınıfı. Bunları bir kod incelemesinde işaretlenmiş görmek de zaten amaç.',
        },
      ],
    },

    'tr-data': {
      heading: 'Gerçek doğrulamadan geçen Türkçe test verisi',
      body: [
        'Rastgele rakamlardan oluşan test verisi karşılaştığı ilk doğrulayıcıda takılır. T.C. kimlik numarasının ilk dokuz hanesinden hesaplanan iki kontrol hanesi vardır; IBAN ise yeniden düzenlenmiş dizenin tamamı üzerinde MOD-97-10 sağlaması taşır. Bunları yok sayan bir üreteç, kendi formunuzun reddettiği değerler üretir.',
        'Bu aracın ürettiği her TCKN ve IBAN kendi gerçek sağlamasından geçiyor, yani bir forma, bir seed betiğine ya da bir test verisine yapıştırıp doğrulamayı aşabiliyorsunuz. Yine de kurgusallar — algoritmanın doğru olması numaranın birine ait olduğu anlamına gelmiyor.',
        'Çıktı tablo, JSON ya da CSV olarak alınabiliyor; aynı kayıtlar yeniden biçimlendirmeye gerek kalmadan bir fixture dosyasına, bir istek gövdesine ya da bir tabloya gidebiliyor.',
      ],
      faq: [
        {
          q: 'TCKN kontrol hanesi nasıl hesaplanıyor?',
          a: 'Onuncu hane, tek konumdaki hanelerin yedi katından çift konumdakilerin çıkarılıp ona bölümünden kalan; on birinci hane ise ilk on hanenin toplamının ona bölümünden kalan. İkisi de burada hesaplanıyor, bu yüzden sonuçlar doğrulamadan geçiyor.',
        },
        {
          q: 'Üretilen bir numara gerçek bir kişiye ait olabilir mi?',
          a: 'Sağlaması geçerli bir numara yalnızca yapısal olarak geçerlidir — hiç verilip verilmediği hakkında bir şey söylemez. Çıktıyı test verisi sayın, asla gerçek bir kimlik olarak kullanmayın.',
        },
      ],
    },

    'date-format': {
      heading: 'Aynı tarih, birbirini tutmayan dört kalıp',
      body: [
        'Bu dört lehçe de tarih kalıbını aynı avuç dolusu harfle yazıyor ve her biri o harflerle başka bir şey kastediyor. Oracle’da ay MM, dakika MI. .NET’te ay MM, dakika mm. Delphi’de ay mm, dakika nn — yani Delphi’de hh:mm yazan kişi saatin yanına dakikayı değil AYI bastırıyor, üstelik sessizce, çünkü kalıp gayet geçerli.',
        'İkinci tuzak saat. Oracle çıplak HH’yi HH24 değil HH12 okur: 13:05 olan bir kayıt 01:05 basılır ve bunu ele verecek bir AM/PM de yoktur. Delphi hh’yi 24 saatlik okur, ama aynı kalıpta ampm geçiyorsa 12 saatliğe döner. Ayrımı görünür kılan yalnızca .NET ve dayjs: 24 saat için büyük H, 12 saat için küçük h.',
        'Üçüncüsü ayraç. .NET ve Delphi’de / ile : birer karakter değil, kültürün tarih ve saat ayracının yer tutucusudur. tr-TR altında tarih ayracı noktadır, yani dd/MM/yyyy kalıbı 24.08.2026 basar. Araç bu yüzden çıktıdaki bölü işaretini tırnaklıyor; iki noktayı ise neredeyse her kültür aynı bıraktığı için serbest bırakıyor.',
        'Her lehçeyi diğer üçüne tek tek eşlemek yerine kalıp önce adlandırılmış alanlara ayrıştırılıyor — yıl, dolgulu ay, 24 saatlik saat — sonra hedef lehçede yeniden yazılıyor. Bir alanın karşılığının hiç olmadığını söyleyebilmesinin sebebi de bu: .NET’te çeyrek ya da ISO hafta belirteci yok, Oracle’da da "milisaniye ama sondaki sıfırları at" diyebilmenin bir yolu yok.',
      ],
      faq: [
        {
          q: 'Oracle çıktısında FM nereden çıktı?',
          a: 'Kaynak kalıptaki bir alan dolgusuz olduğu için. FM olmadan Oracle sayıların başına sıfır koyar, MONTH ve DAY’i de dokuz karaktere kadar boşlukla doldurur. FM bir önek değil ANAHTAR olduğu için ikinci bir FM dolguyu geri açar — FMDD.FMMM.YYYY kalıbının günü dolgusuz, ayı dolgulu basmasının sebebi budur ve bunu kimse kasten yazmaz.',
        },
        {
          q: '.NET çıktısı neden yüzde işaretiyle başlıyor?',
          a: 'Tek karakterlik bir .NET biçim dizesi özel değil STANDART belirteç sayılır: ToString("M") ayı değil "24 Ağustos"u verir. %M yazmak onu özel ay belirteci olarak okutur. Araç bu işareti yalnızca kalıbın tamamı tek karaktere indiğinde ekliyor.',
        },
        {
          q: 'Ay ve gün adları Türkçe mi gelecek?',
          a: 'Bu kalıba değil, çalışma ortamına bağlı. Oracle NLS_DATE_LANGUAGE’dan, .NET iş parçacığının kültüründen, dayjs yüklü yerelden alır. Buradaki örnek çıktı bu sayfanın dilini kullanıyor; yani size biçimi gösteriyor, kelimeyi vaat etmiyor.',
        },
      ],
    },
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
    viaApi: "API üzerinden",
    runsLocally: 'yerelde çalışır',
  },

  notFound: {
    title: 'Sayfa bulunamadı',
    body: 'Bu adres burada bir araca ya da sayfaya karşılık gelmiyor.',
    back: 'Tüm araçlara dön',
  },

  demo: {
    open: 'aç',
    summary: 'fsdotnet araçlarının örnek girdiyi dönüştürdüğü döngüsel bir gösterim.',
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

  rtf: {
    document: 'RTF belgesi',
    plainText: 'Düz metin',
    placeholder: 'Bir RTF belgesi yapıştırın…',
    codepageAria: 'Kod sayfası',
    auto: 'Otomatik',
    detected: (codepage: number) => `cp${codepage} bildirilmiş`,
    fallback: (codepage: number) => `kod sayfası bildirilmemiş · cp${codepage} varsayıldı`,
    forced: (codepage: number) => `cp${codepage} olarak zorlandı`,
    example: 'Örnek',
  },

  sqlFormat: {
    query: 'SQL sorgusu',
    formatted: 'Biçimlendirilmiş',
    minified: 'Sıkıştırılmış',
    placeholder: 'Bir SQL sorgusu yapıştırın…',
    dialectAria: 'SQL lehçesi',
    modeAria: 'Çıktı biçimi',
    format: 'biçimlendir',
    minify: 'sıkıştır',
    caseAria: 'Anahtar sözcük kasası',
    upper: 'BÜYÜK',
    lower: 'küçük',
    preserve: 'olduğu gibi',
    example: 'Örnek',
    saved: (percent: number) => `%${percent} daha küçük`,
  },

  epoch: {
    input: 'Zaman damgası ya da tarih',
    output: 'Tüm gösterimler',
    placeholder: 'Zaman damgası ya da 2026-08-24T09:30:00Z gibi bir tarih yapıştırın…',
    unitAria: 'Girdi birimi',
    auto: 'otomatik',
    seconds: 'saniye',
    milliseconds: 'milisaniye',
    ticks: 'tick',
    now: 'Şimdi',
    read: (unit: string) => `${unit} olarak okundu`,
    labelIso: 'ISO 8601',
    labelUtc: 'UTC',
    labelLocal: 'Yerel',
    labelSeconds: 'Unix (sn)',
    labelMillis: 'Unix (ms)',
    labelTicks: '.NET tick',
  },

  dateFormat: {
    input: (dialect: string) => `${dialect} kalıbı`,
    placeholder: 'DD.MM.YYYY HH24:MI',
    sourceAria: 'Kaynak lehçe',
    sample: 'Örnek çıktı:',
    copy: (dialect: string) => `${dialect} kalıbını kopyala`,
    dropped: (fields: string) => `Bu lehçede karşılığı yok, yazılmadı: ${fields}`,
    referenceTitle: 'Aynı alan dört lehçede',
    referenceField: 'Alan',
    noEquivalent: 'Bu lehçede karşılığı yok',

    dialects: {
      oracle: 'Oracle',
      dotnet: '.NET',
      js: 'dayjs',
      delphi: 'Delphi',
    },

    units: {
      year4: 'Yıl, 4 hane',
      year2: 'Yıl, 2 hane',
      quarter: 'Çeyrek',
      month2: 'Ay, 01–12',
      month1: 'Ay, 1–12',
      monthShort: 'Ay adı, kısa',
      monthLong: 'Ay adı, tam',
      day2: 'Gün, 01–31',
      day1: 'Gün, 1–31',
      dayOfYear: 'Yılın günü',
      weekdayShort: 'Haftanın günü, kısa',
      weekdayLong: 'Haftanın günü, tam',
      weekdayNumber: 'Haftanın günü, sayı',
      hour24_2: 'Saat, 24’lük, 00–23',
      hour24_1: 'Saat, 24’lük, 0–23',
      hour12_2: 'Saat, 12’lik, 01–12',
      hour12_1: 'Saat, 12’lik, 1–12',
      minute2: 'Dakika, 00–59',
      minute1: 'Dakika, 0–59',
      second2: 'Saniye, 00–59',
      second1: 'Saniye, 0–59',
      fraction1: 'Saniyenin onda biri',
      fraction2: 'Saniyenin yüzde biri',
      fraction3: 'Milisaniye',
      meridiemUpper: 'AM / PM',
      meridiemLower: 'am / pm',
      offsetColon: 'UTC farkı, +03:00',
      offsetCompact: 'UTC farkı, +0300',
      offsetHours: 'UTC farkı, +03',
      zoneName: 'Saat dilimi adı',
      era: 'Çağ, AD / BC',
      isoWeek: 'ISO hafta',
      isoYear: 'ISO hafta yılı',
      secondsOfDay: 'Gece yarısından beri saniye',
      localeDate: 'Yerelin kısa tarihi',
      localeTime: 'Yerelin kısa saati',
    },

    notes: {
      oracleFm:
        'FM eklendi: onsuz Oracle sayıların başına sıfır koyar, MONTH ve DAY’i dokuz karaktere kadar boşlukla doldurur. FM bir önek değil anahtardır — ikincisi dolguyu geri açar.',
      oracleNamePad:
        'MONTH ve DAY dokuz karaktere kadar boşlukla dolduruluyor. Kırpmak için FMMONTH yazın.',
      oracleHh12:
        'Oracle’da çıplak HH, HH24 değil HH12 demektir: 13:05 olan saat 01:05 basılır. AM/PM de yazmıyorsanız HH24 kullanın.',
      oracleMinute: 'Oracle’da dakika MI’dir. MM aydır.',
      dotnetSingle:
        '%M olarak yazıldı, çünkü tek karakterlik bir .NET biçim dizesi standart belirteç sayılır: ToString("M") ayı değil, tam bir tarih verir.',
      dotnetSeparator:
        '.NET’te / ve : birer karakter değil, kültürün ayraç yer tutucusudur. Bölü işareti burada tırnaklandı çünkü tr-TR altında nokta basıyor; iki nokta neredeyse her kültürde aynı kaldığı için serbest bırakıldı — birebir kalması şartsa onu da tırnaklayın.',
      dotnetMeridiem:
        'tt kültürü izler: en-US’te AM, tr-TR’de ÖÖ. Küçük harfli bir belirteç yok.',
      delphiMinute: 'Delphi’de dakika nn’dir. mm aydır, yani hh:mm saatin yanına ayı basar.',
      delphiHour:
        'Delphi hh’yi, aynı kalıpta ampm geçmiyorsa 24 saatlik okur. Bu kalıpta 12 saatlik bir alan var ama ampm yok.',
      delphiSeparator:
        'Delphi’de / ve : global DateSeparator ve TimeSeparator değişkenleridir. Bölü işareti, Türkçe yerel altında bölü kalsın diye tırnaklandı.',
      dayjsPlugin:
        'Bu token’lardan biri dayjs eklentisi istiyor — advancedFormat, isoWeek ya da timezone. Moment’te hepsi hazır gelir.',
      dropped: 'Bazı alanların bu lehçede karşılığı yok, kalıba yazılmadı.',
      approx: 'Bir token birebir değil, en yakın karşılık — örnek çıktıyı kontrol edin.',
    },
  },

  jwt: {
    token: 'JWT',
    output: 'Çözülmüş',
    placeholder: 'Bir JWT yapıştırın — bu sekmeden çıkmaz…',
    sectionHeader: 'HEADER',
    sectionPayload: 'PAYLOAD',
    sectionClaims: 'CLAIM',
    signatureNote: (algorithm: string) => `${algorithm} ile imzalı · imza doğrulanmadı`,
    unsigned: 'imzasız token',
    expired: 'süresi geçmiş',
    notYetValid: 'henüz geçerli değil',
    example: 'Örnek',
  },

  uuid: {
    output: 'Üretilenler',
    versionAria: 'UUID sürümü',
    v4: 'v4 rastgele',
    v7: 'v7 zaman sıralı',
    countAria: 'Adet',
    uppercase: 'BÜYÜK HARF',
    braces: 'süslü parantez',
    generate: 'Üret',
    count: (n: number) => `${n} kimlik`,
  },

  httpStatus: {
    searchLabel: 'Kod, ad ya da .NET sabiti ara',
    placeholder: '404, "teapot" ya da Status422 deneyin…',
    filterAria: 'Durum sınıfı',
    all: 'hepsi',
    dotnetLabel: 'ASP.NET Core sabiti',
    empty: 'Eşleşen durum kodu yok.',
    count: (n: number) => `${n} kod`,
    copied: '.NET sabitini kopyala',
  },

  color: {
    inputLabel: 'Renk',
    placeholder: '#0080ff, rgb(0 128 255), hsl(210 100% 50%)…',
    formats: 'Biçimler',
    contrast: 'Kontrast',
    onWhite: 'beyaz üstünde',
    onBlack: 'siyah üstünde',
    normalText: 'normal metin',
    largeText: 'büyük metin',
    pass: 'AA',
    passAAA: 'AAA',
    fail: 'kalıyor',
  },

  csv: {
    input: 'CSV',
    output: 'Sonuç',
    placeholder: 'CSV yapıştırın — ilk satır başlık kabul edilir…',
    modeAria: 'Çıktı biçimi',
    json: 'JSON',
    sql: 'SQL INSERT',
    delimiterAria: 'Ayraç',
    comma: 'virgül',
    semicolon: 'noktalı virgül',
    tab: 'sekme',
    pipe: 'dik çizgi',
    headerRow: 'ilk satır başlık',
    tableLabel: 'Tablo adı',
    rows: (n: number) => `${n} satır`,
    example: 'Örnek',
  },

  unicode: {
    input: 'Metin',
    placeholder: "İncelenecek metni yapıştırın — Word'den kopyalanmış bir şey deneyin…",
    codePoints: 'kod noktası',
    utf16Units: 'UTF-16 birimi',
    utf8Bytes: 'UTF-8 bayt',
    graphemes: 'grafem',
    suspiciousTitle: 'Görünmez ya da riskli karakterler',
    suspiciousNone: 'Görünmez karakter bulunamadı.',
    suspiciousCount: (n: number) => `${n} tane bulundu`,
    bidiWarning: 'Yön değiştirme kontrolü içeriyor — görünen sıra gerçek sıradan farklı olabilir.',
    normalizeTitle: 'Normalizasyon',
    notNfc: 'NFC değil — birleşen işaret var. NFC metinle karşılaştırma tutmayacak.',
    isNfc: 'Zaten NFC.',
    toNfc: "NFC'ye çevir",
    strip: 'Görünmezleri temizle',
    tableTitle: 'Kod noktaları',
    truncated: (shown: number, total: number) => `${total} taneden ilk ${shown} gösteriliyor`,
    example: 'Örnek',
  },

  caseConvert: {
    input: 'Tanımlayıcılar',
    placeholder: 'Her satıra bir tane: kitap_id, eklemeTarihi…',
    localeAria: 'Kasa yereli',
    invariant: 'invariant',
    turkish: 'tr-TR',
    localeWarning: 'Türkçe kasa bu sonucu değiştiriyor — i↔İ ve I↔ı. Tanımlayıcılarda neredeyse her zaman invariant istenir.',
    example: 'Örnek',
  },

  trData: {
    output: 'Üretilenler',
    countAria: 'Kaç kayıt',
    formatAria: 'Çıktı biçimi',
    table: 'tablo',
    json: 'JSON',
    csv: 'CSV',
    fieldsTitle: 'Alanlar',
    generate: 'Üret',
    rows: (n: number) => `${n} kayıt`,
    checksumNote: 'Üretilen her TCKN ve IBAN gerçek checksum doğrulamasını geçer.',
  },

  inList: {
    input: 'Değerler',
    output: 'SQL',
    placeholder: 'ID kolonunu yapıştırın — satır, virgül ya da sekme ayraçlı…',
    columnLabel: 'Kolon',
    quoteAria: 'Tırnaklama',
    auto: 'otomatik',
    always: 'tırnakla',
    never: 'ham',
    dedupe: 'tekrarları at',
    chunkLabel: 'Parça boyutu',
    stats: (count: number, chunks: number) =>
      chunks === 1 ? `${count} değer` : `${count} değer · ${chunks} parçaya bölündü`,
    duplicates: (n: number) => `${n} tekrar atıldı`,
    oracleNote: "1000 ifadeyi aşınca Oracle ORA-01795 verir; liste parçalanıp OR ile birleştirilir.",
  },

  oraErrors: {
    searchLabel: 'Kod, mesaj ya da sebep ara',
    placeholder: 'ORA-01722, "table or view", sequence…',
    filterAria: 'Hata grubu',
    all: 'hepsi',
    empty: 'Eşleşen hata yok.',
    count: (n: number) => `${n} hata`,
    causeLabel: 'Tipik sebep',
  },

  bindParams: {
    input: "Bind'li sorgu",
    output: 'Çalıştırılabilir sorgu',
    placeholder: 'select * from kitap where id = :id …',
    styleAria: 'Bind biçimi',
    oracle: ':ad',
    sqlserver: '@ad',
    paramsTitle: 'Parametreler',
    noBinds: 'Bu sorguda bind değişkeni bulunamadı.',
    typeAria: 'Değer tipi',
    typeAuto: 'otomatik',
    typeNumber: 'sayı',
    typeText: 'metin',
    typeDate: 'tarih',
    typeNull: 'NULL',
    missing: (names: string) => `Değer bekleniyor: ${names}`,
    debugNote: "Yalnızca debug için — üretim kodunda bind kullanmaya devam edin.",
    example: 'Örnek',
  },

  sqlDiff: {
    before: 'Önce',
    after: 'Sonra',
    placeholderBefore: 'Eski sürümü yapıştırın…',
    placeholderAfter: 'Yeni sürümü yapıştırın…',
    normalize: 'önce iki tarafı da biçimlendir',
    normalizeHint: 'Sadece girinti değişmişse fark göstermez.',
    added: 'eklendi',
    removed: 'silindi',
    unchanged: 'değişmedi',
    identical: 'İki taraf birebir aynı.',
    truncated: (max: number) => `Yalnızca ilk ${max} satır karşılaştırıldı.`,
    example: 'Örnek',
  },

  jsonToCsharp: {
    input: 'JSON örneği',
    outputCsharp: 'C#',
    outputTypescript: 'TypeScript',
    placeholder: 'Bir cevap gövdesi yapıştırın — tip ondan çıkarılır…',
    targetAria: 'Hedef',
    record: 'record',
    class: 'class',
    typescript: 'TypeScript',
    rootLabel: 'Kök tip',
    pascalCase: 'PascalCase + [JsonPropertyName]',
    nullableRefTypes: 'nullable referans tipleri',
    fractionAria: 'Ondalık sayılar için tip',
    noteCsharp: 'dizideki bütün elemanlar birleştirilir',
    noteTypescript: 'anahtarlar teldeki hâliyle korunur',
  },

  sqlToLinq: {
    input: 'SELECT ifadesi',
    output: 'LINQ',
    placeholder: 'Bir SELECT yapıştırın — JOIN, WHERE, GROUP BY ve ORDER BY okunur…',
    syntaxAria: 'LINQ söz dizimi',
    querySyntax: 'sorgu',
    methodSyntax: 'metot',
    contextLabel: 'DbContext',
    draftNote: 'Taslak üretir, derlemez — çalıştırmadan önce okuyun.',
  },

  xmlJson: {
    xml: 'XML',
    json: 'JSON',
    directionAria: 'Yön',
    toJson: 'XML → JSON',
    toXml: 'JSON → XML',
    placeholderXml: 'Bir XML belgesi yapıştırın — SOAP gövdesi de olur…',
    placeholderJson: 'JSON yapıştırın — @ad özniteliğe dönüşür…',
    keepAttributes: 'öznitelikleri koru',
    inferTypes: 'sayı ve mantıksal değer',
    newtonsoftNote: 'SerializeXmlNode ile aynı şekil',
  },

  codeFormat: {
    input: 'Kaynak',
    formatted: 'Biçimlendirilmiş',
    minified: 'Küçültülmüş',
    placeholder: 'JSON, XML, HTML ya da CSS yapıştırın…',
    languageAria: 'Dil',
    auto: 'otomatik',
    modeAria: 'Mod',
    format: 'biçimlendir',
    minify: 'küçült',
    indentLabel: 'Girinti',
    detected: (language: string) => `algılanan: ${language}`,
  },

  hash: {
    input: 'Metin',
    placeholder: 'Yazın ya da yapıştırın — hiçbir yere gönderilmiyor…',
    digests: 'Özetler',
    algorithm: 'Algoritma',
    digest: 'Özet',
    encodingAria: 'Çıktı kodlaması',
    hmacLabel: 'HMAC anahtarı',
    hmacPlaceholder: 'boş = düz özet',
    hmacOn: 'HMAC',
    plainDigest: 'düz özet',
    bytes: (count: string) => `${count} bayt girdi`,
    weak: 'zayıf',
    weakTitle: 'İmza ve parola için kırık — yalnızca eski veriyi doğrulamak içindir.',
    notAvailable: 'anahtar alamaz',
    note: 'SHA özetleri tarayıcının WebCrypto API’sinden geliyor; CRC32 ve MD5 burada hesaplanıyor çünkü WebCrypto onları uygulamayı reddediyor.',
  },

  cron: {
    expression: 'Cron ifadesi',
    placeholder: '*/15 * * * *',
    flavourAria: 'Lehçe',
    unix: 'Unix (5)',
    quartz: 'Quartz (6-7)',
    unixShape: 'dk saat ayGün ay haftaGün',
    quartzShape: 'sn dk saat ayGün ay haftaGün [yıl]',
    fields: 'Alanlar',
    field: 'Alan',
    raw: 'Yazılan',
    expands: 'Karşılığı',
    nextRuns: 'Sonraki çalışmalar',
    fieldNames: {
      second: 'Saniye',
      minute: 'Dakika',
      hour: 'Saat',
      dayOfMonth: 'Ayın günü',
      month: 'Ay',
      dayOfWeek: 'Haftanın günü',
      year: 'Yıl',
    },
    orRuleNote:
      'Ayın günü ve haftanın günü İKİSİ de kısıtlıysa klasik cron, biri tutunca çalışır — ikisi birden değil. Quartz birinde ? zorunlu kılarak bu soruyu ortadan kaldırıyor.',
  },

  regex: {
    pattern: 'Desen',
    patternPlaceholder: String.raw`(?<ad>\w+)`,
    testString: 'Test metni',
    replacement: 'Değiştirme',
    replacementPlaceholder: 'Boş bırakırsanız atlanır — $1, $<ad> ve $& çalışır',
    matches: 'Eşleşmeler',
    noMatches: 'Eşleşme yok.',
    noCapture: 'yakalamadı',
    engineAria: 'Motor',
    javascript: 'JavaScript',
    dotnet: '.NET',
    running: 'çalışıyor…',
    matchCount: (count: number) => `${count} eşleşme`,
    truncated: 'ilk 500 gösteriliyor',
    serverNotConfigured:
      '.NET motoru API gerektiriyor; bu dağıtım için tanımlı bir API adresi yok.',
    serverUnreachable: '.NET motoru cevap vermedi.',
    fallbackToJs: 'Onun yerine JavaScript sonucu gösteriliyor.',
    flavourTitle: 'JavaScript ile .NET farkı',
    flags: {
      ignoreCase: 'i',
      multiline: 'm',
      dotAll: 's',
      unicode: 'u',
      cultureInvariant: 'invariant',
    },
    notes: {
      balancingGroup: 'Denge grupları yalnızca .NET’te var; JavaScript bunu derlemez bile.',
      conditional: 'Koşullu desenler yalnızca .NET’te var.',
      inlineOptions: 'Satır içi seçenekler .NET’e özgü; JavaScript’te bayraklar ifadenin kendisine yazılır.',
      anchors: String.raw`\A, \z, \Z ve \G yalnızca .NET’te var — JavaScript’te ^ ve $ kullanın.`,
      quotedGroupName: "(?'ad') yazımı .NET'e özgü; JavaScript (?<ad>) ister.",
      digitUnicode: String.raw`.NET’te \d ASCII dışı rakamları da yakalar (٤٢). JavaScript için u bayrağı ve \p{Nd} gerekir.`,
      wordUnicode: String.raw`.NET’te \w Unicode harfleri kapsar; JavaScript ASCII ile sınırlı kalır.`,
      dollarNewline: '.NET’te $ sondaki satır sonundan önce de eşleşir. JavaScript yalnızca en sonda eşleşir.',
      unicodeCategory: String.raw`.NET \p{…} ifadesini her zaman okur; JavaScript u bayrağı ister.`,
      turkishCase:
        'RegexOptions.IgnoreCase sunucunun kültürünü izler. tr-TR altında I ile i farklı harflerdir — bunu kastetmediyseniz CultureInvariant açın.',
    },
  },

  errors: {
    base64Alphabet: 'Geçersiz Base64 — alfabede olmayan karakter içeriyor.',
    base64Length: "Geçersiz Base64 — uzunluk 4'ün katı değil.",
    base64Utf8: 'Çözüldü ama sonuç geçerli UTF-8 metin değil — ikili veri olabilir.',
    sqlInvalid: 'Bu SQL olarak ayrıştırılamadı — kapanmamış tırnak veya parantez olabilir.',
    epochEmpty: 'Bir zaman damgası ya da tarih girin.',
    epochUnparsable: 'Bu, tarayıcının okuyabileceği bir zaman damgası ya da tarih değil.',
    epochOutOfRange: 'JavaScript tarihlerinin gösterebileceği aralığın dışında.',
    jwtEmpty: 'İncelemek için bir JWT yapıştırın.',
    jwtShape: 'Bir JWT tam olarak nokta ile ayrılmış üç parçadan oluşur.',
    jwtSegment: 'Bir parça geçerli base64url ya da geçerli UTF-8 değil.',
    jwtJson: 'Parça çözüldü ama geçerli JSON değil.',
    csvEmpty: 'Dönüştürmek için CSV yapıştırın.',
    csvNoRows: 'Yalnızca başlık satırı var — dönüştürülecek veri yok.',
    inListEmpty: 'En az bir değer yapıştırın.',
    rtfNotRtf: String.raw`Bu bir RTF belgesine benzemiyor — RTF {\rtf ile başlar.`,
    jsonEmpty: 'JSON yapıştırın.',
    jsonInvalid: 'Geçerli JSON değil.',
    jsonNotObject: 'Bir nesne ya da dizi gerekiyor — tip üretilecek bir şey yok.',
    xmlEmpty: 'Bir XML belgesi yapıştırın.',
    xmlInvalid: 'Bu XML olarak ayrıştırılamadı.',
    xmlRootShape: "XML tek bir kök eleman ister, bu yüzden JSON'ın nesne olması gerekiyor.",
    xmlBadName: 'Bu anahtar XML eleman adı olamaz.',
    formatUnknownLanguage: 'Bunun ne olduğu anlaşılamadı — dili kendiniz seçin.',
    cronEmpty: 'Bir cron ifadesi girin.',
    cronFieldCount: 'Bu lehçe için alan sayısı yanlış.',
    cronField: 'Bir alan aralık dışında ya da bozuk.',
    cronUnreachable: 'Bu ifade hiç çalışmaz — gün ve ayı birlikte kontrol edin.',
    regexEmpty: 'Bir desen girin.',
    regexInvalid: 'Motor bu deseni kabul etmedi.',
    regexServerDown: '.NET motoru kullanılamıyor.',
    sqlSelectOnly: 'Yalnızca SELECT ifadeleri çevrilebilir.',
    sqlNoFrom: 'İfadede FROM yan tümcesi yok.',
    dateFormatEmpty: 'Bir tarih biçim kalıbı girin.',
    dateFormatNoTokens: 'Burada tarih alanı yok — girilenin tamamı düz metin.',
  },
};
