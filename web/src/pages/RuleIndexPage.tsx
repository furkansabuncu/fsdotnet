import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useI18n, useLocalePath } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import { getTool } from '../tools/registry';
import { RULE_CATALOG, rulesByTool } from '../rules/catalog';
import Seo from '../shared/Seo';
import { ruleTexts } from '../rules/text';

/**
 * Kural kataloğunun dizin sayfası.
 *
 * Tek tek kural sayfalarının ebeveyni: onları birbirine ve siteye bağlıyor.
 * Bu olmadan kırk sekiz sayfa yalnızca site haritasından erişilebilir olur
 * ve bir arama motoru için "derin ama bağlantısız" görünürdü.
 */
export default function RuleIndexPage() {
  const { t, locale } = useI18n();
  const path = useLocalePath();
  const groups = rulesByTool();

  return (
    <div className="flex flex-col gap-8 py-6">
      <Seo
        title={t.rules.title}
        description={t.rules.description(RULE_CATALOG.length)}
        path="/r"
        locale={locale}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{t.rules.title}</h1>
        <p className="max-w-[70ch] text-sm leading-6 text-muted">
          {t.rules.description(RULE_CATALOG.length)}
        </p>
      </header>

      {groups.map((group) => {
        const tool = getTool(group.tool);
        if (tool === undefined) return null;

        const rules = ruleTexts(t, group.tool);

        return (
          <section key={group.tool} style={categoryVars(tool.category)} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-fg">
              {tool.name}
              <Link to={path(`/t/${tool.id}`)} className="text-xs font-normal text-cat hover:underline">
                {t.rules.openTool}
              </Link>
            </h2>

            <ul className="grid grid-cols-1 gap-1.5 lg:grid-cols-2">
              {group.rules.map((rule) => (
                <li key={rule.id}>
                  <Link
                    to={path(`/r/${rule.id}`)}
                    className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-2.5 py-2 text-sm transition-colors hover:border-cat"
                  >
                    <span className="min-w-0 flex-1 truncate text-fg">
                      {rules[rule.key]?.title ?? rule.key}
                    </span>
                    <ArrowRight size={13} aria-hidden="true" className="shrink-0 text-cat" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
