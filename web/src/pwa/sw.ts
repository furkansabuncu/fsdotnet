/// <reference lib="webworker" />
import { strategyFor } from './strategy';

/**
 * Çevrimdışı çalışma.
 *
 * Bu sitedeki otuz dört aracın otuz üçü zaten tamamen tarayıcıda koşuyor —
 * yani yetenek baştan beri vardı, yalnızca beyan edilmemişti. Service
 * worker onu gerçek kılıyor: bir kez açılan site, ağ olmadan da açılıyor.
 *
 * Bu, kapalı ağlarda çalışan bir geliştirici için soyut bir özellik değil.
 * İnternete çıkamayan bir makinede bir aracı ikinci kez açabilmek, o aracı
 * yer imine koymanın tek sebebi olabiliyor.
 *
 * ÖN BELLEKLEME LİSTESİ YOK. Bunun yerine iki basit kural (bkz. `strategy`):
 * içerik özetli varlıklar önbellekten, geri kalan her şey ağdan. Liste
 * tutmak, derlemede üretilen dosya adlarını buraya yazmayı gerektirirdi ve
 * o liste kaydığında sonuç sessizce bozuk bir sayfa olurdu.
 */

declare const self: ServiceWorkerGlobalScope;

/**
 * Derleme zamanında yazılıyor (`scripts/sw.mjs`). Her yayında değiştiği
 * için `activate` eski önbelleği silebiliyor — sabit bir ad olsaydı eski
 * varlıklar sonsuza kadar birikirdi.
 */
// eslint-disable-next-line no-underscore-dangle -- derleme zamanı sabiti; çift alt çizgi bu rolün yerleşik işareti.
declare const __SW_VERSION__: string;

const CACHE = `fsdotnet-${__SW_VERSION__}`;

/**
 * Kabuk: eşleşmeyen bir adrese çevrimdışı gidildiğinde gösterilecek sayfa.
 *
 * Her rota ayrı bir dosya olarak ön-render ediliyor, yani ziyaret
 * edilmemiş bir rota önbellekte yok. Kök `index.html` istemci tarafı
 * router'ı taşıdığı için o rotayı yine de çizebiliyor.
 */
const SHELL = self.registration.scope;

self.addEventListener('install', (event) => {
  // Kabuğu baştan al; onsuz ilk çevrimdışı gezinme boş sayfa olurdu.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      // Mevcut sekmeleri de devral: yoksa yeni sürüm ancak sekme
      // kapanıp açılınca devreye girerdi.
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached !== undefined) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached !== undefined) return cached;

    /* Bu rota hiç ziyaret edilmemiş. Gezinme isteğiyse kabuğu ver —
       router sayfayı istemcide çizer. Değilse hata olduğu gibi geçsin;
       eksik bir varlığı sessizce başka bir şeyle değiştirmek, sayfayı
       anlaşılmaz biçimde bozardı. */
    if (request.mode === 'navigate') {
      const shell = await caches.match(SHELL);
      if (shell !== undefined) return shell;
    }
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const strategy = strategyFor(event.request, self.location.origin);
  if (strategy === 'bypass') return;

  event.respondWith(
    strategy === 'cache-first' ? cacheFirst(event.request) : networkFirst(event.request),
  );
});
