import type { ToolId } from '../tools/types';

/**
 * Aracın girdisini adrese gömerek paylaşılabilir bir bağlantı üretir.
 *
 * Neden gerekli: bir aracı paylaşabiliyorduk ama DURUMU paylaşamıyorduk.
 * Oysa bu tür sitelerin bir cevaba iliştirilmesinin tek sebebi o —
 * "işte senin sorgun, düzeltilmiş hâli" diye tek bir link atabilmek.
 *
 * 🔴 Durum HASH FRAGMENT'ta tutuluyor, query string'de değil. Fragment
 * sunucuya HİÇ gönderilmiyor: erişim kaydına düşmüyor, referrer başlığında
 * taşınmıyor, ara sunucularda görünmüyor. Aynı veriyi `?q=` ile taşımak
 * onu bu üç yerin hepsine yazmak olurdu.
 */

/**
 * Girdisi bir kimlik bilgisi olan araçlar — bunlarda paylaşım düğmesi YOK.
 *
 * Bir bağlantı üretmek, içeriği tarayıcı geçmişine, panoya ve gönderildiği
 * yerin bağlantı önizlemesine yazmak demek. Token, şifre ve anahtar için
 * bu, aracın en başta engellemek üzere var olduğu şeyin ta kendisi.
 * Özelliğin en önemli parçası nerede BULUNMADIĞI.
 */
const NO_SHARE: ReadonlySet<ToolId> = new Set<ToolId>(['jwt', 'hash', 'conn-string']);

export function canShare(toolId: string | undefined): toolId is ToolId {
  return toolId !== undefined && !NO_SHARE.has(toolId as ToolId);
}

/** Adresteki anahtar. Kısa tutuluyor; bağlantının tamamı zaten uzun. */
const PARAM = 's';

/*
 * Biçim: `#s=<bayrak><base64url>`. Bayrak sıkıştırmanın uygulanıp
 * uygulanmadığını söylüyor — `CompressionStream` her yerde yok ve bayrak
 * olmadan çözücü hangi yolu deneyeceğini bilemezdi.
 */
const DEFLATED = '1';
const PLAIN = '0';

/**
 * Üretilen bağlantının pratik üst sınırı.
 *
 * Tarayıcılar çok daha uzununu taşıyor ama araya giren şeyler taşımıyor:
 * sohbet istemcileri kırpıyor, bazı sunucular 414 dönüyor, e-posta
 * istemcileri satır kaydırıyor. Sınırı aşan girdi için düğme kapanıyor —
 * çalışmayacak bir bağlantı vermek, hiç vermemekten kötü.
 */
export const MAX_LINK = 2000;

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

/* Dönüş tipi açıkça `ArrayBuffer` üzerinde: `Blob` paylaşılan bellek
   kabul etmiyor ve `Uint8Array.from` varsayılan olarak ikisini de
   kapsayan geniş tipi veriyor. */
const fromBase64Url = (text: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
};

/**
 * Baytları tek parçalık bir akışa sarar.
 *
 * `new Blob([…]).stream()` yerine doğrudan `ReadableStream`: Blob ara
 * nesnesine gerek yok ve `Blob.stream` bazı ortamlarda (jsdom dâhil)
 * bulunmuyor — orada sıkıştırma sessizce yedek yola düşüyordu.
 */
function streamOf(bytes: Uint8Array<ArrayBuffer>): ReadableStream<BufferSource> {
  /* Parça tipi `BufferSource`: sıkıştırma akışlarının yazılabilir ucu
     onu istiyor ve daha dar bir tip `pipeThrough`ta uyumsuz düşüyor. */
  return new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

/**
 * Akışı sonuna kadar okur.
 *
 * `getReader()` ile, `for await` ile değil: akışlar üzerinde asenkron
 * yineleme geç gelen bir özellik ve Safari'de uzun süre yoktu — sıkıştırma
 * o tarayıcılarda sessizce yedek yola düşerdi.
 */
async function through(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  for (;;) {
    /* Akış okuması doğası gereği sıralı: bir sonraki parçanın var olup
       olmadığını ancak bir öncekini okuyunca öğreniyoruz, yani paralel
       çalıştırılabilecek bir şey yok. */
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;
    if (value !== undefined) chunks.push(value);
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Metni adres parçasına kodlar. */
export async function encodeState(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);

  if (typeof CompressionStream === 'undefined') return PLAIN + toBase64Url(bytes);

  try {
    const stream = streamOf(bytes).pipeThrough(new CompressionStream('deflate-raw'));
    return DEFLATED + toBase64Url(await through(stream));
  } catch {
    // Sıkıştırma başarısızsa bağlantı yine üretilebilmeli, yalnızca uzun olur.
    return PLAIN + toBase64Url(bytes);
  }
}

/** Adres parçasını çözer; bozuksa null — kırık bir link aracı bozmamalı. */
export async function decodeState(payload: string): Promise<string | null> {
  const flag = payload.slice(0, 1);
  const body = payload.slice(1);
  if (body === '' || (flag !== DEFLATED && flag !== PLAIN)) return null;

  try {
    const bytes = fromBase64Url(body);
    if (flag === PLAIN) return new TextDecoder().decode(bytes);

    const stream = streamOf(bytes).pipeThrough(new DecompressionStream('deflate-raw'));
    return new TextDecoder().decode(await through(stream));
  } catch {
    return null;
  }
}

/** `#s=…` içinden yükü ayıklar. */
export function readHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get(PARAM);
}

/** Mevcut adresi, durumu taşıyan hâline çevirir. */
export function withState(href: string, payload: string): string {
  const url = new URL(href);
  url.hash = `${PARAM}=${payload}`;
  return url.toString();
}
