import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Wrench } from 'lucide-react';
import { useI18n, useLocalePath } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import { getTool } from '../tools/registry';
import { getRule } from '../rules/catalog';
import { ANALYZERS } from '../rules/analyzers';
import { applyFixes } from '../lint/engine';
import Seo, { SITE_URL } from '../shared/Seo';
import StructuredData from '../shared/StructuredData';
import { ruleSchema } from '../shared/schema';
import CopyButton from '../shared/CopyButton';
import { ruleTexts } from '../rules/text';
import NotFoundPage from './NotFoundPage';

/**
 * Tek bir lint kuralının sayfası.
 *
 * Statik bir açıklama değil, çalışan bir gösterim: katalogdaki örnek
 * gerçekten çözümleyiciden geçiyor ve bulgu ile düzeltilmiş hâli o çıktıdan
 * geliyor. Bu, sayfanın eskimesini imkânsız kılıyor — kural değişirse sayfa
 * da değişiyor, ve testler örneğin hâlâ o kuralı tetiklediğini doğruluyor.
 */
export default function RulePage() {
  const { t, locale } = useI18n();
  const path = useLocalePath();
  const { ruleId } = useParams();

  const rule = getRule(ruleId);
  const tool = rule === undefined ? undefined : getTool(rule.tool);
  const analyze = rule === undefined ? undefined : ANALYZERS[rule.tool];
  if (rule === undefined || tool === undefined || analyze === undefined) return <NotFoundPage />;

  const text = ruleTexts(t, rule.tool)[rule.key];
  if (text === undefined) return <NotFoundPage />;

  const result = analyze(rule.sample);
  const findings = result.ok ? result.value.filter((item) => item.rule === rule.key) : [];
  const fixed = result.ok ? applyFixes(rule.sample, result.value) : rule.sample;
  const changed = fixed !== rule.sample;

  return (
    <div style={categoryVars(tool.category)} className="flex flex-col gap-4 py-6">
      <Seo
        title={text.title}
        description={text.hint}
        path={`/r/${rule.id}`}
        locale={locale}
      />

      <nav className="flex items-center gap-2 text-xs text-subtle">
        <Link to={path('/r')} className="flex items-center gap-1 hover:text-fg">
          <ArrowLeft size={13} aria-hidden="true" />
          {t.rules.title}
        </Link>
        <span aria-hidden="true">·</span>
        <Link to={path(`/t/${tool.id}`)} className="hover:text-fg">
          {tool.name}
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="max-w-3xl text-xl leading-7 font-semibold tracking-tight text-fg">
          {text.title}
        </h1>
        {/* Kural kimliği çevrilmez — adresin kendisi. */}
        <code className="font-mono text-[11px] text-cat">{rule.id}</code>
        <p className="max-w-[70ch] text-sm leading-6 text-muted">{text.hint}</p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <article className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
          <div className="flex h-8 items-center gap-2 border-b border-border-subtle bg-surface-2 px-3">
            <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
              {t.rules.sample}
            </span>
            <span className="ml-auto">
              <CopyButton value={rule.sample} />
            </span>
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-sm leading-6 whitespace-pre-wrap text-fg">
            {rule.sample}
          </pre>
        </article>

        <article className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
          <div className="flex h-8 items-center gap-2 border-b border-border-subtle bg-surface-2 px-3">
            <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
              {changed ? t.rules.fixed : t.rules.noFix}
            </span>
            {changed && (
              <span className="ml-auto">
                <CopyButton value={fixed} />
              </span>
            )}
          </div>
          <pre
            className={`overflow-x-auto p-3 font-mono text-sm leading-6 whitespace-pre-wrap ${
              changed ? 'text-fg' : 'text-subtle'
            }`}
          >
            {changed ? fixed : t.rules.manualHint}
          </pre>
        </article>
      </section>

      {findings.length > 0 && (
        <p className="font-mono text-xs text-subtle">
          {/* Konum ve ayrıntı çevrilmez — örnekten geliyor. */}
          {findings.map((item) => `${item.position}${item.detail ? `  ${item.detail}` : ''}`).join(' · ')}
        </p>
      )}

      <Link
        to={path(`/t/${tool.id}`)}
        className="flex max-w-[70ch] items-center gap-2 rounded-lg border border-border-subtle bg-surface p-3 text-sm text-muted transition-colors hover:border-cat"
      >
        <Wrench size={14} aria-hidden="true" className="shrink-0 text-cat" />
        {t.rules.tryIt(tool.name)}
        <ArrowRight size={14} aria-hidden="true" className="ml-auto shrink-0 text-cat" />
      </Link>

      <StructuredData
        data={ruleSchema(
          { siteUrl: SITE_URL, locale },
          {
            title: text.title,
            hint: text.hint,
            path: `/r/${rule.id}`,
            homeLabel: t.nav.home,
            catalogLabel: t.rules.title,
          },
        )}
      />
    </div>
  );
}
