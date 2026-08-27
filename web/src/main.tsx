import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { BASE_PATH } from './basePath';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

/*
 * Ön-render'ın `<head>`e yazdığı etiketleri React devralmadan önce kaldır.
 *
 * O etiketler JavaScript'siz tarayıcılar için var ve işlerini çoktan yaptılar.
 * React onları kendi ürettiği saymadığı için bırakılırlarsa aynı sayfada iki
 * başlık, iki açıklama ve iki canonical oluşuyor — sonuncusu arama motoruna
 * hangi adresin doğru olduğu konusunda çelişkili sinyal veriyor.
 */
for (const tag of document.head.querySelectorAll('[data-ssr-head]')) tag.remove();

/*
 * Router en dışta: dil artık adresten okunuyor, yani `I18nProvider` rotanın
 * içinde duruyor (`LocaleLayout`). Sağlayıcı burada kalsaydı `:locale`
 * parametresini göremezdi.
 */
/*
 * Service worker yalnızca üretim derlemesinde.
 *
 * Geliştirmede kayıtlı bir worker, kaynak değişikliğini önbellekten
 * verip "değişiklik neden görünmüyor" sorusunu üretiyor — HMR ile
 * birlikte yaşaması zor ve kazancı sıfır.
 *
 * Yol öneke bağlı: worker'ın KAPSAMI bulunduğu klasördür, kökten
 * kaydedilen bir worker proje sitesinin alt yolunu görmezdi.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Hata yutuluyor: kayıt başarısız olsa da site tamamen çalışıyor,
    // yalnızca çevrimdışı desteği olmuyor.
    void navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => undefined);
  });
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={BASE_PATH}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
