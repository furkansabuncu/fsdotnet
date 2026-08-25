import { Route, Routes } from 'react-router';
import LocaleLayout, { LocaleRedirect } from './pages/LocaleLayout';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ToolPage from './pages/ToolPage';

/**
 * Her sayfanın adresi diliyle birlikte: `/tr/t/base64`, `/en/t/base64`.
 *
 * Dilsiz adresler kaybolmuyor — `/` ve eski `/t/...` bağlantıları tarayıcı
 * tercihine göre dilli karşılığına yönlendiriliyor. Site bir süre dilsiz
 * adreslerle yayında olduğu için bu yönlendirme kalıcı; kaldırmak paylaşılmış
 * bağlantıları kırar.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LocaleRedirect />} />
      <Route path="/t/:toolId" element={<LocaleRedirect />} />

      <Route path="/:locale" element={<LocaleLayout />}>
        <Route index element={<HomePage />} />
        <Route path="t/:toolId" element={<ToolPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
