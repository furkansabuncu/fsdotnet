import { Link } from 'react-router';
import { CATEGORY_LABELS } from '../tools/categories';
import { TOOLS, toolsByCategory } from '../tools/registry';

export default function HomePage() {
  const groups = toolsByCategory();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Developer tools for the .NET ecosystem</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          {TOOLS.length} tool{TOOLS.length === 1 ? '' : 's'} and counting. Everything runs in your browser unless a real
          parser or compiler is required — your tokens, secrets and payloads never leave this tab.
        </p>
        <p className="text-sm text-slate-500">
          Press <kbd className="rounded border border-slate-600 px-1.5 py-0.5 font-mono text-xs">Ctrl</kbd>
          <span className="mx-1">+</span>
          <kbd className="rounded border border-slate-600 px-1.5 py-0.5 font-mono text-xs">K</kbd> to search.
        </p>
      </header>

      {groups.map(({ category, tools }) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            {CATEGORY_LABELS[category]}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <li key={tool.id}>
                <Link
                  to={`/t/${tool.id}`}
                  className="flex h-full flex-col gap-1 rounded-lg border border-slate-200 p-4 transition hover:border-sky-500 dark:border-slate-800 dark:hover:border-sky-500"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {tool.name}
                    {tool.runtime === 'server' ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
                        API
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
