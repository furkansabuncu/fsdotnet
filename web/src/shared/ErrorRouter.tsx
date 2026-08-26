import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n, useLocalePath } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import { getTool } from '../tools/registry';
import { routeError } from '../tools/errorRouting';

/**
 * "Hatayı yapıştır, aracı bul" kutusu.
 *
 * Ana sayfadaki arama, araç ADINA bakıyor — yani ne aradığınızı zaten
 * bilmenizi gerektiriyor. Oysa insan `ORA-00911` ile geliyor ve hangi
 * aracın işine yarayacağını bilmiyor. Bu kutu o boşluğu kapatıyor: hata
 * kodu, bozuk bir metin, bir JWT ya da bir sorgu — hepsi tanınıyor.
 */
export default function ErrorRouter() {
  const { t } = useI18n();
  const path = useLocalePath();
  const [input, setInput] = useState('');

  const route = routeError(input);
  const tool = route === null ? undefined : getTool(route.tool);

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
      <label htmlFor="error-router" className="text-[11px] font-medium tracking-wider text-subtle uppercase">
        {t.errorRouter.title}
      </label>

      <div className="relative flex items-center">
        <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-2.5 text-subtle" />
        <input
          id="error-router"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.errorRouter.placeholder}
          spellCheck={false}
          autoComplete="off"
          className="h-9 w-full rounded-md border border-border-subtle bg-surface-2 pr-2.5 pl-8 font-mono text-sm text-fg transition-colors hover:border-border-strong focus-visible:border-cat focus-visible:outline-none"
        />
      </div>

      {/* Boşken de bir satır ayrılıyor: sonuç belirince kutu zıplamasın. */}
      <div aria-live="polite" className="min-h-8">
        {input.trim() !== '' &&
          (tool === undefined ? (
            <p className="px-1 py-1.5 text-xs text-subtle">{t.errorRouter.noMatch}</p>
          ) : (
            <Link
              to={path(`/t/${tool.id}`)}
              style={categoryVars(tool.category)}
              className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-xs transition-colors hover:border-cat"
            >
              <span className="font-medium text-fg">{tool.name}</span>
              <span className="min-w-0 truncate text-muted">
                {t.errorRouter.reasons[route!.reason]}
              </span>
              <ArrowRight size={13} aria-hidden="true" className="ml-auto shrink-0 text-cat" />
            </Link>
          ))}
      </div>
    </section>
  );
}
