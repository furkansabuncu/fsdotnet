import { Link, useLocation } from 'react-router';
import { Home } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { CATEGORIES, categoryVars } from '../tools/categories';
import { toolsByCategory } from '../tools/registry';

/**
 * Sol gezinme rayı.
 *
 * Ana sayfa ızgarası gibi bu da registry'den türer — sabit bir menü listesi
 * yok, yeni araç eklendiğinde ray kendiliğinden büyür (ADR-0003).
 *
 * `lg` altında gizli: dar ekranda 200px'lik ray içeriğin yarısını yer, ve
 * aynı gezinme zaten Ctrl+K paletinde ve ana sayfa ızgarasında var.
 */
export default function Sidebar() {
  const { t } = useI18n();
  const { pathname } = useLocation();

  const groups = toolsByCategory();
  const onHome = pathname === '/';
  /** Aktif aracın id'si; /t/<id> dışındaki yollarda undefined. */
  const activeToolId = pathname.startsWith('/t/') ? pathname.slice(3) : undefined;

  return (
    <nav
      aria-label={t.nav.aria}
      /* Yapışkan: header 48px, ray onun hemen altından başlar ve kendi içinde
         kayar — uzun katalogda sayfa scroll'u rayı yukarı taşımasın. */
      className="sticky top-12 hidden h-[calc(100vh-3rem)] w-56 shrink-0 overflow-y-auto border-r border-border-subtle py-6 pr-4 lg:block"
    >
      <Link
        to="/"
        aria-current={onHome ? 'page' : undefined}
        className={`mb-4 flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors ${
          onHome ? 'bg-surface-2 font-medium text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg'
        }`}
      >
        <Home size={15} aria-hidden="true" />
        {t.nav.home}
      </Link>

      <ul className="flex flex-col gap-4">
        {groups.map(({ category, tools }) => {
          const Icon = CATEGORIES[category].icon;

          return (
            <li key={category} style={categoryVars(category)}>
              {/* Kategori başlığı ana sayfadaki bölüme atlar; ızgarayı da
                  gezinme hedefi olarak kullanabilmek için /#<id>. */}
              <Link
                to={`/#${category}`}
                className="group flex h-7 items-center gap-2 rounded px-2 text-[11px] font-medium tracking-wider text-subtle uppercase transition-colors hover:text-fg"
              >
                <Icon size={12} className="text-cat" aria-hidden="true" />
                {t.categories[category].label}
              </Link>

              <ul className="mt-0.5 flex flex-col">
                {tools.map((tool) => {
                  const active = tool.id === activeToolId;
                  const ready = tool.status === 'ready';

                  /* 'soon' araç bir bağlantı değil: gidilecek yeri yok.
                     Görsel olarak da soluk — tıklanabilir görünmesi yanlış
                     vaat olurdu (ToolCard ile aynı kural). */
                  if (!ready) {
                    return (
                      <li
                        key={tool.id}
                        className="flex h-7 items-center gap-2 rounded px-2 pl-6 text-[13px] text-subtle opacity-60"
                      >
                        <span className="truncate">{tool.name}</span>
                      </li>
                    );
                  }

                  return (
                    <li key={tool.id}>
                      <Link
                        to={`/t/${tool.id}`}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex h-7 items-center gap-2 rounded px-2 pl-6 text-[13px] transition-colors ${
                          active
                            ? 'bg-surface-2 font-medium text-fg'
                            : 'text-muted hover:bg-surface-2 hover:text-fg'
                        }`}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-1 left-1.5 w-0.5 rounded-full bg-cat"
                          />
                        )}
                        <span className="truncate">{tool.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
