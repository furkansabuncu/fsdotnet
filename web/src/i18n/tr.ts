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
    'sql-fix': 'Sorgu neden çalışmıyor — bul ve düzelt.',
    'linq-11g': 'Oracle 11g’de kırılan EF Core kalıpları.',
    'pas-sql': 'Delphi biriminden gömülü SQL’i çıkarır.',
    'oracle-identity': 'Otomatik anahtar için sequence ve trigger.',
    'turkish-culture': 'Yalnızca tr-TR altında bozulan kod.',
    'guid-raw': 'Satırları sessizce kaybettiren bayt sırası.',
    'ddl-entity': 'CREATE TABLE’dan entity ve eşlemesi.',
    'odp-call': 'Ref cursor çağrı iskeleti, doğru yazılmış.',
    'conn-string': 'Çöz, kur, şifreyi maskele.',
    'merge-sql': 'USING dual’ı elle yazmadan upsert.',
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

    'sql-fix': {
      heading: 'Doğru görünen bir sorgu neden çalışmaz',
      body: [
        'Çalışmayan sorguların çoğunun grameri bozuk değildir; yolda hasar görmüştür. Word’den kopyalanan sorgu kıvrık tırnaklar ve kırılmaz boşluklarla gelir; sohbet penceresinden kopyalanan yanında SQL*Plus istemini ya da markdown çitini getirir; Delphi veya C#’ta string birleştirerek kurulan sorgu ekteki boşluğu kaybeder ve tablo adıyla bir sonraki yan tümce tek kelime olur. Oracle bunlara ORA-00911 “geçersiz karakter” der — doğrudur ve hiçbir şey anlatmaz, çünkü şikâyet ettiği karakter ekranda görünmüyordur.',
        'İkinci grup lehçe. SQL Server için yazılmış bir sorgu geçerli SQL’dir ve Oracle’da yine de patlar: tanımlayıcı etrafında köşeli parantez, tablo takma adından önce AS, parametre önünde @, NVL yerine ISNULL, ve metin değerinin etrafında çift tırnak — ki Oracle onu kolon adı okur ve ORA-00904 der. SELECT TOP ile OFFSET / FETCH aynı hikâyenin bir üst basamağı: adı değiştirilerek değil, ROWNUM’a yeniden yazılarak çevrilirler.',
        'Bu araç bir tamir servisi değil, auto-fix’li bir linter. Her bulgu ayrı listeleniyor, ayrı uygulanıyor ve dokunmayacaklarını da söylüyor. Bu bilinçli bir tercih: hata veren sorgu gürültülü bir arızadır, görürsünüz; sessizce “düzeltilmiş” sorgu ise sessiz bir arızadır ve yanlış satırları döndürür. Fazladan bir virgülü silmek güvenli, ama ifadenin yapısını değiştirmek aracın değil sizin kararınız.',
        'Yapamayacağı şey, veritabanı gerektiren her şey. Yanlış yazılmış tablo ya da kolon adı, iki tabloda birden bulunan belirsiz kolon, dönüşmeyen bir tip — bunlar için şema gerekir ve şema burada yok. Yapıştırdığınız hiçbir şey tarayıcıdan çıkmıyor; bu da aynı tasarımın öteki yarısı: kurum içi sorguların denetlenmek için bir siteye yüklenmesi gerekmez.',
      ],
      faq: [
        {
          q: 'Sorgum bir yere yükleniyor mu?',
          a: 'Hayır. Bütün denetimler bu sekmede çalışıyor; sunucuya istek gitmiyor, içerik üzerinden ölçüm yapılmıyor. Bu araçta bu, çoğundan daha önemli: insanların denetlemek istediği sorgular genellikle paylaşmaya en az izinli oldukları sorgulardır.',
        },
        {
          q: 'Delphi sorgumda neden tek bir bulgu çıktı?',
          a: 'Çünkü girdinin tamamı hâlâ bir .pas dosyasından gelen tırnaklı bir string’di. O çözülmeden öteki denetimler tek bir uzun metin sabitine bakmış olur ve söyledikleri her şey yanlış olurdu. O düzeltmeyi uygulayıp sonucu girdiye taşıyın; sorgu ikinci turda gerçekten denetlenir.',
        },
        {
          q: 'Hiçbir bulgu çıkmadı ama sorgu yine çalışmıyor. Şimdi ne olacak?',
          a: 'O hâlde sorun veritabanını gerektiriyor. En sık sebepler: var olmayan bir ad, birleştirilen iki tabloda da bulunan bir kolon (ORA-00918), dönüşmeyen bir değer (ORA-01722) ya da eksik yetki. Bunların hiçbirine sorgunun metnine bakarak karar verilemez.',
        },
      ],
    },

    'linq-11g': {
      heading: 'Derlenip Oracle 11g’de patlayan EF Core kodu',
      body: [
        'Bu aracın bildirdiği her kalıp geçerli C#. Derleniyor, in-memory sağlayıcıya karşı birim testleri geçiyor, sonra sorgu 11g’ye ulaşıyor ve hata veriyor. Dönen mesaj sebebi değil semptomu adlandırıyor: ORA-00904: "FALSE": geçersiz belirleyici, bir Select projeksiyonunun içine karşılaştırma yazdığınızdan hiç söz etmiyor; CS0854 de itiraz ettiği çağrının iki satır yukarıdaki Query() olduğunu söylemiyor.',
        'En büyük grup, Oracle 11g’de düpedüz OLMAYAN şeyler. Boolean tipi yok, dolayısıyla EF Core TRUE ya da FALSE üretemiyor — Kapali = x.durum == 3 gibi bir projeksiyon SELECT listesinde bir literale dönüşüyor ve ifade ölüyor. OFFSET … FETCH de yok, o 12c ile geldi; yani Skip ve Take sunucunun ayrıştıramayacağı SQL üretiyor. AnyAsync yaygın kullanılan sağlayıcı sürümlerinde benzer bir sebeple patlıyor.',
        'İkinci grup, yapının NE olduğundan çok NEREDE durduğuyla ilgili. Any(…) EXISTS’e çevriliyor, ama yalnızca bir Where predicate’i içinde; aynı çağrı Select’in içinde çevrilemiyor. Query() ifade ağacına dönüşen bir lambdanın içi dışında her yerde sorunsuz, çünkü ifade ağaçları isteğe bağlı argüman taşıyan çağrı içeremiyor. Aracın metot adını eşleştirmek yerine SARAN ÇAĞRIYA bakmasının sebebi bu — ve SQL’e hiç uğramayan list.Any() karşısında susmasının da.',
        'Buradaki hiçbir denetim şema ya da derleyici gerektirmiyor, dolayısıyla yapıştırdığınız hiçbir şey tarayıcıdan çıkmıyor. Bunun bedeli kesinlik: denetimler metne bakıyor, o yüzden fazla bildirmek yerine eksik bildirecek şekilde yazıldılar. Boşuna alarm veren bir lint kapatılıyor, kapatıldığında da gerçek bulgu görülmüyor.',
      ],
      faq: [
        {
          q: 'Where içindeki Any() neden işaretlenmiyor?',
          a: 'Çünkü o doğru olan. Any, bir Where predicate’i içinde geçtiğinde EXISTS alt sorgusuna çevriliyor — desteklenen biçim tam olarak bu. Onu bildirmek, aracı en yaygın geçerli durumda yanlış yapardı.',
        },
        {
          q: 'AnyAsync’i FirstOrDefaultAsync(…) != null yaptı — bu her zaman güvenli mi?',
          a: 'İfadenin kendisi için evet: await, !=’den önce bağlanıyor, dolayısıyla sonuç if içinde de, atamada da, return’de de bool kalıyor. Değişen şey veritabanının yaptığı iş — FirstOrDefaultAsync evet/hayır yerine bir satır çekiyor, yani geniş bir tabloda önce tek kolon projeksiyonu yapmaya değer.',
        },
        {
          q: '12c ya da 19c kullanıyoruz. Yine işe yarar mı?',
          a: 'Kısmen. Skip / Take ve identity kolonları 12c’den itibaren sorun değil, o bulgular gürültüye dönüşüyor. Yapının nerede durduğuyla ilgili olanlar — projeksiyonda Any, Select içinde bool, lambda içinde Query() — sürümden bağımsız ve geçerliliğini koruyor.',
        },
      ],
    },

    'pas-sql': {
      heading: 'Delphi biriminden SQL’i çıkarmak',
      body: [
        'Eski bir VCL uygulamasında sorgular bir veri katmanında durmuyor. Form event handler’larının içinde, satır başına bir string sabiti hâlinde, + ile birleştirilerek kuruluyor ve bir değer araya girecek her yerde kesiliyor. Onları okumak her dönüşümün ilk adımı ve tam bir angarya: makinenin birebir birleştirebileceği bir şeyi gözle birleştiriyorsunuz.',
        'Bu birleştirmenin tek başına otomatikleştirmeye değer bir ayrıntısı var. İki sabitin buluştuğu yerde ekteki boşluk ya ikiye katlanıyor ya hiç kalmıyor; ikincisi sessiz — from siparis + where kanal_id = 5 birleşince from sipariswhere kanal_id = 5 oluyor ve Oracle bunu bambaşka bir yerde geçersiz belirleyici olarak bildiriyor. Araç o boşluğu, SQL lint’inin tespit için kullandığı aynı kuralla geri koyuyor.',
        'Ayırdığı ikinci şey, değerlerin nasıl girdiği. Bağlama değişkeni (:kanal_id) veritabanının gördüğü bir yer tutucu; enterpole edilmiş bir Pascal ifadesi (+ IntToStr(FUyeId)) ise veritabanı daha hiçbir şey görmeden ifadeye yapıştırılmış metin. Kaynakta benzer görünüyorlar ve uzaktan yakından aynı şey değiller — biri parametreli, öteki bir enjeksiyon kapısı ve hard parse üreteci. Çıktı, enterpole parçaları yerinde işaretliyor ve ayrıca listeliyor.',
        'Ayrıştırıcı yalnızca Pascal string ifadelerini anlıyor, fazlasını değil. Bu bilinçli: aranan şey ifadenin kendisi, çevresindeki kontrol akışı değil — tam bir Object Pascal ayrıştırıcısı burada hiçbir ek fayda sağlamadan başlı başına bir proje olurdu.',
      ],
      faq: [
        {
          q: 'Çıkarılan SQL olduğu gibi çalışır mı?',
          a: 'Sorgu tamamen parametreliyse evet. Bir değer enterpole edilmişse onun yerinde {…} işareti görürsünüz — araç bilemeyeceği bir değeri uydurmayı reddediyor. Her işareti bir bağlama değişkeniyle değiştirin; taşınan kodun zaten kullanması gereken şey o.',
        },
        {
          q: 'Sorgunun metni neden birebir yazıldığı gibi bırakılmıyor?',
          a: 'Çünkü yazıldığı hâliyle onlarca sabite yayılmış ve boşlukları tutarsız. Arka arkaya boşluklar sadeleşiyor ve yan tümce anahtarlarının etrafına boşluk konuyor; bu, sonucu okunur ve çalıştırılabilir yapan en küçük değişiklik. String sabitlerinin içine dokunulmuyor.',
        },
        {
          q: 'Bütün bir birimi yapıştırabilir miyim?',
          a: 'Evet. SQL’e benzeyen her string ifadesi kendi bloğu olarak, kaynak satır aralığı ve atandığı değişkenle birlikte bildiriliyor; yani on beş sorgulu bir birim tek bir yığın değil, on beş blok olarak geri geliyor.',
        },
      ],
    },

    'oracle-identity': {
      heading: 'Identity kolonlar yokken Oracle’da otomatik artan anahtar',
      body: [
        'Oracle’da 12c’ye kadar identity kolon yoktu. Ondan önce otomatik artan bir birincil anahtar iki nesne demek: numara üreten bir SEQUENCE ve onu satıra koyan bir BEFORE INSERT tetikleyicisi. Bunu elle yazan herkes eninde sonunda aynı yan tümceyi unutuyor ve yol açtığı arıza eksik bir yan tümce gibi görünmüyor.',
        'O yan tümce WHEN (NEW.id IS NULL). Onsuz tetikleyici her eklemede anahtarı eziyor — bilerek anahtar verilmiş eklemelerde de. Bu, en çok veri taşımada ortaya çıkıyor: satırları özgün anahtarlarıyla yüklüyorsunuz, tetikleyici onları sessizce değiştiriyor ve içeri alınan kümedeki her yabancı anahtar artık yanlış satırı gösteriyor. Hiçbir hata alınmıyor. Yan tümce varken açıkça verilen anahtara dokunulmuyor, yalnızca NULL olana değer üretiliyor.',
        'İkinci tuzak ad. Oracle 11g bir tanımlayıcıya 30 karakter veriyor ve sınır OLUŞTURULAN nesnelere işliyor, sizin tablonuza değil. kurum_disi_sevk_talep_kaydi adlı bir tablo 27 karakter ve gayet meşru, ama başına SEQ_ gelince 31, TRG_…_BI olunca 34 oluyor. ORA-00972 betik çalıştığında geliyor, yani genellikle siz yazarken değil, bir deploy sırasında.',
        '12c’den itibaren bunların hiçbiri gerekmiyor: identity kolon aynı işi tek satırda, satır başına tetikleyici çalıştırmadan yapıyor. GENERATED BY DEFAULT ON NULL AS IDENTITY, WHEN yan tümcesinin verdiği "elle değer verilebilir" davranışını da koruyor.',
      ],
      faq: [
        {
          q: 'Neden NOCACHE değil CACHE 20?',
          a: 'NOCACHE her bir numara için veri sözlüğüne yazıyor ve eşzamanlı eklemelerde bu bir seri hâle getirme noktasına dönüşüyor. CACHE’in varsayılan olmasının sebebi bu. Bedeli boşluklar: örnek yeniden başladığında kullanılmayan önbellek numaraları kayboluyor, yani anahtar bir sayaç değil kimlik. Geri alınan bir ekleme de numarasını hiç iade etmiyor — önbellekli ya da değil.',
        },
        {
          q: 'Tetikleyici :NEW.id := seq.NEXTVAL kullansa daha mı iyi?',
          a: '11g’den itibaren çalışıyor ve bir miktar daha hızlı. Burada SELECT … INTO üretiliyor çünkü daha eski sürümlerde de çalışıyor ve bir taşıma betiği genellikle birden fazla ortamda koşmak zorunda.',
        },
        {
          q: 'Tetikleyiciyi kaldırıp anahtarı uygulama versem olur mu?',
          a: 'Olur, hatta yoğun bir tabloda çoğu zaman daha iyi: uygulama seq.NEXTVAL’i çağırıyor, değeri elinde tutuyor, satır başına tetikleyiciden ve anahtarı geri okumak için bir gidiş dönüşten kurtuluyor. Tetikleyici, başka yerden yazılan eklemelerin — bir betik, bir rapor aracı, eski bir form — yine de anahtar alabilmesi için var.',
        },
      ],
    },

    'turkish-culture': {
      heading: 'Türkçe bir sunucuda "file".ToUpper() neden FİLE',
      body: [
        'Türkçede iki tane i harfi var. Noktalı olan i büyürken İ oluyor, noktasız olan ı büyürken I. Dolayısıyla tr-TR kültürü altında "file".ToUpper() FİLE üretiyor ve "FILE" ile karşılaştırma başarısız oluyor. Hiçbir şey hata fırlatmıyor. Kod geliştirici makinesinde çalışıyor, incelemeden geçiyor ve kültürü Türkçe olan bir sunucuda koştuğu gün başka davranmaya başlıyor.',
        'Aynı sınıf sorun sayıları ve tarihleri de kapsıyor. tr-TR’de ondalık ayracı virgül, yani double.Parse("3.14") değere göre ya hata veriyor ya 314 okuyor. Tarih ayracı nokta ve .NET biçim dizesinde / bir bölü işareti değil, kültürün kullandığı şeyin yer tutucusu — dolayısıyla "dd/MM/yyyy" nokta basıyor. Bunların hiçbiri .NET’te hata değil; kültüre duyarlı aşırı yüklemelerin belgelenmiş davranışı ve aksini söylemediğinizde elinize geçen tam olarak onlar.',
        'Buradaki denetimlerin aradığı şey bu: aksini söylemeyen aşırı yükleme. Kültürsüz ToUpper(), yalnızca dize alan StartsWith, IFormatProvider’sız Parse, CultureInvariant’sız RegexOptions.IgnoreCase. Roslyn çözümleyicileri CA1305, CA1307 ve CA1310 aynı alanın bir kısmını kapsıyor; bu araç, hiçbir şey yapılandırmadan bir kod incelemesinde bir parçaya doğrultabileceğiniz hâli.',
        'Kural basit: değeri bir makine okuyorsa invariant ya da ordinal aşırı yüklemeyi kullanın. Bir insan okuyorsa kültürlü olanı. Bir tanımlayıcıdaki, dosya adındaki, veritabanı anahtarındaki ya da protokoldeki hemen her dizeyi makine okuyor.',
      ],
      faq: [
        {
          q: 'ToUpperInvariant her zaman doğru düzeltme mi?',
          a: 'Karşılaştırma ve saklama için evet — invariant’ın varlık sebebi bu. Kullanıcıya gösterilen metin içinse yanlış olan o: Türkçe okuyan biri ISTANBUL değil İstanbul bekliyor. Ayrım sonucu kimin okuduğunda, hangisinin daha güvenli olduğunda değil.',
        },
        {
          q: 'StartsWith neden işaretleniyor? Sıradan bir önek kontrolü gibi duruyor.',
          a: 'Çünkü tek argümanlı aşırı yükleme varsayılan olarak kültüre duyarlı ve bu neredeyse herkesi şaşırtıyor. Ayrıca tam harmanlamayı çalıştırdığı için ordinal karşılaştırmadan ölçülebilir biçimde yavaş. CA1310 aynı çağrıyı işaretliyor.',
        },
        {
          q: 'Sunucumuz InvariantGlobalization açık çalışıyor. Yine önemli mi?',
          a: 'Daha az, ama önemsiz değil. Invariant globalization modu ICU’yu kaldırıp kültüre duyarlı işlemleri invariant gibi davrandırıyor — bu da aynı kod, o ayarı yapmayan bir serviste yeniden kullanılana ya da bir istemci kütüphanesi CurrentCulture’ı açıkça değiştirene kadar sorun değil. Niyeti yazmanın maliyeti yok ve taşınmaya dayanıyor.',
        },
      ],
    },

    'guid-raw': {
      heading: 'Veritabanında duran ama bir daha bulunamayan GUID',
      body: [
        'Oracle’da GUID tipi yok. GUID bir RAW(16) kolonunda saklanıyor; o kolon kendisine verilen on altı baytı olduğu gibi tutuyor ve soru sormuyor. .NET tarafında ise bir Guid’i bayta çevirmenin iki yolu var ve ikisi birbirini tutmuyor — satırların kaybolduğu yer burası.',
        'Guid.ToByteArray() ilk üç alanı little-endian yazıyor; COM’dan miras kalmış bir uyumluluk kararı. Yani 00112233-4455-6677-8899-aabbccddeeff GUID’i 33 22 11 00 55 44 77 66 88 99 aa bb cc dd ee ff baytlarına dönüşüyor. Guid.ToString("N") ise okuduğunuzun aynısını yazıyor: 00112233445566778899aabbccddeeff. Bir satırı ToByteArray() taşıyan bir parametreyle, ötekini metin biçiminin HEXTORAW’ıyla eklerseniz aynı GUID artık iki farklı anahtar.',
        'Hiçbir aşamada hata alınmıyor. Ekleme başarılı oluyor, select boş dönüyor ve hata genellikle çok sonra, ekranla tabloyu karşılaştıran biri tarafından bulunuyor. İki geleneğin de bulunduğu bir şemayı devraldıysanız, bayt sırası çevrilmiş ve metin sırasındaki hâller burada yan yana gösteriliyor; hangi satırın hangisini kullandığını böyle ayırt edebilirsiniz.',
        'Yeni kod için çözüm bir gelenek seçip yazmak. Metin biçimini HEXTORAW ile RAW’a yazmak, SQL*Plus’ta ve bir raporda okunur kalan yol; ToByteArray() yazmak ise parametreden bedavaya gelen yol. İkisi de yanlış değil — karıştırmak yanlış.',
      ],
      faq: [
        {
          q: 'SYS_GUID() hangi sırayı üretiyor?',
          a: 'SYS_GUID() 16 bayt döndürüyor ve Oracle onları saklandıkları sırayla basıyor, dolayısıyla buradaki metin sırası satırıyla eşleşiyor. Veritabanında üretilmiş bir GUID ile Guid.NewGuid() ile üretilip ToByteArray() ile yazılmış bir GUID doğrudan karşılaştırılamaz.',
        },
        {
          q: 'Bunun yerine CHAR(36) kullansam bütün bu meseleden kurtulur muyum?',
          a: 'Belirsizliği kaldırıyor; bedeli satır başına 16 yerine 36 bayt ve daha büyük bir indeks. Küçük bir tabloda okunurluk karşılığında adil bir takas. Büyük bir tabloda ise yazılı bir gelenekle RAW(16) daha iyi cevap.',
        },
        {
          q: 'Aynı sorun SQL Server’da da var mı?',
          a: 'Akrabası var. SQL Server’ın uniqueidentifier tipi baytları bambaşka bir sırada sıralıyor, dolayısıyla .NET’te sıralı görünen bir GUID birincil anahtarı indekste sıralı değil. Bu bir kimlik sorunu değil sıralama sorunu — satırlar yine bulunuyor.',
        },
      ],
    },

    'ddl-entity': {
      heading: 'Bir Oracle tablosunu iskeletlerken zor kısım neden NUMBER',
      body: [
        'Oracle’da tek bir sayısal tip var. NUMBER hem bir boolean bayrağı, hem küçük bir tanım anahtarı, hem büyük bir anahtar, hem de bir para tutarı; hangisi olduğu tamamen tanımdaki hassasiyet ve ondalık basamağa bağlı. İskelet üreteçlerinin çoğu SQL Server’a karşı yazıldı — orada TINYINT, INT, BIGINT ve DECIMAL ayrı tipler — dolayısıyla ya her NUMBER’ı decimal’e eşliyorlar ya tahmin yürütüyorlar.',
        'İkisinin de bedeli var. Her şeyi decimal’e eşlemek her anahtarı decimal yapıyor ve bu, alan modeline ve ona dokunan her metot imzasına yayılıyor. int tahmin etmek daha kötü: NUMBER(10) on hane tutuyor, int dokuz — yani taşma testte değil gerçek veriyle geliyor. Buradaki bölüm gerçek kapasiteyi izliyor: 4 haneye kadar short, 9’a kadar int, 18’e kadar long, üstü decimal. NUMBER(1) bool oluyor çünkü bayrak kolonu odur — istemezseniz kapatabilirsiniz.',
        'DDL’in zaten cevapladığı ve üreteçlerin sık yanıldığı ikinci şey null’luk. NOT NULL yazmayan bir kolon null kabul ediyor, nokta; entity de bunu söylemeli, çünkü null’a izin veren bir kolonun üstüne non-nullable bir property koymak, bir veri sorununu sebebinden çok uzakta bir null reference’a çeviriyor. Anahtar kolonu her hâlükârda non-nullable yapılıyor, zaten Oracle da öyle zorluyor.',
        'Eşleme attribute olarak değil IEntityTypeConfiguration olarak üretiliyor. Kolon adları, uzunluklar ve zorunluluk sağlayıcıya ait ayrıntılar; onları entity’nin üstüne koymak Oracle’a özgü detayı alan modeline yayıyor — bir sonraki veritabanı taşımasını pahalı yapan tam olarak bu.',
      ],
      faq: [
        {
          q: 'Neden dotnet ef dbcontext scaffold kullanmıyoruz?',
          a: 'Kullanabildiğinizde kullanın — canlı şemayı okuyor ve ilişkileri de çıkarıyor. Bu araç, elinizde bir DDL betiği olup bağlantı olmayan durumlar için: bir değişiklik talebi, bir kod incelemesi, bir migration dosyası ya da araç doğrultmanıza izin verilmeyen bir veritabanı.',
        },
        {
          q: 'Üretilen kolon adları projeme uygun mu?',
          a: 'HasColumnName yalnızca property adı kolon adından farklıysa yazılıyor. Context’iniz zaten büyük harfe ve snake_case’e çeviren bir adlandırma sözleşmesi kullanıyorsa o satırlar gereksiz, silebilirsiniz — entity ve anahtar eşlemesi işe yarayan kısım olarak kalıyor.',
        },
        {
          q: 'Yabancı anahtarlar ve navigasyonlar?',
          a: 'Üretilmiyor. Bir REFERENCES yan tümcesi kısıtın var olduğunu söylüyor; navigasyonun ne adlandırılacağını, koleksiyon olup olmadığını ya da ilişkinin zorunlu olup olmadığını söylemiyor — ve yanlış bir navigasyonu fark etmek, eksik olanı fark etmekten zor.',
        },
      ],
    },

    'odp-call': {
      heading: 'Bir Oracle prosedürünü .NET’ten dört tuzağa düşmeden çağırmak',
      body: [
        'Oracle’da satır döndüren bir prosedür bunu SYS_REFCURSOR OUT parametresiyle yapıyor. Okunacak bir sonuç kümesi yok: ExecuteReader işe yarar bir şey döndürmüyor ve cursor, ExecuteNonQuery çalıştıktan SONRA parametreden alınmak zorunda. Tek başına bu bile SQL Server’dan gelenlerin çoğunu yakalıyor, ama dördü içinde en zararsızı bu — çünkü hemen ve açıkça patlıyor.',
        'Tehlikeli olan BindByName. Varsayılanı false, yani ODP.NET parametreleri isme değil konuma göre bağlıyor — koleksiyona ekleme sıranıza göre. İmzadan farklı sırada eklerseniz ya ORA-06550 alıyorsunuz ya da çok daha kötüsü, doğru görünen adlara yanlış değerler bağlanıyor. Bu şekilde yer değiştirmiş iki NUMBER parametresi, kusursuz çalışan ve yanlış satırları döndüren bir sorgu üretiyor.',
        'Üçüncüsü: OUT VARCHAR2 parametresine açık bir Size vermek gerekiyor, yoksa ORA-06502 “buffer too small” geliyor. IN parametrelerinde gerekmiyor — sürekli unutulmasının sebebi tam olarak bu, aynı kod şekli girişte çalışıp çıkışta patlıyor.',
        'Dördüncüsü: imza bir NUMBER’ın ne kadar büyük olduğunu söylemiyor. Üretilen çağrı OracleDbType.Decimal kullanıyor çünkü taşamıyor. Bir anahtar kolonu için Int32’ye daraltmak çoğu zaman doğru ve yapmaya değer, ama bu bir KARAR olmalı — on haneli bir anahtarı sessizce kırpan bir varsayılan değil.',
      ],
      faq: [
        {
          q: 'Ham ODP.NET yerine Dapper ya da EF Core kullanabilir miyim?',
          a: 'Tek ref cursor’lı bir prosedür için Dapper temiz hallediyor ve daha az kod. Bu iskelet, o soyutlamaların iyi kapsamadığı durumlar için: birden çok out parametresi, cursor artı skalerler, ya da imzasının açıkça eşlendiğini görmeniz gereken bir paket prosedürü.',
        },
        {
          q: 'Ref cursor neden ExecuteReader ile okunmuyor?',
          a: 'Çünkü prosedür bir sonuç kümesi döndürmüyor; bir çıkış parametresine atıyor. ExecuteNonQuery prosedürü çalıştırıyor, parametre sonrasında bir OracleRefCursor tutuyor ve onun üzerindeki GetDataReader() size okuyucuyu veriyor.',
        },
        {
          q: 'Prosedürde PL/SQL BOOLEAN parametresi var ve araç onu eşlemeyi reddediyor.',
          a: 'ODP.NET PL/SQL BOOLEAN bağlayamıyor — o bir SQL tipi değil. Olağan cevaplar imzayı NUMBER(1) yapmak ya da dönüştüren küçük bir sarmalayıcı prosedür eklemek. İkisi de atlanabilecek bir geçici çözüm değil.',
        },
      ],
    },

    'conn-string': {
      heading: 'Aynı bağlantı dizesi neden bir makinede çalışıp ötekinde çalışmıyor',
      body: [
        'Oracle bağlantı dizesindeki Data Source, hepsi aynı anahtarın değeri olarak yazılan üç ayrı şeyi kabul ediyor. Bir Easy Connect adresi olabilir — konak:1521/servis — ki bağlanmak için gereken her şeyi içeriyor. Tam bir TNS tanımlayıcısı olabilir, yani parantezli DESCRIPTION bloğu; o da her şeyi içeriyor ve ayrıca yedek adres taşıyabiliyor. Ya da düpedüz bir ad olabilir.',
        'ORA-12154 işte o çıplak addan geliyor. Ad bir adres değil; bağlantıyı kuran makinedeki tnsnames.ora dosyasında aranan bir anahtar. Yani bağlantı dizesi geliştirici dizüstünde ve uygulama sunucusunda birebir aynı, ama yalnızca biri onu çözebiliyor. Dizenin kendisinde bunu ima eden hiçbir şey yok — aracın alanları listelemekle yetinmeyip türü açıkça adlandırmasının sebebi bu.',
        'Görülmeye değer ikinci şey şifre. Dizede açık metin olarak duruyor ve bağlantı dizeleri sürekli kayıtlara, sohbet mesajlarına ve ekran görüntülerine yapıştırılıyor. Buradaki maskeli satır paylaşılması güvenli olan hâli — aynı dize, aynı yapı, sır yok.',
        'Her şey tarayıcıda çözülüyor. Bu, çoğu araçta olduğundan daha önemli: bağlantı dizesi tanımı gereği bir kimlik bilgisidir.',
      ],
      faq: [
        {
          q: 'Easy Connect mi kullanmalıyım, tanımlayıcı mı?',
          a: 'Tek konak için Easy Connect — daha kısa ve kendi kendine yeterli, yanında dağıtılacak bir şey yok. Birden fazla adrese, yedekleme ya da yük dengeleme politikasına veya varsayılan olmayan bir bağlantı zaman aşımına ihtiyaç varsa tanımlayıcı. TNS takma adı ise yalnızca dosyanın sahibi bir yönetici olduğunda ve hedefi uygulamaya dokunmadan değiştirmek istediğinde.',
        },
        {
          q: 'Havuzlamayı kapatmak hiç doğru olur mu?',
          a: 'Nadiren. Oracle’da bağlantı kurmak, kısa bir isteğin zamanının çoğunu el sıkışmada geçirmesine yetecek kadar pahalı. Bunu haklı çıkaran durumlar uzun ömürlü toplu işlemler ve havuz tükenmesi hatasını teşhis etmek — ikincisi de bir teşhis, çözüm değil.',
        },
        {
          q: 'SERVICE_NAME ile SID arasındaki fark ne?',
          a: 'SID tek bir veritabanı örneğini adlandırıyor; servis adı ise birden çok örnek tarafından sunulabilen bir servisi adlandırıyor — RAC’ı ve yedeklemeyi mümkün kılan şey bu. Yeni kod SERVICE_NAME kullanmalı. SID eski tanımlayıcılarda hâlâ görünüyor ve hâlâ çalışıyor.',
        },
      ],
    },

    'merge-sql': {
      heading: 'Oracle MERGE’de herkesin yanıldığı iki şey',
      body: [
        'MERGE, bir satırın yeniyse eklenmesi değilse güncellenmesi gerektiğinde istediğiniz ifade — tek gidiş dönüş, tek kilit, SELECT ile INSERT arasında yarış yok. Aynı zamanda yeterince uzun, dolayısıyla çoğu kişi onu en son yazdığı yerden kopyalıyor; aynı iki hatanın taşınmaya devam etmesinin sebebi bu.',
        'Birincisi kaynak. USING bir değer listesi almıyor; bir tablo alıyor. Oracle’da bu, değerleri dual üzerinden bir SELECT’e sarmak demek: USING (SELECT :id AS ID FROM dual) src. Bu olmadan ifade düpedüz ayrıştırılmıyor, yani bu hata gürültülü.',
        'İkincisi sessiz ve bilinmeye değer: ON yan tümcesinde geçen bir kolon güncellenemiyor. Oracle ORA-38104 diyor — ON yan tümcesinde başvurulan kolonlar güncellenemez. Anahtar zaten satırın bulunma biçimi, dolayısıyla onu yeniden atamak anlamsız; ama aynı kolon listesini iki yarıya birden yapıştırınca dahil etmek kolay. Bu üreteç anahtar kolonlarını UPDATE dışında bırakıyor ve bunu size söylüyor, çünkü sessizce atmak gerçek bir niyeti gizleyebilirdi.',
        'MERGE’ün vermediği bir şey var: kopyaya karşı garanti. İki oturum aynı yeni anahtarı aynı anda merge ederse ikisi de eşleşmeyi kaçırıp ikisi de ekleyebilir. Bunu asıl engelleyen şey bir benzersizlik kısıtı; MERGE pencereyi daraltıyor, kapatmıyor.',
      ],
      faq: [
        {
          q: 'MERGE mi kullanmalıyım, istisna yakalayan bir INSERT mi?',
          a: 'Bir satır kümesi için ya da güncellemenin gerçekten yapacak işi olduğu durumlarda MERGE. Tek satır için INSERT … EXCEPTION WHEN DUP_VAL_ON_INDEX kalıbı gayet uygun ve çoğu zaman daha hızlı, çünkü yaygın durumda eşleştirme adımı olmayan tek bir ifade koşuyor.',
        },
        {
          q: 'Aynı anda birden fazla satır merge edebilir miyim?',
          a: 'Evet, MERGE asıl orada hakkını veriyor. dual üzerindeki SELECT’i gerçek bir sorguyla ya da bir tablo koleksiyonuyla değiştirin; ON yan tümcesi satır satır eşleşiyor. Burada üretilen tek satırlık biçim başlangıç noktası, sınır değil.',
        },
        {
          q: 'Neden DELETE dalı yok?',
          a: 'WHEN MATCHED THEN UPDATE … DELETE WHERE var, ama yalnızca güncellemenin az önce dokunduğu satırları siliyor — bu, ayrı ve bilerek yazmaya değecek kadar sık şaşırtıyor.',
        },
      ],
    },

    jwt: {
      heading: 'Çözülmüş bir JWT size neyi söyler, neyi söylemez',
      body: [
        'JSON Web Token şifrelenmiş değildir. Header ve payload base64url metindir, yani token’ı elinde tutan herkes içindeki her claim’i okuyabilir — kullanıcı kimliği, roller, kiracı, oraya ne konduysa. Token’ı çözmek onun gerçek olup olmadığı hakkında hiçbir şey kanıtlamaz; yalnızca ne dediğini gösterir.',
        'Bir token’ı güvenilir yapan şey imzadır ve imzayı doğrulamak anahtar ister. Tarayıcınızda çalışan bir araçta sizin imzalama anahtarınız yoktur ve istememelidir de; bu yüzden bu çözücü bilerek okumada duruyor. Header’daki algoritmayı ve token’ın süresinin dolup dolmadığını gösteriyor, imzanın DOĞRULANMADIĞINI da açıkça söylüyor. Aksini ima eden bir çözücü işe yaramaz olmaktan da kötü olurdu.',
        'Her seferinde okunmaya değer iki claim var. exp, Unix saniyesi cinsinden bir son kullanma; geçerli görünen ama bir saatlik bir token, beklenmedik 401’lerin en yaygın sebebi. nbf ise "şu andan önce geçerli değil" demek ve aynı 401’i ters yönden üretiyor — genellikle bir hata değil, iki sunucu arasındaki saat kayması.',
        'Token’lar birer kimlik bilgisi olduğu için burada hiçbir şey yüklenmiyor. Bu çözücünün çevrimiçi olanların yanında var olma sebebi tam olarak bu: üretim ortamına ait bir token’ı, onu bir yere gönderen bir sayfaya yapıştırmak gerçek bir olaydır ve gerçek ekiplerin başına gelmiştir.',
      ],
      faq: [
        {
          q: 'İmzayı burada doğrulayabilir miyim?',
          a: 'Hayır ve bu bilinçli. Doğrulama, imzalama sırrını ya da açık anahtarı gerektiriyor. Bir sırrı bir web sayfasına — yerelde çalıştığına söz veren birine bile — göndermek edinilmeye değer bir alışkanlık değil, o yüzden araç bunun için bir kutu sunmuyor.',
        },
        {
          q: 'Token çözülüyor ama API reddediyor.',
          a: 'Önce exp ve nbf’yi sunucu saatine karşı kontrol edin, sonra aud ve iss claim’lerini — çoğu .NET kurulumunda varsayılan olarak doğrulanıyorlar ve aynı genel 401’i üretiyorlar. Ondan sonrası imzadır, yani token içeriği değil anahtar ya da algoritma.',
        },
        {
          q: 'JWT payload’ına hassas veri koymak güvenli mi?',
          a: 'Hayır. Token’ı elinde tutan herkes okuyabilir — saklandığı tarayıcı ve istek header’ı loglayan her şey dâhil. JWT çağıranın kim olduğunu kanıtlar; çağıranın görmemesi gereken bir şeyi taşıyacağı yer değildir.',
        },
      ],
    },

    hash: {
      heading: 'Hangi özet ne için, ve MD5 burada neden elle yazıldı',
      body: [
        'Tarayıcı WebCrypto üzerinden SHA-1, SHA-256, SHA-384 ve SHA-512 veriyor, gerisini reddediyor. MD5 API’de hiç yok — standart grubu onu bilerek dışarıda bıraktı, çünkü güvenlikle ilgili her şey için kırılmış durumda ve elde bulunması kötüye kullanımı davet ediyor. CRC32 de yok, ama ters sebeple: o zaten kriptografik bir fonksiyon değil.',
        'Yine de ikisine de ihtiyaç var. MD5 mevcut dosyaların sağlama toplamlarında, eski protokol el sıkışmalarında ve yıllar önce yazılmış veritabanı satırlarında sürekli karşınıza çıkıyor; hesaplamadan onları doğrulayamazsınız. Bu yüzden MD5 ve CRC32 burada doğrudan yazıldı ve RFC 1321 ile RFC 2202 vektörlerine karşı doğrulandı — elle yazılmış bir özete güvenmenin tek yolu bu.',
        'Aralarındaki seçim güç meselesi değil, iş meselesi. CRC32 bir aktarımdaki kazara bozulmayı yakalıyor; hızlı ve küçük, ama sahtesini üretmek çok kolay, dolayısıyla hiçbir şeyi korumuyor. Bütünlük ve imza için varsayılan SHA-256. Paylaşılan bir sır işin içindeyse kullanılacak olan HMAC — anahtar + mesajı düz bir özetle hash’lemek gerçek bir açık sınıfı ve HMAC tam olarak bundan kaçınmak için var.',
        'Bunların hiçbirinin bir parolanın yanında işi yok. Hızlı olmak, parola saklamak için yanlış özellik: bcrypt, scrypt, Argon2 ve PBKDF2 bilerek yavaş. Bir parolanın SHA-256’sı parolanın kendisinden pek iyi değil.',
      ],
      faq: [
        {
          q: 'MD5 hiç kabul edilebilir mi?',
          a: 'Rakipsiz sağlama toplamları için evet — kopuk bir bağlantıdan indirilmiş bir dosyayı doğrulamak ya da sizin seçmediğiniz mevcut bir MD5 ile eşleştirmek. İmza, parola, token ve birinin çakışmadan çıkar sağladığı hiçbir şey için asla. MD5’te çakışma üretmek bugün ucuz.',
        },
        {
          q: 'Aynı girdi neden benim aracımdakinden farklı bir özet veriyor?',
          a: 'Neredeyse her zaman kodlama ya da satır sonu. Metin burada BOM’suz UTF-8 olarak hash’leniyor; BOM’lu UTF-8 ya da CRLF satır sonlarıyla kaydedilmiş bir dosyanın baytları farklı, dolayısıyla özeti de farklı. Hash’lenen şey karakterler değil baytlar.',
        },
        {
          q: 'Tarayıcıdan bir şey çıkıyor mu?',
          a: 'Hayır. Bu araçta bunun önemi büyük, çünkü girdiler çoğu zaman anahtarlar, token’lar ve dosya içerikleri. SHA tarayıcının WebCrypto gerçeklemesinden geçiyor; MD5 ve CRC32 aynı sekmede JavaScript olarak koşuyor.',
        },
      ],
    },

    regex: {
      heading: '.NET regex motoruyla JavaScript’in sessizce ayrıldığı yerler',
      body: [
        'Bazı .NET kalıpları JavaScript’te düpedüz derlenmiyor ve bunlar kolay olanlar — hemen öğreniyorsunuz. En açık örnek dengeleme grupları: (?<open>\\()+(?<-open>\\))+(?(open)(?!)) .NET’te dengeli parantezleri eşliyor ve JavaScript’te sözdizimi hatası, çünkü JavaScript’te ne çıkarma yapısı var ne de koşullu eşleme.',
        'Tehlikeli farklar ikisinde de derlenip sonra başka davrananlar. .NET’te \\d, Arap-Hint rakamları ٤٢ dâhil her Unicode ondalık rakamını eşliyor; JavaScript’te ise u bayrağını ekleyip \\p{Nd} kullanmadıkça ASCII 0-9. \\w .NET’te Unicode harfleri kapsıyor, JavaScript’te ASCII. Ve .NET’te $ sondaki satır sonundan önce de eşleşiyor, yani bir form alanını doğrulayan kalıp, JavaScript’in reddedeceği başıboş bir satır sonuyla geçiyor.',
        'Türkçe projeleri özellikle yakalayan şey RegexOptions.IgnoreCase — o da iş parçacığının kültürünü izliyor. tr-TR altında I ile i farklı harfler, dolayısıyla büyük/küçük harf duyarsız bir kalıp beklediğinizi eşlemeyi bırakıyor. Çözüm RegexOptions.CultureInvariant ve insana dönük metin eşlemeyen her şeyde varsayılan olarak koymaya değer.',
        'Bu araç iki motoru yan yana çalıştırıyor — gerçek System.Text.RegularExpressions API üzerinden, JavaScript yerelde — ve kalıbınızdaki, ikisinin bilinen biçimde ayrıldığı yapıları listeliyor. API erişilemezken tek başına JavaScript motoruna düşüyor ve bunu söylüyor; sessiz bir tek-motor cevabı yanıltıcı olan durum olurdu.',
      ],
      faq: [
        {
          q: 'Neden yalnızca bu araç sunucuya ihtiyaç duyuyor?',
          a: 'Çünkü System.Text.RegularExpressions’ı tarayıcıda çalıştırmanın bir yolu yok. Sitedeki diğer her araç istemci tarafında; bu, cevabın gerçekten .NET gerektirdiği tek durum ve API’nin var olma sebebi de bu.',
        },
        {
          q: 'Kalıbım burada çalışıyor ama üretimde takılıyor.',
          a: 'Bu felaket geri izleme (catastrophic backtracking) ve bu sayfa ona karşı sınırlı — sunucu 250 ms’lik bir eşleşme zaman aşımı uyguluyor. Sizin uygulamanızda siz koymadıkça yok. Regex kurucusuna matchTimeout geçin ve (a+)+ gibi iç içe niceleyiciler yerine atomik yapıları tercih edin.',
        },
        {
          q: 'Adlandırılmış grup ikisinde de aynı mı yazılıyor?',
          a: 'Neredeyse. (?<ad>…) ikisinde de çalışıyor. .NET’in alternatif yazımı (?\'ad\'…) JavaScript’te yok; ayrıca .NET iki grubun aynı adı paylaşmasına izin veriyor, JavaScript bunu doğrudan reddediyor.',
        },
      ],
    },

    cron: {
      heading: 'Neredeyse her aracın yanlış bildiği cron kuralı',
      body: [
        'Klasik Unix cron’da ayın günü ile haftanın günü VE ile değil VEYA ile birleşiyor — ama yalnızca ikisi de kısıtlıysa. 0 0 13 * 5 "ayın 13’üne denk gelen cuma" demek değil; "ayın 13’ü, ayrıca her cuma" demek. Alanlardan biri * ise öteki basitçe geçerli oluyor. Bu belgelenmiş bir davranış ve her seferinde insanları şaşırtıyor — birkaç çevrimiçi cron açıklayıcısının yazarları dâhil.',
        'Bir .NET zamanlayıcısının genellikle çalıştırdığı Quartz, aynı belirsizliği başka türlü çözüyor: durumu yasaklıyor. İki gün alanından tam olarak biri ? olmak zorunda, dolayısıyla ifade en baştan belirsiz olamıyor. Bu ayrıca bir Quartz ifadesinin beş değil altı ya da yedi alanlı olması demek — Quartz’a yapıştırılan bir Unix ifadesi yalnızca yanlış değil, hiç ayrıştırılmıyor.',
        'Öteki sessiz fark saniyelerin yeri. Quartz saniyeyi başa koyuyor, yani 0 0 12 * * ? öğlen demek, "on ikinci saatin her dakikası" değil. Bir Quartz ifadesini Unix gibi okumak her alanı bir konum kaydırıyor ve makul görünen bir zamanlama üretiyor.',
        'Bir zamanlamayı yalnızca söz diziminden akıl yürüterek anlamak zor olduğu için bu araç sonraki çalışmaları gösteriyor. Bir ifadenin kastedilenden başka bir şey anlattığını öğrenmenin en hızlı yolu genellikle bu — yukarıdaki yanlış okumaların hepsi, tarihleri görene kadar doğru görünüyor.',
      ],
      faq: [
        {
          q: '"Ayın 13’üne denk gelen cuma"yı nasıl yazarım?',
          a: 'Tek bir klasik cron ifadesiyle yazamazsınız, VEYA kuralı yüzünden. Olağan cevap her 13’üne zamanlayıp haftanın gününü işin kendisinde kontrol etmek. Quartz bunu doğru lehçede 0 0 0 13 * FRI ile doğrudan ifade edebiliyor, çünkü onun gün alanları birleşmiyor, birbirini dışlıyor.',
        },
        {
          q: 'L ve # ne demek?',
          a: 'Quartz eklentileri. Ayın günü alanındaki L ayın son günü, haftanın günü alanındaki 6#3 ise üçüncü cuma. İkisi de klasik cron’da yok, dolayısıyla bunları kullanan bir ifade Unix crontab’ında çalışmaz.',
        },
        {
          q: 'Gösterilen sonraki çalışmalar benim saat dilimimde mi?',
          a: 'Tarayıcının saat diliminde hesaplanıyor. Zamanlayıcı genellikle sunucunun saat diliminde koşuyor ve Quartz’a açıkça bir dilim verilebiliyor — ikisi farklıysa buradaki saatler o kadar kayar. Yaz saati geçişleri, bu farkın en çok zarar verdiği yer.',
        },
      ],
    },

    epoch: {
      heading: 'Unix saniyesi, milisaniye ve .NET tick’i',
      body: [
        'Aynı kod tabanında üç sayaç karşınıza çıkıyor ve hiçbiri birbirinin yerine geçmiyor. Unix zamanı 1970-01-01 UTC’den beri saniye sayıyor. JavaScript aynı noktadan milisaniye sayıyor. .NET DateTime.Ticks ise 0001-01-01’den beri 100 nanosaniyelik aralıkları sayıyor — hem birim hem başlangıç farklı; bir tick değerini Unix çeviriciye yapıştırdığınızda uzak gelecekte bir tarih dönmesinin sebebi bu.',
        'Onları gözle ayırmak göründüğünden kolay: bugün bir Unix saniyesi 10 hane, milisaniye 13, tick 18. Aradaki boşluklar uzunluğu güvenilir bir tahmin yapacak kadar geniş; buradaki otomatik algılama da bunu kullanıyor — tahmin yanılırsa elle değiştirebiliyorsunuz.',
        'Tick’lerin doğru çıkması için bir gerçekleme ayrıntısı gerekiyor. Bir tick değeri 6 × 10^17 civarında, yani Number.MAX_SAFE_INTEGER’dan büyük; dolayısıyla JavaScript sayısından geçen her dönüşüm sessizce hassasiyet kaybediyor. Buradaki aritmetik tam bu yüzden BigInt ile yapılıyor — yapmayan bir çevirici birkaç yüz nanosaniye şaşırır ve size hiç söylemez.',
        'Son tuzak aritmetik bile değil. Unix zamanı da tick de birer AN, ama bir .NET DateTime ayrıca bir Kind taşıyor — Utc, Local ya da Unspecified — ve bir değer veritabanından geldiğinde varsayılan Unspecified. Aynı basılan iki an, Kind uygulandığında saatlerce ayrı düşebiliyor; offset önemliyse DateTimeOffset saklayın.',
      ],
      faq: [
        {
          q: 'Tick değerim burada başka, C#’ta başka bir tarih veriyor.',
          a: 'Neredeyse her zaman Kind. DateTime.Ticks bir saat dilimi kodlamıyor, dolayısıyla onu bir ana çevirmek bir dilim varsaymak demek. Bu sayfa tick’leri UTC sayıyor. Değer UtcNow yerine DateTime.Now’dan geldiyse, söylemeden kaydedilmiş yerel saattir.',
        },
        {
          q: '.NET’te Unix zaman damgasını nasıl alırım?',
          a: 'DateTimeOffset.UtcNow.ToUnixTimeSeconds() ve ToUnixTimeMilliseconds(); geri dönmek için FromUnixTimeSeconds. 1970 epoch’unu elle çıkarmak eski kodda hâlâ görünüyor ve bir saatlik kaymaların kaynağı orası, çünkü genellikle yerel bir DateTime ile yapılıyor.',
        },
        {
          q: '1970 öncesi saniyeler?',
          a: 'Negatifler ve bu iyi tanımlı. Negatif bir sayı girin, normal biçimde çözülür. Bazı sistemler onları işaretsiz saklıyor; 1969 tarihinin 2106 yılına dönüşmesinin sebebi o.',
        },
      ],
    },

    uuid: {
      heading: 'v4 GUID neden kötü bir birincil anahtar, v7 neden değil',
      body: [
        'Bir v4 UUID 122 rastgele bit. Birincil anahtar olarak bu tam da yanlış şekil: her ekleme indeksin rastgele bir noktasına düşüyor, dolayısıyla ihtiyaç duyduğu sayfa nadiren zaten bellekte olan sayfa oluyor ve indeks sürekli bölünüyor. Sürekli ekleme alan bir tabloda bu, yazma büyümesi ve verinin haklı çıkardığından çok daha büyük bir B-ağacı olarak görünüyor.',
        'RFC 9562 ile standartlaşan UUID v7, işe yarayan kısmı vermeden sıralamayı düzeltiyor. İlk 48 bit bir Unix milisaniye damgası, yani farklı milisaniyelerde üretilen değerler oluşturulma sıralarında sıralanıyor. Eklemeler indeksin sonuna düşüyor — bir sequence’ın koyacağı yere — kalan bitler ise değeri açık bir tanımlayıcı olacak kadar tahmin edilemez tutuyor.',
        'Çekince tek bir milisaniyenin içinde: orada sıralama rastgele kuyruğa kalıyor. RFC 9562 bunu bile monotonik yapan isteğe bağlı bir sayaç tanımlıyor; burada gerçeklenmedi, çünkü sayfa bölünmesi milisaniye ölçeğinde yaşanıyor ve pratik kazanç küçük. Bir sıralama anahtarı için katı monotonluk gerekiyorsa aradığınız şey sequence, UUID değil.',
        'İki sürümün de vermediği şey yer tasarrufu. Satır başına on altı bayt, artı anahtarı taşıyan her indeks — dört baytlık bir int’in yanında gerçek bir maliyet. Bunu ödemenin sebebi, değerin istemci tarafından üretilebilmesi, koordinasyon olmadan sistemler arası benzersiz olması ve satır sayısını sızdırmaması; bunların hiçbirini bir sequence sunmuyor.',
      ],
      faq: [
        {
          q: 'v7’yi bir URL’de göstermek güvenli mi?',
          a: 'Tanımlayıcı tahmin edilebilir değil, ama zaman damgası okunabilir — değeri elinde tutan herkes satırın milisaniye hassasiyetinde ne zaman oluşturulduğunu biliyor. Bu genellikle sorun değil, bazen oluyor; örneğin oluşturulma zamanının kendisinin hassas olduğu her şeyde.',
        },
        {
          q: 'Mevcut v4 anahtarlarını v7’ye çevirmeli miyim?',
          a: 'Sırf çevirmiş olmak için hayır. Kazanç ekleme yoğun tablolarda; ağırlıkla okunan bir tabloda indeks yerelliği zaten önemli olmadı. İkisini aynı kolonda karıştırmak zararsız — ikisi de geçerli UUID ve sürüm değerin içinde.',
        },
        {
          q: 'Oracle’da nasıl saklanmalı?',
          a: 'RAW(16) — ve bayt sırası sorusu tam orada başlıyor. .NET Guid.ToByteArray() ilk üç alanı yeniden sıralıyor, dolayısıyla o şekilde yazılan bir değer, aynı GUID’in HEXTORAW ile metin olarak yazılmış hâliyle eşleşmiyor. Bir gelenek seçin ve yazın.',
        },
      ],
    },

    'sql-to-linq': {
      heading: 'SQL’den LINQ’e çeviri neden yalnızca bir başlangıç noktası olabilir',
      body: [
        'SQL ile LINQ arasındaki eşleme tek yönlü belirsiz. SQL’deki bir LEFT JOIN, C# tarafının nullable olup olmayacağı hakkında hiçbir şey söylemiyor; bir GROUP BY, projeksiyonun anonim tip mi record mu istediğini söylemiyor; bir tablo adı hangi DbSet’e karşılık geldiğini söylemiyor. Bu cevaplar sorgu metninde değil modelde duruyor, dolayısıyla bir çevirici onları tahmin etmek zorunda — ve sessizce tahmin eden bir çevirici, derlenen ve yanlış olan kod üretiyor.',
        'Bu da tahmin ediyor, ama asla silmiyor. Çeviremediği her şeyi atmak yerine çıktıda bir TODO satırı olarak bırakıyor; böylece sessiz bir yanlış cevap, görünür bir eksik cevaba dönüşüyor. Tasarım duruşunun tamamı bu: bir kod üreteci için açıkça bitmemiş olmak bir özellik, sessizce yanlış olmak ise bir güne mal olan arıza biçimi.',
        'Hallettiği mekanik kısımlar sıkıcı olanlar. Takma adlar geçerli range değişkenlerine çevriliyor, çünkü SQL büyük/küçük harfe duyarsız C# değil — FROM KITAP H yazıp gövdede h.AD üreten bir sorgu düpedüz derlenmez. NVL, ISNULL ve iki argümanlı COALESCE null birleştirme operatörüne dönüyor. IN listeleri Contains’e, BETWEEN iki karşılaştırmaya, LIKE ise joker işaretlerinin yerine göre StartsWith, EndsWith ya da Contains’e.',
        'Tarayıcıda çalışıyor. Özgün plan sunucuda gerçek bir ayrıştırıcı kullanmaktı, ama olgun tek seçenek T-SQL okuyan ve Oracle okumayan ScriptDom’du — yani sunucu, bu sitenin asıl ilgilendiği sorgular için doğruluk katmadan bir bağımlılık eklemiş olacaktı.',
      ],
      faq: [
        {
          q: 'Çıktı neden olduğu gibi derlenmiyor?',
          a: 'Genellikle varlık ve property adları tahmin olduğu için. Tablo PascalCase bir DbSet adına dönüşüyor, kolonlar SQL yazımını koruyor; bu yalnızca modeliniz o sözleşmeye uyuyorsa doğru. Adları değiştirin, geri kalan şekil ayakta kalır.',
        },
        {
          q: 'Query sözdizimi mi, metot sözdizimi mi?',
          a: 'Join ve gruplamalar query sözdiziminde daha iyi okunuyor; art arda filtre ve projeksiyon zinciri metot olarak. İkisi de üretiliyor ve EF Core ikisini de aynı şekilde çeviriyor — seçim sorgu planıyla değil, kodu okuyan kişiyle ilgili.',
        },
        {
          q: 'Sorgumun bir kısmını atladı.',
          a: 'TODO satırına bakın — yeri orası. Pencere fonksiyonlarının, hiyerarşik sorguların ve PL/SQL’e özgü yapıların LINQ karşılığı yok; onlar için doğru cevap çoğu zaman SQL’i olduğu gibi tutup FromSqlInterpolated ile çağırmak, hiç çevirmemek.',
        },
      ],
    },

    'json-to-csharp': {
      heading: 'Bir JSON örneğinden yanlış tahmin etmeden tip çıkarmak',
      body: [
        'Tek bir JSON nesnesi, ondan tip yazmaya yetecek bilgi değil ve çoğu üreteç aksini varsayıyor. İlginç durum dizi: ilk öğede bir alan varsa ve ikincide yoksa o alan isteğe bağlıdır — ama yalnızca ilk öğeyi okuyan bir üreteç zorunlu bir property üretiyor ve sonraki her deserileştirme, imkânsız ilan ettiği bir null’da patlıyor. Burada tip kararı verilmeden önce her öğe birleştiriliyor; kullanılabilir bir tiple makul görünen bir tip arasındaki fark bu.',
        'Null’luk aynı birleştirmeden çıkıyor. Her öğede null olmayan bir değerle bulunan alan non-nullable oluyor; herhangi bir yerde eksik ya da null olan alan nullable. Bu bir varsayılan değil, kanıttan çıkarım — ve yalnızca örnek kadar iyi: iki öğelik bir örnek, ayda bir null olan alanı size söyleyemez.',
        'Dikkat edilecek öteki yer sayılar. JSON’da tek bir sayısal tip var, dolayısıyla üretecin seçmesi gerekiyor. Ondalık nokta taşıyan bir değer double değil decimal oluyor, çünkü yaygın durum para ve double onun için yanlış tip. Tam sayı int’e sığmadığında long oluyor; bu, kulağa geldiğinden daha sık önem taşıyor — milisaniye cinsinden zaman damgaları sığmıyor.',
        'Aynı çıkarım tek örnekten C# record, class ya da TypeScript arayüzü üretiyor. Bir DTO için varsayılan record: değer eşitliği ve değişmezlik, hattan deserileştirilip sonrasında değiştirilmeyen bir şey için istediğiniz şeyler.',
      ],
      faq: [
        {
          q: 'Record mı class mı?',
          a: 'Okuyup dolaştırdığınız bir yük için record — değer eşitliği ve init-only property’ler onu doğru anlatıyor. Bir şey ona bağlanıp değiştiriyorsa class; buna bazı eski serileştiriciler ve parametresiz kurucu bekleyen çoğu model binding senaryosu dâhil.',
        },
        {
          q: 'Neden double değil decimal?',
          a: 'Çünkü JSON’daki ondalık bir kesir genellikle para ya da oran ve ikili kayan nokta 0.1’i tam gösteremiyor. Ölçümler ve bilimsel değerler için doğru seçim double; durumunuz oysa değiştirin. Bunu yanlış yapmak, biri bir kolonu toplayana kadar sessiz kalıyor.',
        },
        {
          q: 'Geçerli C# tanımlayıcısı olmayan property adları?',
          a: 'PascalCase’e çevriliyor ve özgün adı taşıyan bir JsonPropertyName attribute’u ekleniyor; hem yasal bir tanımlayıcıyı hem doğru hat biçimini korumanın tek yolu bu. Rakamla başlayan ya da ayrılmış sözcük olan bir ad da aynı şekilde ele alınıyor.',
        },
      ],
    },
  },

  errorRouter: {
    title: 'Bir hata, sorgu ya da bozuk metin yapıştırın',
    placeholder: 'ORA-00911, CS0854, TÃ¼rkÃ§e, bir SELECT, bir JWT…',
    noMatch: 'Tanınan bir şey yok — yukarıdaki aramayı deneyin.',

    reasons: {
      invalidCharacter: 'sondaki noktalı virgül ya da görünmez karakter',
      identifierTooLong: 'üretilen ad 30 karakter sınırını aşıyor',
      inListLimit: '1000 ifadeyi geçen IN listesi',
      notGroupBy: 'GROUP BY’da olmayan bir select kolonu',
      groupFunction: 'HAVING yerine WHERE içinde agregat',
      missingKeyword: 'Oracle’ın kabul etmediği söz dizimi',
      invalidIdentifier: 'ad, tırnak ya da takma ad sorunu',
      invalidNumber: 'dönüşmeyen bir değer',
      bufferTooSmall: 'boyutu verilmemiş OUT parametresi',
      stringTooLong: '4000 baytı geçen LISTAGG',
      expressionTree: 'ifade ağacına giremeyen bir çağrı',
      mojibake: 'yanlış kodlamayla okunmuş metin',
      bindPlaceholders: 'bağlama yer tutuculu, loglanmış sorgu',
      delphiSource: '.pas dosyasından gelen string ifadesi',
      jwtToken: 'bir JSON Web Token',
      sqlText: 'bir sorgu — çalışmasını engelleyen ne varsa bulur',
    },
  },

  share: {
    label: 'Bağlantı',
    copied: 'Kopyalandı',
    tooLong: 'Bağlantıya sığmayacak kadar uzun — çıktıyı kopyalayın.',
  },

  rules: {
    title: 'Kural kataloğu',
    description: (count: number) =>
      `Buradaki denetleyicilerin uyguladığı ${count} kuralın tamamı — her biri, tetikleyen girdi ve ne yaptığıyla birlikte. Bunlar derlenen, incelemeden geçen ve sonradan patlayan hatalar.`,
    sample: 'Girdi',
    fixed: 'Düzeltildikten sonra',
    noFix: 'Otomatik düzeltmesi yok',
    manualHint: 'Bu kural bildiriyor, yeniden yazmıyor — düzeltme ifadenin anlamını değiştirdiği için bir yer değiştirme değil, bir karar.',
    openTool: 'aracı aç',
    tryIt: (tool: string) => `Kendi girdinizle ${tool} içinde deneyin`,
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
    related: 'İlgili araçlar',
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

  sqlFix: {
    input: 'Çalışmayan sorgu',
    output: 'Seçili düzeltmeler uygulanmış hâli',
    placeholder: 'Bir sorgu yapıştırın — hiçbir şey yüklenmez…',
    clean: 'bulgu yok',
    count: (total: number, fixable: number) => `${total} bulgu · ${fixable} düzeltilebilir`,
    findingsTitle: 'Bulgular',
    apply: 'uygula',
    manual: 'elle',
    applyToInput: 'Girdiye taşı',
    reset: 'Örnek',

    samples: {
      tsql: 'T-SQL → Oracle',
      delphi: 'Delphi string',
      paste: 'Yapıştırma hasarı',
    },

    rules: {
      hostStringLiteral: {
        title: 'Bu SQL değil, kaynak kodu',
        hint: 'Girdinin tamamı bir .pas ya da .cs dosyasından kopyalanmış, tırnaklı ve birleştirilmiş bir string ifadesi. Önce bu çözülmeli — çözülmeden öteki denetimler tek bir uzun metin sabiti okumuş olur.',
      },
      invisibleChar: {
        title: 'Görünmez karakter',
        hint: 'Kırılmaz boşluk ya da sıfır genişlikli bir karakter; neredeyse her zaman Word, Teams veya PDF’ten geliyor. Oracle ORA-00911 diyor, sorgu ekranda kusursuz duruyor.',
      },
      smartQuote: {
        title: 'Kıvrık tırnak',
        hint: 'Kelime işlemci düz tırnağı tipografik olanla değiştirmiş. SQL yalnızca düz olanı tanıyor.',
      },
      pastePrefix: {
        title: 'Satır başında yapıştırma kiri',
        hint: 'Kopyalarken SQL*Plus istemi, satır numarası, e-posta alıntı işareti ya da markdown çiti de gelmiş.',
      },
      unterminatedString: {
        title: 'Kapanmamış tırnak',
        hint: 'Bir metin sabiti hiç kapanmıyor, dolayısıyla sonrasındaki her şey metin olarak okunuyor. Kapanışın nereye geleceği tahmin edilemez.',
      },
      unterminatedIdentifier: {
        title: 'Kapanmamış çift tırnak',
        hint: 'Tırnaklı bir tanımlayıcı kapanmamış. Oracle’da çift tırnak metin açmaz, kolon adlandırır.',
      },
      unterminatedComment: {
        title: 'Kapanmamış blok yorum',
        hint: 'Açılan /* hiç kapanmamış, yani sorgunun geri kalanı yorum içinde kalıyor.',
      },
      unclosedParen: {
        title: 'Kapanmamış parantez',
        hint: 'Bu parantez hiç kapanmıyor. Düzeltme önerilmiyor, çünkü kapanışın nereye konduğu sorgunun anlamını değiştirir.',
      },
      extraParen: {
        title: 'Fazladan kapanış parantezi',
        hint: 'Buna karşılık gelen bir açılış yok, dolayısıyla silmek güvenli.',
      },
      trailingSemicolon: {
        title: 'Sondaki noktalı virgül',
        hint: 'SQL*Plus ve SQL Developer’da sorun değil; ama ODP.NET ve JDBC ifadeyi olduğu gibi gönderiyor ve Oracle ORA-00911 diyor.',
      },
      sqlPlusSlash: {
        title: 'SQL*Plus çalıştırma işareti',
        hint: 'Yalnız duran bölü çizgisi SQL*Plus’a tamponu çalıştır demek. İfadenin parçası değil.',
      },
      extraComma: {
        title: 'Ardında hiçbir şey olmayan virgül',
        hint: 'Genelde bir kolon silindiğinde geriye kalan artık. Oracle ORA-00936 “eksik ifade” diyor.',
      },
      gluedKeyword: {
        title: 'Önündeki kelimeye yapışmış anahtar kelime',
        hint: 'Sorguyu string birleştirerek kurmanın klasik sonucu: ekteki boşluk kaybolmuş, tablo adıyla yan tümce tek kelime olmuş.',
      },
      doubleQuotedString: {
        title: 'Değerin etrafında çift tırnak',
        hint: 'Oracle’da çift tırnak tanımlayıcı adlandırır, yani bu bir kolon olarak okunuyor ve ORA-00904 alıyorsunuz. Metin sabitleri tek tırnak ister.',
      },
      tableAliasAs: {
        title: 'Tablo takma adından önce AS',
        hint: 'SQL Server izin veriyor, Oracle vermiyor — ORA-00933. Kolon takma adının önünde AS hâlâ doğru.',
      },
      bracketIdentifier: {
        title: 'Köşeli parantezli tanımlayıcı',
        hint: 'Köşeli parantez T-SQL’e ait. Oracle çıplak adı ister; ad boşluk içeriyorsa çift tırnak gerekir ve o zaman büyük/küçük harf de bağlayıcı olur.',
      },
      atParameter: {
        title: '@ ile yazılmış bağlama değişkeni',
        hint: 'T-SQL parametreleri @ ile, Oracle iki nokta ile işaretler. Veri bağlantısına (tablo@link) dokunulmuyor.',
      },
      tsqlFunction: {
        title: 'Doğrudan karşılığı olan T-SQL fonksiyonu',
        hint: 'Argümanlar aynı şeyi anlattığı için yalnızca adı değiştirmek yeterli.',
      },
      tsqlNoEquivalent: {
        title: 'Doğrudan karşılığı olmayan T-SQL fonksiyonu',
        hint: 'Otomatik düzeltilmiyor: argüman sırası ya da yapı değişiyor. Sessizce çevirmek, çalışan ama yanlış sonuç veren bir sorgu bırakırdı.',
      },
      plusConcat: {
        title: 'Metin + ile birleştirilmiş',
        hint: 'Oracle metni || ile birleştirir. + kullanıldığında bir taraf metin olduğu için Oracle ötekini sayı okumaya çalışır — ORA-01722.',
      },
      topClause: {
        title: 'SELECT TOP',
        hint: 'Yalnızca T-SQL’de var. Her Oracle sürümünde çalışan karşılığı, sıralanmış sorgunun etrafına ROWNUM sarmalayıcısı koymak.',
      },
      offsetFetch: {
        title: 'OFFSET / FETCH sayfalama',
        hint: 'Oracle bunu 12c’den itibaren anlıyor. 11g’de iç içe ROWNUM sayfalamasına dönmesi gerekiyor — önce üst sınır uygulanır, sonra kayma.',
      },
      groupByScope: {
        title: 'GROUP BY kapsamında değil',
        hint: 'Select listesindeki agregat olmayan her ifade GROUP BY’da da bulunmak zorunda — ORA-00979. Buradaki karşılaştırma metin üzerinden ve takma adı ayıklayarak yapılıyor, yani yeniden yazılmış bir ifadeyi kaçırabilir; kolonun yanlış olduğunu asla iddia etmiyor, yalnızca listede olmadığını söylüyor.',
      },
      aggregateInWhere: {
        title: 'WHERE içinde agregat',
        hint: 'WHERE satırları gruplamadan ÖNCE eliyor, dolayısıyla grup fonksiyonunun üzerinde çalışacağı bir şey yok — ORA-00934. Koşulun yeri HAVING. Otomatik taşınmıyor: çevresindeki AND / OR birleşimini değiştirir.',
      },
      joinWithoutOn: {
        title: 'ON koşulu olmayan JOIN',
        hint: 'ORA-00905. Meşru biçimde koşulsuz olan ikisi CROSS JOIN ve NATURAL JOIN; onlar bildirilmiyor.',
      },
      unknownAlias: {
        title: 'Önek FROM ya da JOIN’de tanımlı değil',
        hint: 'Bu nitelendirici sorgudaki hiçbir tablo adına ya da takma ada karşılık gelmiyor — genelde yarım kalmış bir yeniden adlandırma. Oracle ORA-00904 diyor ve eksik takma adı değil, kolonu adlandırıyor.',
      },
      mixedJoins: {
        title: 'Virgüllü join ile ANSI join karışmış',
        hint: 'İkisi aynı sorguda geçerli, ama join koşullarının yarısı WHERE’e dağılıyor ve eksik kalan biri artık eksik görünmüyor — sonuç, hata vermeyen bir kartezyen çarpım.',
      },
      twelveCSyntax: {
        title: '11g’den sonra gelen söz dizimi',
        hint: '11g’de yok ve düzeltmesi ad değişikliği değil: her biri yapısal bir yeniden yazım istiyor. APPLY ve LATERAL alt sorguya ya da join’e, identity kolon sequence + trigger’a dönüşüyor.',
      },
      listaggOverflow: {
        title: 'Taşma yönetimi olmayan LISTAGG',
        hint: 'Birleştirilen sonuç 4000 baytla sınırlı ve üstünde ORA-01489 veriyor — bu da ancak veri büyüyünce, yani genelde üretimde oluyor. ON OVERFLOW’un kendisi 12.2 istiyor; 11g’de çözüm satır sayısını sınırlamak ya da CLOB’a geçmek.',
      },
    },
  },

  linq11g: {
    input: 'C# — engine metodu ya da sorgu',
    output: 'Güvenli düzeltmeler uygulanmış hâli',
    placeholder: 'Bir LINQ sorgusu ya da engine metodu yapıştırın…',
    clean: 'bulgu yok',
    count: (total: number, fixable: number) => `${total} bulgu · ${fixable} düzeltilebilir`,
    findingsTitle: 'Bulgular',
    apply: 'uygula',
    manual: 'elle',
    applyToInput: 'Girdiye taşı',
    sample: 'Örnek',

    rules: {
      anyAsync: {
        title: 'AnyAsync() 11g’de çalışmıyor',
        hint: 'Yerine FirstOrDefaultAsync(…) != null kullanın. Düzeltme güvenli: await, !=’den önce bağlandığı için ifade hem if içinde hem atamada bool kalıyor.',
      },
      anyInSelect: {
        title: 'Select projeksiyonunun içinde Any(…)',
        hint: 'Any yalnızca bir Where predicate’i içinde EXISTS’e çevriliyor. Projeksiyonda 11g patlıyor. Alt sorguyu local’e alıp Any’yi Where’e taşıyın.',
      },
      booleanInSelect: {
        title: 'Projeksiyonda bool üretmek',
        hint: 'Oracle’da TRUE / FALSE literali yok; sonuç ORA-00904: "FALSE": geçersiz belirleyici. Ham değeri seçip bool’u bellekte türetin.',
      },
      queryInLambda: {
        title: 'Lambda içinde Query() çağrısı',
        hint: 'CS0854 — ifade ağacı, isteğe bağlı argüman taşıyan bir çağrı içeremez. Alt sorguyu önce local’e alın, lambda içinde onu kullanın.',
      },
      skipTake: {
        title: 'Skip / Take',
        hint: 'EF Core bunları OFFSET … FETCH’e çeviriyor; o da 12c ile geldi. 11g’de sayfalama iç içe ROWNUM sarmalayıcısıyla elle yazılmak zorunda.',
      },
      executeUpdate: {
        title: 'ExecuteUpdate / ExecuteDelete',
        hint: 'Değişiklik takibi olmayan küme temelli ifade. Kullandığınız Oracle sağlayıcısının desteklediğini ve SaveChanges’i atlamanın çevredeki mantığı devre dışı bırakmadığını doğrulayın.',
      },
      containsList: {
        title: 'Koleksiyon Contains’i IN listesine dönüyor',
        hint: 'Oracle IN listesinde 1000 ifadeyi geçince ORA-01795 veriyor; ayrıca her farklı liste uzunluğu yeni bir sorgu üretip hard parse’a sokuyor. Listeyi parçalayın.',
      },
      rawSqlInterpolation: {
        title: 'Raw metoduna enterpolasyonlu string verilmiş',
        hint: 'FromSqlRaw enterpolasyonun değerini SQL’e olduğu gibi yapıştırıyor — bu enjeksiyon. FromSqlInterpolated aynı söz dizimini alıyor ve her deliği bağlama değişkenine çeviriyor.',
      },
      dateOnly: {
        title: 'DateOnly / TimeOnly',
        hint: 'Oracle’da karşılık gelen kolon tipi yok ve sağlayıcı desteği tutarsız. Saat kısmı yok sayılan DateTime daha güvenli eşleme.',
      },
    },
  },

  pasSql: {
    input: 'Delphi .pas kaynağı',
    placeholder: 'Bir birim ya da tek bir event handler yapıştırın…',
    sample: 'Örnek',
    empty: 'Henüz SQL bulunamadı.',
    count: (total) => `${total} ifade`,
    binds: 'bağlama',
    interpolations: 'metne gömülen:',
  },

  oracleIdentity: {
    table: 'Tablo adı',
    column: 'anahtar kolon',
    output: 'Betik',
    placeholder: 'siparis',
    versionAria: 'Oracle sürümü',
    startWith: 'başlangıç',
    allowExplicit: 'elle değer verilebilsin',

    warnings: {
      nameTooLong: 'Tanımlayıcı sınırını aşıyor. Betik ORA-00972 ile yazarken değil ÇALIŞIRKEN patlıyor — üstelik sınırı aşan ad sizin tablonuz değil, üretilen ad.',
      invalidIdentifier: 'Geçerli bir tırnaksız tanımlayıcı değil. Oracle adları harfle başlar; harf, rakam, _, $ ve # ile sürer. Gerisi çift tırnak ister ve o zaman büyük/küçük harf kalıcı olarak bağlayıcı olur.',
      sequenceGaps: 'Sequence boşluk bırakır. CACHE 20, örnek yeniden başladığında kullanılmayan numaraları kaybeder; geri alınan bir insert de numarasını iade etmez. Anahtarı sayaç değil kimlik sayın.',
      identityPreferred: '12c’den itibaren tetikleyiciye gerek yok: identity kolon aynı işi yapıyor, daha hızlı, ve ON NULL sayesinde elle değer vermek yine mümkün.',
    },
  },

  turkishCulture: {
    input: 'C# kaynağı',
    output: 'Niyet açıkça yazılmış hâli',
    placeholder: 'Bir metot ya da sınıf yapıştırın…',
    clean: 'bulgu yok',
    count: (total: number, fixable: number) => `${total} bulgu · ${fixable} düzeltilebilir`,
    findingsTitle: 'Bulgular',
    apply: 'uygula',
    manual: 'elle',
    applyToInput: 'Girdiye taşı',
    sample: 'Örnek',

    rules: {
      toUpperLower: {
        title: 'ToUpper / ToLower mevcut kültürü izler',
        hint: 'tr-TR altında i’nin büyüğü İ, I’nın küçüğü ı. Yani "file".ToUpper() FİLE veriyor ve "FILE" ile karşılaştırma sessizce başarısız oluyor. Makinenin okuduğu her şeyde Invariant, yalnızca insanın okuduğu metinde kültürlü olanı kullanın.',
      },
      startsEndsWith: {
        title: 'StartsWith / EndsWith varsayılan olarak kültüre duyarlı',
        hint: 'Çoğu kişi bunların bayt bayt karşılaştırdığını sanıyor; sanmıyor. Varsayılan aşırı yükleme mevcut kültürü kullanıyor, üstelik ölçülebilir biçimde daha yavaş. CA1310 aynı şeyi işaretliyor.',
      },
      indexOfString: {
        title: 'IndexOf(string) kültüre duyarlı',
        hint: 'Karakter alan aşırı yükleme ordinal, dize alan değil — aynı metot adı, verdiğinize göre başka davranıyor. CA1307.',
      },
      stringCompare: {
        title: 'string.Compare kültüre göre sıralar',
        hint: 'Otomatik düzeltilmiyor: Ordinal mi OrdinalIgnoreCase mi istediğiniz sizin kararınız ve yanlış seçim karşılaştırmayı hata vermeden tersine çeviriyor.',
      },
      numberParse: {
        title: 'Sağlayıcısız Parse',
        hint: 'tr-TR’de ondalık ayracı virgül, yani "3.14" ya hata veriyor ya 314 okunuyor. Dosyadan, API’den ya da veritabanından gelen her şey InvariantCulture ile ayrıştırılmalı.',
      },
      tryParse: {
        title: 'Sağlayıcısız TryParse',
        hint: 'Parse ile aynı sorun ama otomatik düzeltmesi yok: kültürlü aşırı yükleme NumberStyles da istiyor ve out argümanını sona itiyor, yani sona argüman eklemek derlenmezdi.',
      },
      dateParse: {
        title: 'Sağlayıcısız DateTime.Parse',
        hint: 'Gün ve ay kültürden kültüre yer değiştiriyor; 01/02/2026 en-US’te başka, tr-TR’de başka bir tarih. Makine okunur bir dizeyi InvariantCulture ile — daha iyisi, beklediğiniz biçimle ParseExact ile — ayrıştırın.',
      },
      formatString: {
        title: 'Biçim dizesi verilmiş ama sağlayıcı verilmemiş ToString',
        hint: '.NET biçim dizesinde / ve : karakter değil, kültür ayracının yer tutucusu. tr-TR altında "dd/MM/yyyy" nokta basıyor.',
      },
      stringFormat: {
        title: 'Sağlayıcısız string.Format',
        hint: 'Şablonun içindeki sayı ve tarihler mevcut kültürü alıyor. Sağlayıcı sona değil BAŞA geliyor — düzeltmenin eklemek yerine araya girmesinin sebebi bu.',
      },
      regexIgnoreCase: {
        title: 'RegexOptions.IgnoreCase sunucunun kültürünü izler',
        hint: 'tr-TR altında I ile i farklı harfler, dolayısıyla büyük/küçük harf duyarsız kalıp beklediğinizi eşlemeyi bırakıyor. Kültür davranışını bilerek istemiyorsanız CultureInvariant ekleyin.',
      },
    },
  },

  guidRaw: {
    inputGuid: 'GUID',
    inputRaw: 'RAW(16) hex — .NET bayt sırası',
    output: 'Tüm gösterimler',
    placeholder: '00112233-4455-6677-8899-aabbccddeeff',
    directionAria: 'Yön',
    fromGuid: 'GUID’den',
    fromRaw: 'RAW’dan',
    labelGuid: 'GUID',
    labelSameOrder: 'RAW, metin sırası',
    labelDotnetBytes: 'RAW, ToByteArray()',
    labelLiteral: 'Oracle literali',
  },

  ddlEntity: {
    input: 'CREATE TABLE',
    output: 'Entity ve eşleme',
    placeholder: 'Bir CREATE TABLE ifadesi yapıştırın…',
    pascalCase: 'PascalCase adlar',
    numberOneAsBool: 'NUMBER(1) bayraktır',
    sample: 'Örnek',

    warnings: {
      unknownType: 'Bu tipin karşılığı yok, string’e düşüldü. Nesne tipleri, koleksiyonlar ve uzamsal kolonlar dönüştürücü ya da view istiyor.',
      noPrimaryKey: 'DDL’de birincil anahtar yok. EF Core bir varlığı izlemek için anahtar istiyor — anahtarsız bir view ise HasNoKey() ile tanımlanır.',
      compositeKey: 'Bileşik anahtar. Eşlendi, ama bileşik anahtar identity kolonu imkânsız kılıyor ve her navigasyonu ağırlaştırıyor.',
      numberPrecision: 'Hassasiyetsiz NUMBER 38 haneye kadar gidiyor, dolayısıyla güvenli karşılık decimal. Kolon gerçekten bir anahtar tutuyorsa int ya da long’a daraltmak sizin kararınız — ve vermeye değer.',
    },
  },

  odpCall: {
    input: 'PROCEDURE ya da FUNCTION imzası',
    output: 'ODP.NET çağrısı',
    placeholder: 'Bir CREATE PROCEDURE başlığı yapıştırın…',
    sample: 'Örnek',

    warnings: {
      bindByName: 'BindByName varsayılan olarak false ve bu, parametreleri isme değil SIRAYA göre bağlıyor. İmzadan farklı sırada eklerseniz yanlış değer ya da ORA-06550 alırsınız — üstelik test ortamında çoğu zaman tesadüfen çalışır.',
      outSize: 'OUT metin parametresine açık bir Size vermek zorunlu, yoksa ODP.NET ORA-06502 “buffer too small” diyor. IN parametrelerinde gerekmiyor; sürekli unutulmasının sebebi bu asimetri.',
      refCursor: 'Ref cursor, ExecuteNonQuery’den SONRA parametreden okunuyor — ExecuteReader onu hiç döndürmüyor. Parametre değerini OracleRefCursor’a çevirip GetDataReader() çağırın.',
      booleanUnsupported: 'ODP.NET PL/SQL BOOLEAN bağlayamıyor. İmzayı NUMBER(1) yapın ya da prosedürü saran bir katman yazın.',
      unknownType: 'Yerleşik bir tip değil — büyük ihtimalle paket tipi, record ya da koleksiyon. Bunlar doğrudan bağlanamıyor; veriyi ref cursor ya da skaler parametrelerle dışarı verin.',
      noParameters: 'Parametre bulunamadı. Prosedürün gerçekten parametresi yoksa çağrı bu hâliyle tamam.',
    },
  },

  connString: {
    input: 'Bağlantı dizesi',
    built: 'Kurulan bağlantı dizesi',
    output: 'Gerçekte ne diyor',
    placeholder: 'User Id=…;Password=…;Data Source=…',
    modeAria: 'Mod',
    modeParse: 'çöz',
    modeBuild: 'kur',
    useDescriptor: 'TNS tanımlayıcısı',
    labelKind: 'Data Source',
    labelHost: 'konak',
    labelPort: 'port',
    labelService: 'servis',
    labelUser: 'kullanıcı',
    labelRedacted: 'paylaşılabilir',

    kinds: {
      easyConnect: 'Easy Connect',
      descriptor: 'TNS tanımlayıcısı',
      tnsAlias: 'TNS takma adı — tnsnames.ora’dan çözülüyor',
      unknown: 'tanınmadı',
    },

    warnings: {
      tnsAlias: 'Data Source yalnızca bir ad, yani nereye bağlanıldığına bu dize değil istemci makinesindeki tnsnames.ora karar veriyor. ORA-12154’ün bir makinede çıkıp ötekinde çıkmamasının olağan sebebi budur.',
      plainPassword: 'Şifre dizede açık metin olarak duruyor. Yukarıdaki maskeli satır, bir kayda ya da sohbete yapıştırılması güvenli olan hâli.',
      noPassword: 'Ne şifre ne de integrated security var. Bağlantı, sağlayıcıya göre ya soracak ya da başarısız olacak.',
      integratedSecurity: 'Integrated security işletim sistemi hesabını kullanıyor, yani gerçekte bağlanan şey uygulama havuzunun kimliği — yerelde çalıştıran geliştirici değil.',
      poolingOff: 'Havuzlama kapalı. O zaman her bağlantı tam el sıkışma bedelini ödüyor ve Oracle’da bu bedel kısa bir isteğe hâkim olacak kadar yüksek.',
      unknownSource: 'Data Source boş ya da bu aracın tanımadığı bir biçimde.',
    },
  },

  mergeSql: {
    table: 'tablo',
    keys: 'anahtar kolonlar',
    columns: 'Eklenecek ve güncellenecek kolonlar',
    output: 'MERGE ifadesi',
    placeholder: 'kanal_id, tutar, aciklama',
    withUpdate: 'eşleşince güncelle',

    warnings: {
      keyInUpdate: 'Bir anahtar kolonu UPDATE listesinden çıkarıldı. Oracle, ON yan tümcesinde geçen bir kolonun güncellenmesine izin vermiyor — ORA-38104. Kolon yine de ekleniyor.',
      noColumns: 'Anahtar dışında kolon yok, yani ifade yalnızca bir anahtar satırı ekliyor. Geçerli ama nadiren kastedilen şey.',
      insertOnly: 'Yalnızca ekleme: var olan satır sessizce olduğu gibi bırakılıyor. Eşleşmenin bir şeyi değiştirmesi gerekiyorsa güncelleme dalını açın.',
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
    sqlFixEmpty: 'Denetlenecek bir sorgu yapıştırın.',
    linqEmpty: 'Denetlenecek C# kodu yapıştırın.',
    pasEmpty: 'Bir Delphi birimi yapıştırın.',
    pasNoSql: 'Bu kaynakta SQL ifadesi bulunamadı.',
    identityEmpty: 'Bir tablo ve kolon adı girin.',
    cultureEmpty: 'Denetlenecek C# kodu yapıştırın.',
    guidEmpty: 'Bir GUID ya da 32 karakterlik hex girin.',
    guidInvalid: 'Bir GUID 32 onaltılık haneden oluşur.',
    ddlEmpty: 'Bir CREATE TABLE ifadesi yapıştırın.',
    ddlNoTable: 'Bu metinde CREATE TABLE bulunamadı.',
    ddlNoColumns: 'Tabloda eşlenecek kolon yok.',
    odpEmpty: 'Bir prosedür imzası yapıştırın.',
    odpNoRoutine: 'PROCEDURE ya da FUNCTION başlığı bulunamadı.',
    connEmpty: 'Bir bağlantı dizesi yapıştırın.',
    connNoPairs: 'Bu metinde Anahtar=Değer çifti yok.',
    mergeEmpty: 'Bir tablo adı ve en az bir anahtar kolonu girin.',
    mergeBadName: 'Geçerli bir tırnaksız tablo adı değil.',
  },
};
