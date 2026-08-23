import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Construction } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import { getTool } from '../tools/registry';

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-start gap-3 py-16">
      <h1 className="text-xl font-semibold text-fg">{t.toolPage.notFound}</h1>
      <p className="text-sm text-muted">{t.toolPage.notFoundBody}</p>
      <Link to="/" className="text-sm text-accent hover:underline">
        {t.toolPage.backLink}
      </Link>
    </div>
  );
}

/** Lazy chunk inerken panelin yüksekliğini koru — layout zıplamasın. */
function ToolSkeleton() {
  return (
    <div className="h-[340px] animate-pulse rounded-lg border border-border-subtle bg-surface" />
  );
}

export default function ToolPage() {
  const { t } = useI18n();
  const { toolId } = useParams();
  const tool = getTool(toolId);

  if (!tool) return <NotFound />;

  const Icon = tool.icon;

  return (
    <div style={categoryVars(tool.category)} className="flex flex-col gap-4 py-6">
      {/* 44px başlık şeridi: ortalanmış dev başlık yok — araç adı, rozetler ve
          geri dönüş tek satırda. */}
      <header className="flex h-11 items-center gap-3">
        <Link
          to="/"
          aria-label={t.toolPage.backAria}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>

        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-cat-bg">
          <Icon size={18} className="text-cat" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <h1 className="truncate text-base font-medium text-fg">{tool.name}</h1>
          <p className="truncate text-xs text-subtle">{t.categories[tool.category].label}</p>
        </div>

        <span className="ml-auto shrink-0 rounded bg-surface-2 px-2 py-1 font-mono text-[10px] tracking-wide text-subtle uppercase">
          {tool.runtime === 'server' ? t.toolPage.viaApi : t.toolPage.runsLocally}
        </span>
      </header>

      {tool.status === 'soon' ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong bg-surface p-8">
          <Construction size={20} className="text-cat" aria-hidden="true" />
          <h2 className="text-sm font-medium text-fg">{t.toolPage.notBuilt}</h2>
          <p className="max-w-md text-sm text-muted">{t.toolDescriptions[tool.id]}</p>
          <Link to="/" className="text-sm text-accent hover:underline">
            {t.toolPage.browseReady}
          </Link>
        </div>
      ) : (
        <Suspense fallback={<ToolSkeleton />}>
          <tool.component />
        </Suspense>
      )}
    </div>
  );
}
