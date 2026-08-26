import { Link } from 'lucide-react';
import { Link as RouterLink } from 'react-router';
import { useI18n, useLocalePath } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import type { ToolDefinition } from '../tools/types';

/**
 * Araç sayfasının altındaki komşu araçlar.
 *
 * İki iş yapıyor. Ziyaretçi için: bir aracı bulan kişi genellikle
 * yanındakine de ihtiyaç duyuyor (bind doldurdunuz, şimdi biçimlendirmek
 * istiyorsunuz). Arama motoru için: derin sayfalar yalnızca ana sayfadan
 * bağlanıyordu, yani hepsi aynı uzaklıktaydı ve aralarında hiç bağ yoktu.
 * Kategori içi bağlantı, bu sayfaların birbirini desteklemesini sağlıyor.
 */
export default function RelatedTools({ tools }: { tools: readonly ToolDefinition[] }) {
  const { t } = useI18n();
  const path = useLocalePath();

  if (tools.length === 0) return null;

  return (
    <nav aria-labelledby="related-tools" className="mt-4 border-t border-border-subtle pt-6">
      <h2
        id="related-tools"
        className="mb-3 text-[11px] font-medium tracking-wider text-subtle uppercase"
      >
        {t.toolPage.related}
      </h2>

      <ul className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <li key={tool.id}>
            <RouterLink
              to={path(`/t/${tool.id}`)}
              style={categoryVars(tool.category)}
              className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-cat hover:text-fg"
            >
              <Link size={12} aria-hidden="true" className="text-cat" />
              <span className="font-medium text-fg">{tool.name}</span>
              <span className="hidden sm:inline">{t.toolDescriptions[tool.id]}</span>
            </RouterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
