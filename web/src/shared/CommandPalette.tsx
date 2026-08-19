import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { searchTools } from '../tools/registry';

/**
 * Ctrl/Cmd+K ile açılan araç seçici. Bu tür sitelerin günlük kullanımını
 * mümkün kılan tek özellik budur; araç sayısı arttıkça grid'de aramak biter.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const matches = searchTools(query).slice(0, 8);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  function go(id: string) {
    setOpen(false);
    navigate(`/t/${id}`);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(matches.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + matches.length) % Math.max(matches.length, 1));
    } else if (event.key === 'Enter') {
      const selected = matches[activeIndex];
      if (selected) go(selected.id);
    }
  }

  return (
    <div
      role="presentation"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-[12vh]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder="Search tools…"
          className="w-full border-b border-slate-700 bg-transparent px-4 py-3 text-slate-100 outline-none"
        />
        <ul className="max-h-80 overflow-auto py-1">
          {matches.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No tools match “{query}”.</li>
          ) : (
            matches.map((tool, index) => (
              <li key={tool.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(tool.id)}
                  className={`flex w-full flex-col items-start px-4 py-2 text-left ${
                    index === activeIndex ? 'bg-sky-600/20' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-slate-100">{tool.name}</span>
                  <span className="text-xs text-slate-400">{tool.description}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
