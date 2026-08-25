import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useI18n, useLocalePath } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import { getTool } from '../tools/registry';
import Seo from '../shared/Seo';
import NotFoundPage from './NotFoundPage';

/** Lazy chunk inerken panelin yüksekliğini koru — layout zıplamasın. */
function ToolSkeleton() {
  return (
    <div className="h-[340px] animate-pulse rounded-lg border border-border-subtle bg-surface" />
  );
}

export default function ToolPage() {
  const { t, locale } = useI18n();
  const path = useLocalePath();
  const { toolId } = useParams();
  const tool = getTool(toolId);

  /* Katalogda yazılmamış araç kalmadı, ama tip birleşimi hâlâ `soon`
     durumunu taşıyor — bir sonraki araç eklenirken sahnelenecek yer orası.
     Böyle bir araç route'lanırsa component'i yok, o yüzden daraltma şart. */
  if (!tool || tool.status !== 'ready') return <NotFoundPage />;

  const Icon = tool.icon;

  return (
    <div style={categoryVars(tool.category)} className="flex flex-col gap-4 py-6">
      {/* Araç ADI çevrilmiyor (teknik terim), açıklama çevriliyor. Başlığa
          kategori de giriyor: "Base64" tek başına arama sonucunda hangi siteye
          ait olduğunu söylemiyor. */}
      <Seo
        title={tool.name}
        description={t.seo.toolDescription(t.toolDescriptions[tool.id])}
        path={`/t/${tool.id}`}
        locale={locale}
      />

      {/* 44px başlık şeridi: ortalanmış dev başlık yok — araç adı, rozetler ve
          geri dönüş tek satırda. */}
      <header className="flex h-11 items-center gap-3">
        <Link
          to={path('/')}
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

      <Suspense fallback={<ToolSkeleton />}>
        <tool.component />
      </Suspense>
    </div>
  );
}
