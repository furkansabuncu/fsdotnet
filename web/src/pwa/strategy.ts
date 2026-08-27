/**
 * Service worker'ın bir isteği nasıl ele alacağı.
 *
 * Ayrı ve saf bir modül olarak duruyor çünkü buradaki bir hata en pahalı
 * hata türü: yanlış strateji, kullanıcıya SÜRESİZ eski bir sayfa
 * gösterebilir ve kullanıcı bunu anlayamaz — sayfa çalışıyor, yalnızca
 * yanlış. Karar mantığı test edilebilir olmak zorunda.
 */

export type Strategy =
  /** Önce önbellek. Yalnızca içeriği DEĞİŞEMEYECEK adresler için. */
  | 'cache-first'
  /** Önce ağ, olmazsa önbellek. Çevrimdışıyken çalışır, çevrimiçiyken tazedir. */
  | 'network-first'
  /** Service worker karışmaz. */
  | 'bypass';

/**
 * Vite varlıkları içerik özetiyle adlandırılıyor: `index-8pZt22JB.js`.
 * İçerik değişirse ad da değişiyor, yani bu adresler DEĞİŞMEZ — önbellekten
 * vermek eski sürüm riski taşımıyor.
 */
const HASHED_ASSET = /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/;

export interface RequestLike {
  url: string;
  method: string;
}

export function strategyFor(request: RequestLike, origin: string): Strategy {
  // Yalnızca okuma önbelleklenir; POST bir yan etkidir.
  if (request.method !== 'GET') return 'bypass';

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return 'bypass';
  }

  /* Başka bir kaynak: API çağrıları buraya düşüyor. Regex aracının .NET
     motoru oradan geliyor ve ESKİ bir cevabı vermek, aracın var olma
     sebebini ortadan kaldırırdı. */
  if (url.origin !== origin) return 'bypass';

  if (HASHED_ASSET.test(url.pathname)) return 'cache-first';

  /* Geri kalan her şey — HTML, sitemap, favicon, og görselleri. HTML'in
     ağ-önce olması şart: içerik özetli değil ve eski bir HTML, artık var
     olmayan varlık adlarını isterdi. */
  return 'network-first';
}
