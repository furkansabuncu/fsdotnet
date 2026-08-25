import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Moon, Search, Sun } from 'lucide-react';
import { categoryVars } from '../tools/categories';
import { LOCALES, useI18n } from '../i18n/I18nProvider';
import { commandPalette } from './useCommandPalette';
import { useTheme } from './useTheme';

const REPO_URL = 'https://github.com/furkansabuncu/fsdev';

/**
 * Kare ikon düğmesi sınıfları. Tema düğmesi bir <button>, GitHub bir <a> —
 * ortak görünüm için sınıf paylaşılıyor, sarmalayıcı component yazılmıyor.
 */
const ICON_BUTTON =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted ' +
  'transition-colors duration-[120ms] hover:bg-surface-2 hover:text-fg';

/** Klavye kısayolu rozeti. */
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] leading-4 font-normal text-subtle">
      {children}
    </kbd>
  );
}

/**
 * GitHub markası.
 *
 * lucide-react v1 marka ikonlarını kaldırdı (`Github` artık export edilmiyor),
 * bu yüzden işaret satır içi SVG olarak duruyor. Boyut/renk diğer lucide
 * ikonlarıyla hizalı olsun diye 16px + currentColor.
 */
function GithubMark() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/**
 * Yapışkan üst bar.
 *
 * Arama alanı gerçek bir input DEĞİL, komut paletini açan bir düğme: tek bir
 * arama durumu olsun diye. İki ayrı arama kutusu (bar + palet) kullanıcıyı
 * "hangisi ne arıyor" ikilemine sokuyor. Bar sadece paleti açar, paleti
 * render etmez — palet uygulama kökünde bir kez duruyor.
 */
export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-3 px-4">
        {/* Logo — "beta" çipi link dışında; linkin erişilebilir adı "fsdev" kalsın. */}
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/" className="font-mono text-base leading-6 font-bold tracking-tight">
            {/* categoryVars --cat tanımlar; gradyan onu from-cat ile okur. */}
            <span style={categoryVars('dotnet')}>
              <span className="text-fg">fs</span>
              <span className="bg-gradient-to-r from-cat to-accent bg-clip-text text-transparent">
                dev
              </span>
            </span>
          </Link>
          <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-subtle">
            beta
          </span>
        </div>

        {/* Arama — sm altında kare ikon düğmesine küçülür. aria-label şart:
            mobilde görünür metin kalmıyor. */}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => commandPalette.open()}
            aria-label={t.header.searchAria}
            aria-haspopup="dialog"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle bg-surface-2 transition-colors duration-[120ms] hover:border-border-strong sm:w-full sm:max-w-md sm:justify-start sm:gap-2 sm:px-2.5"
          >
            <Search size={14} className="shrink-0 text-subtle" aria-hidden="true" />
            <span className="hidden text-[13px] text-subtle sm:inline">{t.header.searchPlaceholder}</span>
            <span className="ml-auto hidden items-center gap-1 sm:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* İki dil için açılır menü fazla: iki küçük düğme daha hızlı ve
              aktif dili tek bakışta gösteriyor. */}
          <div
            role="group"
            aria-label={t.header.languageAria}
            className="mr-1 flex items-center rounded-md border border-border-subtle bg-surface-2 p-0.5"
          >
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                className={`rounded px-1.5 py-0.5 font-mono text-[11px] uppercase transition-colors ${
                  locale === code ? 'bg-surface-3 text-fg' : 'text-subtle hover:text-fg'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? t.header.toLightTheme : t.header.toDarkTheme}
            className={ICON_BUTTON}
          >
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={t.header.github}
            className={ICON_BUTTON}
          >
            <GithubMark />
          </a>
        </div>
      </div>
    </header>
  );
}
