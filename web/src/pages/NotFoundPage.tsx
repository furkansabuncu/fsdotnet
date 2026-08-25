import { Link } from 'react-router';
import { useI18n, useLocalePath } from '../i18n/I18nProvider';

/**
 * Bilinmeyen adres ve bilinmeyen araç kimliği aynı sayfaya düşüyor —
 * ziyaretçi açısından ikisi de "burada bir şey yok".
 *
 * `noindex`: bu sayfanın arama sonuçlarında yeri yok. Etiket olmadan yanlış
 * yazılmış her adres indekslenebilir bir sayfa gibi görünür ve sitemap'teki
 * gerçek sayfalarla rekabet eder.
 */
export default function NotFoundPage() {
  const { t } = useI18n();
  const path = useLocalePath();

  return (
    <>
      <title>{`${t.notFound.title} · fsdev`}</title>
      <meta name="robots" content="noindex, follow" />

      <div className="flex flex-col items-start gap-3 py-16">
        <h1 className="text-xl font-semibold text-fg">{t.notFound.title}</h1>
        <p className="text-sm text-muted">{t.notFound.body}</p>
        <Link to={path('/')} className="text-sm text-accent hover:underline">
          {t.notFound.back}
        </Link>
      </div>
    </>
  );
}
