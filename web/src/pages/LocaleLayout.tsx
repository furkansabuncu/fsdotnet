import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import { I18nProvider } from '../i18n/I18nProvider';
import { LOCALE_STORAGE_KEY, detectLocale, isLocale, localePath } from '../i18n/locale';
import CommandPalette from '../shared/CommandPalette';
import Footer from '../shared/Footer';
import Header from '../shared/Header';
import Sidebar from '../shared/Sidebar';

/** Tarayıcıdan okunabilen ipuçlarıyla dil seçer. */
function preferredLocale() {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    // Gizli sekmede localStorage erişimi hata verebiliyor; tercih yok sayılır.
  }
  return detectLocale(stored, navigator.languages ?? [navigator.language]);
}

/**
 * Dilsiz bir adresi dilli karşılığına taşır.
 *
 * `/` ve eski `/t/...` bağlantıları buraya düşüyor. `replace` şart: yoksa
 * geri düğmesi kullanıcıyı yönlendirmenin içine geri atar ve sonsuz döngü
 * hissi verir.
 */
export function LocaleRedirect() {
  const location = useLocation();
  const target = `${localePath(preferredLocale(), location.pathname)}${location.search}${location.hash}`;
  return <Navigate to={target} replace />;
}

/**
 * Dil önekli her sayfanın kabuğu.
 *
 * Sağlayıcı buraya taşındı çünkü dil artık rotadan geliyor; başlık, sol ray
 * ve altbilgi de sözlüğe ihtiyaç duyduğu için kabuğun tamamı bu sağlayıcının
 * içinde duruyor.
 */
export default function LocaleLayout() {
  const { locale } = useParams();
  const location = useLocation();

  /* Önek bir dil değilse (`/foo`) bu bir dil segmenti değil, yolun kendisidir.
     Varsayılan dilin altına taşınıyor; oradaki `*` rotası 404'ü gösteriyor.
     Döngü olmuyor: ikinci turda önek geçerli bir dil. */
  if (!isLocale(locale)) {
    return <Navigate to={localePath(preferredLocale(), location.pathname)} replace />;
  }

  return (
    <I18nProvider locale={locale}>
      {/* aurora: index.css'teki sabit konumlu renk lekesi katmanı. */}
      <div className="aurora flex min-h-full flex-col">
        <Header />

        <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4">
          <Sidebar />

          {/* min-w-0: olmadan flex öğesi içeriğinin altına inemez ve geniş
              ızgara/kod blokları sayfayı yatay kaydırtır. */}
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>

        <Footer />
        <CommandPalette />
      </div>
    </I18nProvider>
  );
}
