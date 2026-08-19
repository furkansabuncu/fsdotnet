import { Link, Route, Routes } from 'react-router';
import CommandPalette from './shared/CommandPalette';
import HomePage from './pages/HomePage';
import ToolPage from './pages/ToolPage';

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 py-6">
      <nav className="mb-8 flex items-center justify-between">
        <Link to="/" className="font-mono text-lg font-bold tracking-tight">
          fs<span className="text-sky-500">box</span>
        </Link>
        <a
          href="https://github.com/furkansabuncu/fsbox"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-slate-500 hover:text-sky-500"
        >
          GitHub
        </a>
      </nav>

      <main className="flex-1">
        {/* Route'lar registry'den değil sabit: araç sayfası tek bir dinamik route. */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/t/:toolId" element={<ToolPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <CommandPalette />

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800">
        MIT licensed · Built by Furkan Sabuncu
      </footer>
    </div>
  );
}
