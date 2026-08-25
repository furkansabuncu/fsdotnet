/**
 * Sitenin altında yayınlandığı yol öneki.
 *
 * GitHub Pages proje siteleri kökte değil, depo adının altında duruyor:
 * `https://furkansabuncu.github.io/fsdotnet/`. Yani her bağlantının,
 * her varlığın ve router'ın bu ön eki bilmesi gerekiyor.
 *
 * Değer TEK YERDEN geliyor: `VITE_SITE_URL`. Vite'ın `base` ayarı da onun
 * yolundan türetiliyor (`vite.config.ts`), Vite de bunu `BASE_URL` olarak
 * geri veriyor. Ön eki ikinci bir değişkende tutmak, ikisinin kayıp
 * bağlantıları sessizce kırmasına açık kapı bırakırdı.
 *
 * Kök yolda yayınlandığında (kendi alan adı, Vercel, kullanıcı sitesi)
 * `BASE_URL` `/` olur ve buradaki her şey boş dizeye iner — yani ileride
 * alan adı alındığında sökülecek bir şey yok, yalnızca `VITE_SITE_URL`
 * değişiyor.
 */

/** Router'ın beklediği biçim: `/fsdotnet` ya da kök için boş dize. */
export const BASE_PATH: string = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Ön eki bir yola ekler. `/tr/t/base64` → `/fsdotnet/tr/t/base64` */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
