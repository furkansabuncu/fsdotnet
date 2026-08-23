import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { CATEGORY_ORDER, categoryVars } from '../tools/categories';

const REPO = 'https://github.com/furkansabuncu/fsbox';

/**
 * Footer'da yalnızca ilk dört kategori listelenir — dördü de ana sayfadaki
 * bölüm sırasını izler. Tamamı zaten Ctrl+K ve ana sayfa ızgarasında var;
 * altı kategoriyi buraya da dökmek kolonu uzatmaktan başka işe yaramaz.
 */
const FOOTER_CATEGORIES = CATEGORY_ORDER.slice(0, 4);

/** Çevrilmeyen teknoloji adları — marka isimleri her dilde aynı. */
const BUILT_WITH = ['React 19', 'TypeScript', 'Tailwind CSS', '.NET 10'];

function ColumnTitle({ children }: { children: string }) {
  return <h2 className="mb-3 text-xs font-medium tracking-wide text-fg uppercase">{children}</h2>;
}

/**
 * Sayfanın dibine yapışan footer. `mt-auto` çalışabilmesi için sarmalayan
 * layout'un dikey flex kolon olması gerekir (App.tsx).
 */
export default function Footer() {
  const { t } = useI18n();

  const projectLinks = [
    { label: t.footer.repo, href: REPO },
    { label: t.footer.license, href: `${REPO}/blob/main/LICENSE` },
    { label: t.footer.adr, href: `${REPO}/tree/main/docs/adr` },
  ];

  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface/50 pt-8 pb-6">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Marka — mobilde iki kolonu birden kaplar, yoksa açıklama
              yarım kolonda kelime kelime kırılıyor. */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-mono text-base font-bold text-fg">fsbox</span>
            <p className="mt-2 max-w-[36ch] text-[13px] leading-5 text-muted">{t.footer.blurb}</p>
          </div>

          <div>
            <ColumnTitle>{t.footer.tools}</ColumnTitle>
            <ul className="space-y-2">
              {FOOTER_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    to={`/#${category}`}
                    className="text-[13px] text-muted transition-colors hover:text-fg"
                  >
                    {t.categories[category].label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnTitle>{t.footer.project}</ColumnTitle>
            <ul className="space-y-2">
              {projectLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                    <ArrowUpRight aria-hidden="true" className="h-3 w-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kategori rengini kolona veriyoruz; içerideki noktalar bg-cat ile
              onu okur, ayrı bir renk sınıfı seçmeye gerek kalmaz. */}
          <div style={categoryVars('web')}>
            <ColumnTitle>{t.footer.builtWith}</ColumnTitle>
            <ul className="space-y-2">
              {BUILT_WITH.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[13px] text-muted">
                  <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-cat" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border-subtle pt-4 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <span>{t.footer.mitLicensed}</span>
            <span aria-hidden="true">·</span>
            <span>{t.footer.builtBy}</span>
          </p>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            <span className="font-mono text-[11px] text-muted">{t.footer.runLocally}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
