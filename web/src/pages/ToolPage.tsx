import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { getTool } from '../tools/registry';
import { CATEGORY_LABELS } from '../tools/categories';

export default function ToolPage() {
  const { toolId } = useParams();
  const tool = getTool(toolId);

  if (!tool) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-bold">Tool not found</h1>
        <p className="text-slate-500">“{toolId}” is not in the registry.</p>
        <Link to="/" className="text-sky-500 hover:underline">
          Back to all tools
        </Link>
      </div>
    );
  }

  const ToolComponent = tool.component;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          {CATEGORY_LABELS[tool.category]}
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
        <p className="text-slate-500 dark:text-slate-400">{tool.description}</p>
      </header>

      <Suspense fallback={<p className="text-sm text-slate-500">Loading tool…</p>}>
        <ToolComponent />
      </Suspense>
    </div>
  );
}
