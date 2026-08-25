/**
 * Component testlerinin ortak kurulumu.
 *
 * Yalnızca `// @vitest-environment jsdom` diyen dosyalar için anlamlı; araç
 * mantığı testleri saf TypeScript ve `node` ortamında koşuyor. Kurulum
 * dosyası her ikisinde de yüklendiği için burada DOM'a dokunan bir iş
 * yapılmıyor — `jest-dom` eşleştiricileri yüklemek DOM gerektirmiyor.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/* Testler arası DOM temizliği: aynı dosyada iki render varsa ikincisi
   birincinin düğümlerini de görür ve `getByRole` "birden fazla eşleşme"
   hatası verir. */
afterEach(cleanup);

/*
 * jsdom `matchMedia`yı hiç uygulamıyor. Tema kancası ve azaltılmış hareket
 * kontrolü onu okuduğu için, olmadığı anda bütün component testleri
 * render'ın en başında patlıyor.
 *
 * Stub her sorguya "eşleşmiyor" diyor: tema koyuya, animasyonlar açık hâle
 * düşüyor — testlerin varsaydığı durum bu. Bir test tersini görmek isterse
 * kendi sahtesini kurar.
 */
/*
 * jsdom düzen (layout) hesaplamıyor, bu yüzden `scrollIntoView` de yok.
 * Komut paleti seçili satırı görünür alana getirmek için onu çağırıyor;
 * eksik olduğunda effect fırlatıyor ve palet hiç render edilemiyor.
 */
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
