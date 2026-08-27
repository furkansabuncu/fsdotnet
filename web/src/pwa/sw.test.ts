import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Service worker'ın KENDİSİ, sahte bir worker kapsamında çalıştırılıyor.
 *
 * Strateji ayrı test ediliyor; buradaki soru başka: worker o stratejiyi
 * doğru uyguluyor mu? Kabuğu kuruyor mu, eski önbelleği siliyor mu, ağ
 * düştüğünde gerçekten önbelleğe düşüyor mu? Bunlar tarayıcıda elle
 * denenebilir ama her yayında değil — ve burada yanlış bir davranış
 * kullanıcıya SÜRESİZ eski bir sayfa göstermek demek.
 */

type Handler = (event: unknown) => void;

interface FakeCache {
  store: Map<string, string>;
  add: (url: string) => Promise<void>;
  put: (request: { url: string }, response: { body: string }) => Promise<void>;
}

const SCOPE = 'https://x.dev/fsdotnet/';

function setup(options: { existingCaches?: string[]; offline?: boolean } = {}) {
  const handlers = new Map<string, Handler>();
  const caches = new Map<string, FakeCache>();
  const fetched: string[] = [];

  for (const name of options.existingCaches ?? []) caches.set(name, makeCache());

  function makeCache(): FakeCache {
    const store = new Map<string, string>();
    return {
      store,
      add: async (url) => {
        store.set(url, 'shell');
      },
      put: async (request, response) => {
        store.set(request.url, response.body);
      },
    };
  }

  const cacheStorage = {
    open: async (name: string) => {
      if (!caches.has(name)) caches.set(name, makeCache());
      return caches.get(name)!;
    },
    keys: async () => [...caches.keys()],
    delete: async (name: string) => caches.delete(name),
    match: async (request: { url: string } | string) => {
      const url = typeof request === 'string' ? request : request.url;
      for (const cache of caches.values()) {
        const body = cache.store.get(url);
        if (body !== undefined) return { body, fromCache: true };
      }
      return undefined;
    },
  };

  vi.stubGlobal('caches', cacheStorage);
  vi.stubGlobal('self', {
    addEventListener: (type: string, handler: Handler) => handlers.set(type, handler),
    registration: { scope: SCOPE },
    location: { origin: 'https://x.dev' },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  });
  vi.stubGlobal('fetch', async (request: { url: string }) => {
    fetched.push(request.url);
    if (options.offline === true) throw new Error('ağ yok');
    return { ok: true, body: 'network', clone: () => ({ body: 'network' }) };
  });

  return { handlers, caches, cacheStorage, fetched };
}

/** Worker'ın beklediği en küçük olay şekli. */
const lifecycleEvent = () => {
  const waited: Promise<unknown>[] = [];
  return { event: { waitUntil: (p: Promise<unknown>) => waited.push(p) }, waited };
};

const fetchEvent = (url: string, mode = 'no-cors', method = 'GET') => {
  let answered: Promise<{ body: string; fromCache?: boolean }> | null = null;
  return {
    event: {
      request: { url, method, mode },
      respondWith: (p: Promise<{ body: string; fromCache?: boolean }>) => {
        answered = p;
      },
    },
    get answered() {
      return answered;
    },
  };
};

/** Her testte modül yeniden yükleniyor: dinleyiciler mount'ta bağlanıyor. */
async function loadWorker() {
  vi.resetModules();
  await import('./sw');
}

describe('yaşam döngüsü', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('kurulumda kabuğu önbelleğe alır', async () => {
    // Kabuk olmadan, ziyaret edilmemiş bir rotaya çevrimdışı gitmek boş
    // sayfa verirdi.
    const fake = setup();
    await loadWorker();

    const install = lifecycleEvent();
    fake.handlers.get('install')!(install.event);
    await Promise.all(install.waited);

    expect(fake.caches.get('fsdotnet-test')?.store.has(SCOPE)).toBe(true);
  });

  it('etkinleşirken yalnızca ESKİ önbellekleri siler', async () => {
    const fake = setup({ existingCaches: ['fsdotnet-eski', 'fsdotnet-test', 'baska-uygulama'] });
    await loadWorker();

    const activate = lifecycleEvent();
    fake.handlers.get('activate')!(activate.event);
    await Promise.all(activate.waited);

    // Sürümlü ad olmasaydı eski varlıklar sonsuza kadar birikirdi.
    expect(await fake.cacheStorage.keys()).toEqual(['fsdotnet-test']);
  });
});

describe('istek karşılama', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('özetli varlığı önbellekten verir, ağa gitmez', async () => {
    const fake = setup();
    await loadWorker();

    const url = 'https://x.dev/fsdotnet/assets/index-8pZt22JB.js';
    (await fake.cacheStorage.open('fsdotnet-test')).store.set(url, 'onbellek');

    const request = fetchEvent(url);
    fake.handlers.get('fetch')!(request.event);

    expect((await request.answered)?.body).toBe('onbellek');
    expect(fake.fetched).toEqual([]);
  });

  it('sayfayı önce ağdan alır ve önbelleğe yazar', async () => {
    const fake = setup();
    await loadWorker();

    const url = 'https://x.dev/fsdotnet/tr/t/sql-fix/';
    const request = fetchEvent(url, 'navigate');
    fake.handlers.get('fetch')!(request.event);

    expect((await request.answered)?.body).toBe('network');
    expect(fake.fetched).toEqual([url]);
    expect(fake.caches.get('fsdotnet-test')?.store.get(url)).toBe('network');
  });

  it('ağ düştüğünde ziyaret edilmiş sayfayı önbellekten verir', async () => {
    const fake = setup({ offline: true });
    await loadWorker();

    const url = 'https://x.dev/fsdotnet/tr/t/sql-fix/';
    (await fake.cacheStorage.open('fsdotnet-test')).store.set(url, 'onceki ziyaret');

    const request = fetchEvent(url, 'navigate');
    fake.handlers.get('fetch')!(request.event);

    expect((await request.answered)?.body).toBe('onceki ziyaret');
  });

  it('ağ düştüğünde bilinmeyen rotaya kabuğu verir', async () => {
    const fake = setup({ offline: true });
    await loadWorker();

    (await fake.cacheStorage.open('fsdotnet-test')).store.set(SCOPE, 'kabuk');

    const request = fetchEvent('https://x.dev/fsdotnet/tr/t/hic-gidilmemis/', 'navigate');
    fake.handlers.get('fetch')!(request.event);

    // Router sayfayı istemcide çiziyor; kabuk bunun için var.
    expect((await request.answered)?.body).toBe('kabuk');
  });

  it('ağ düştüğünde eksik VARLIK için hata verir', async () => {
    // Eksik bir varlığı sessizce kabukla değiştirmek sayfayı anlaşılmaz
    // biçimde bozardı — JavaScript yerine HTML dönerdi.
    const fake = setup({ offline: true });
    await loadWorker();

    const request = fetchEvent('https://x.dev/fsdotnet/og.png');
    fake.handlers.get('fetch')!(request.event);

    await expect(request.answered).rejects.toThrow('ağ yok');
  });

  it('başka kaynağa hiç karışmaz', async () => {
    const fake = setup();
    await loadWorker();

    const request = fetchEvent('https://api.fsdotnet.dev/api/v1/regex', 'cors', 'POST');
    fake.handlers.get('fetch')!(request.event);

    // `respondWith` çağrılmadı: istek tarayıcıya bırakıldı.
    expect(request.answered).toBeNull();
  });
});
