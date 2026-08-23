import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import type { ToolDefinition } from '../tools/types';
import { useI18n } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import { searchTools, toolsByCategory } from '../tools/registry';
import { commandPalette, useCommandPaletteOpen } from './useCommandPalette';

/**
 * Ctrl/Cmd+K ile açılan araç seçici. Bu tür sitelerin günlük kullanımını
 * mümkün kılan tek özellik budur; araç sayısı arttıkça grid'de aramak biter.
 *
 * Açık/kapalı durumu burada DEĞİL, useCommandPalette store'unda tutulur —
 * paleti Header'daki arama düğmesi de açıyor. Global Ctrl+K dinleyicisi ise
 * burada kalır: palet App'te koşulsuz mount edildiği için bu component
 * kısayolun tek sahibi olabiliyor.
 */
export default function CommandPalette() {
  const { t } = useI18n();
  const open = useCommandPaletteOpen();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Bir arama kısayolu olduğu için input/textarea içindeyken de çalışmalı.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        commandPalette.toggle();
      }
      if (event.key === 'Escape') commandPalette.close();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [open]);

  // Palet açıkken arkadaki sayfa kaymasın.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Seçili satır görünür alanın dışına çıktıysa geri getir. Satırı ref
  // tutmak yerine data attribute'undan buluyoruz: liste her aramada
  // baştan kuruluyor, ref dizisini senkron tutmak fazladan iş.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, query]);

  if (!open) return null;

  const results = searchTools(query);
  const groups = toolsByCategory(results);

  // Klavye gezinmesi düzleştirilmiş liste üzerinde çalışır; gruplar sadece
  // görsel. Her grubun ilk satırının düz indeksini önden hesaplıyoruz.
  let cursor = 0;
  const sections = groups.map((group) => {
    const offset = cursor;
    cursor += group.tools.length;
    return { ...group, offset };
  });
  const flat = groups.flatMap((group) => group.tools);

  function openTool(tool: ToolDefinition) {
    if (tool.status === 'soon') return;
    commandPalette.close();
    navigate(`/t/${tool.id}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (flat.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = flat[activeIndex];
      if (selected) openTool(selected);
    }
  }

  return (
    <>
      {/* Tıklanabilir yüzey div değil button: klavyeyle erişilebilsin ve
          ekran okuyucuda adı olsun. Kapatmanın asıl yolu Escape. */}
      <button
        type="button"
        aria-label={t.palette.closeAria}
        onClick={() => commandPalette.close()}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.palette.dialogAria}
        onKeyDown={onKeyDown}
        className="fixed top-[15vh] left-1/2 z-50 w-[640px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
      >
        <div className="flex h-12 items-center gap-2.5 border-b border-border-subtle px-3">
          <Search className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-autocomplete="list"
            aria-activedescendant={flat[activeIndex] ? `command-palette-row-${activeIndex}` : undefined}
            placeholder={t.palette.placeholder}
            className="h-full flex-1 bg-transparent text-base text-fg outline-none placeholder:text-subtle"
          />
          <kbd className="shrink-0 rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-subtle">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          aria-label={t.palette.listAria}
          className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
        >
          {flat.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted">{t.palette.noResults}</p>
              <p className="mt-1 text-xs text-subtle">{t.palette.noResultsHint}</p>
            </div>
          ) : (
            sections.map((section) => (
              // role="group": listbox'ın çocukları option ya da group olmalı,
              // düz div sahiplik zincirini kırar.
              <div
                key={section.category}
                role="group"
                aria-label={t.categories[section.category].label}
              >
                {/* Grup zaten aria-label taşıyor; başlık iki kez okunmasın. */}
                <div
                  aria-hidden="true"
                  className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider text-subtle uppercase"
                >
                  {t.categories[section.category].label}
                </div>
                {section.tools.map((tool, indexInGroup) => {
                  const index = section.offset + indexInGroup;
                  const selected = index === activeIndex;
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      role="option"
                      id={`command-palette-row-${index}`}
                      data-row={index}
                      aria-selected={selected}
                      aria-disabled={tool.status === 'soon'}
                      style={categoryVars(tool.category)}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => openTool(tool)}
                      className={`relative flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left ${
                        selected ? 'bg-surface-3' : ''
                      } ${tool.status === 'soon' ? 'cursor-default' : ''}`}
                    >
                      {selected && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-cat"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0 text-cat" aria-hidden="true" />
                      <span className="shrink-0 text-sm text-fg">{tool.name}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-subtle">
                        {t.toolDescriptions[tool.id]}
                      </span>
                      {/* Dolgu yerine kenarlık: seçili satırın zemini de
                          surface-3, dolgulu çip orada kaybolurdu. */}
                      {tool.status === 'soon' ? (
                        <span className="shrink-0 rounded border border-border-strong px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-subtle uppercase">
                          {t.card.soon}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[11px] text-subtle">
                          {t.categories[tool.category].label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex h-8 items-center gap-4 border-t border-border-subtle px-3 font-mono text-[11px] text-subtle">
          <span>
            <span className="text-muted">↑↓</span> {t.palette.navigate}
          </span>
          <span>
            <span className="text-muted">↵</span> {t.palette.open}
          </span>
          <span>
            <span className="text-muted">esc</span> {t.palette.close}
          </span>
          <span className="ml-auto">
            {t.palette.count(results.length)}
          </span>
        </div>
      </div>
    </>
  );
}
