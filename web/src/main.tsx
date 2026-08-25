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
createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={BASE_PATH}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
