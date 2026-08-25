import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import { BASE_PATH } from './basePath';

/**
 * Ön-render giriş noktası.
 *
 * Tarayıcı girişinden (`main.tsx`) iki farkı var: router `StaticRouter`
 * çünkü adres geçmişi yok, ve `StrictMode` yok çünkü çift render sunucuda
 * yalnızca iki katı iş demek.
 *
 * `Suspense` beklenmiyor: araçlar `lazy` yükleniyor ve `renderToString` onları
 * beklemeden iskeleti basıyor. Bu bilinçli — ön-render'ın işi arama ve
 * paylaşım tarayıcılarına metin ve meta vermek, etkileşimli aracı önceden
 * çizmek değil. Metin (başlık, açıklama, rehber bölümü) `ToolPage` içinde,
 * yani `lazy` sınırının DIŞINDA duruyor ve çıktıya giriyor.
 */
export function render(url: string): string {
  return renderToString(
    <StaticRouter basename={BASE_PATH} location={url}>
      <App />
    </StaticRouter>,
  );
}
