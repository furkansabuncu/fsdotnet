import { useEffect, useId, useState } from 'react';
import { Info, ServerOff, TriangleAlert } from 'lucide-react';
import SegmentedControl from '../../shared/SegmentedControl';
import { useI18n } from '../../i18n/I18nProvider';
import { isApiConfigured } from '../../services/api';
import type { ToolErrorKey, ToolResult } from '../types';
import { runDotnetRegex } from './dotnetRegex';
import {
  EMPTY_FLAGS,
  analyzeFlavour,
  replacePreview,
  runJsRegex,
  type RegexFlags,
  type RegexMatch,
} from './regex';

type Engine = 'js' | 'dotnet';

interface EngineOutput {
  matches: RegexMatch[];
  truncated: boolean;
  error: ToolErrorKey | null;
  detail: string | null;
}

const SAMPLE_PATTERN = String.raw`(?<kod>[A-Z]{3})-(?<yil>\d{4})/(?<sira>\d+)`;
const SAMPLE_INPUT = `RAD-2026/91 kabul edildi
PAT-2026/104 beklemede
xx-2026/7 hatalı satır`;

const FLAG_KEYS = ['ignoreCase', 'multiline', 'dotAll', 'unicode', 'cultureInvariant'] as const;

function toOutput(result: ToolResult<{ matches: RegexMatch[]; truncated: boolean }>): EngineOutput {
  if (result.ok) {
    return { matches: result.value.matches, truncated: result.value.truncated, error: null, detail: null };
  }
  return { matches: [], truncated: false, error: result.error, detail: result.detail ?? null };
}

/**
 * Eşleşen aralıkları işaretleyerek girdiyi parçalara böler.
 *
 * Her parça başlangıç konumunu taşıyor: React anahtarı olarak dizi indisi
 * yerine bunu kullanmak, eşleşmeler değiştiğinde yanlış düğümün yeniden
 * kullanılmasını engelliyor.
 */
function highlight(input: string, matches: RegexMatch[]): { at: number; text: string; hit: boolean }[] {
  const parts: { at: number; text: string; hit: boolean }[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.index > cursor) parts.push({ at: cursor, text: input.slice(cursor, match.index), hit: false });
    // Sıfır uzunluklu eşleşme gösterilemez; imleci de ilerletmez.
    if (match.length > 0) parts.push({ at: match.index, text: match.value, hit: true });
    cursor = Math.max(cursor, match.index + match.length);
  }

  if (cursor < input.length) parts.push({ at: cursor, text: input.slice(cursor), hit: false });
  return parts;
}

/** İstek kimliği: aynı girdi için aynı, değişince farklı. */
function requestKey(pattern: string, flags: RegexFlags, input: string): string {
  return JSON.stringify([pattern, flags, input]);
}

export default function RegexTool() {
  const { t } = useI18n();
  const patternId = useId();
  const inputId = useId();
  const replaceId = useId();

  const [engine, setEngine] = useState<Engine>('js');
  const [pattern, setPattern] = useState(SAMPLE_PATTERN);
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [replacement, setReplacement] = useState('');
  const [flags, setFlags] = useState<RegexFlags>({ ...EMPTY_FLAGS });
  /* Sonuç, hangi isteğe ait olduğuyla birlikte saklanıyor. Ayrı bir
     `pending` state'i tutmak effect içinde senkron setState demekti — bu da
     her tuş vuruşunda fazladan bir render turu başlatıyordu. Anahtarı
     karşılaştırmak aynı bilgiyi türetiyor, bedelsiz. */
  const [dotnet, setDotnet] = useState<{ key: string; output: EngineOutput } | null>(null);

  const js = toOutput(runJsRegex(pattern, flags, input));
  const notes = analyzeFlavour(pattern, flags);
  const currentKey = requestKey(pattern, flags, input);

  /*
   * .NET motoru ağ üzerinden: sonucu render sırasında türetmek mümkün değil.
   * `cancelled` bayrağı hızlı yazarken geç dönen cevabın yenisini ezmesini
   * engelliyor.
   */
  useEffect(() => {
    if (engine !== 'dotnet') return;

    let cancelled = false;
    void runDotnetRegex(pattern, flags, input).then((result) => {
      if (!cancelled) setDotnet({ key: requestKey(pattern, flags, input), output: toOutput(result) });
    });

    return () => {
      cancelled = true;
    };
  }, [engine, pattern, flags, input]);

  /* .NET motoru seçili ama sunucu yoksa JS sonucunu göstermeye devam
     ediyoruz — boş ekran vermek kullanıcıyı hiçbir yere götürmez. */
  const fresh = engine === 'dotnet' && dotnet?.key === currentKey ? dotnet.output : null;
  const pending = engine === 'dotnet' && fresh === null;
  const serverDown = fresh?.error === 'regexServerDown';
  const active = fresh && !serverDown ? fresh : js;
  const replaced = replacement === '' ? null : replacePreview(pattern, flags, input, replacement);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel={t.regex.engineAria}
          value={engine}
          onChange={setEngine}
          options={[
            { value: 'js', label: t.regex.javascript },
            { value: 'dotnet', label: t.regex.dotnet },
          ]}
        />

        {FLAG_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={flags[key]}
              onChange={(event) => setFlags((current) => ({ ...current, [key]: event.target.checked }))}
              className="size-3.5 accent-[var(--cat)]"
            />
            <span className="font-mono">{t.regex.flags[key]}</span>
          </label>
        ))}

        <span className="rounded bg-cat-bg px-2 py-1 font-mono text-[11px] text-cat">
          {pending ? t.regex.running : t.regex.matchCount(active.matches.length)}
        </span>

        {active.truncated && (
          <span className="rounded bg-warning-bg px-2 py-1 font-mono text-[11px] text-warning">
            {t.regex.truncated}
          </span>
        )}
      </div>

      {engine === 'dotnet' && serverDown && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-bg px-3 py-2 text-sm text-warning">
          <ServerOff size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            {isApiConfigured ? t.regex.serverUnreachable : t.regex.serverNotConfigured}
            <span className="mt-0.5 block text-xs opacity-80">{t.regex.fallbackToJs}</span>
          </span>
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
            <div className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3">
              <label htmlFor={patternId} className="text-[11px] font-medium tracking-wider text-subtle uppercase">
                {t.regex.pattern}
              </label>
            </div>
            <input
              id={patternId}
              type="text"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder={t.regex.patternPlaceholder}
              spellCheck={false}
              aria-invalid={active.error !== null}
              className="w-full bg-transparent p-3 font-mono text-sm text-fg outline-none placeholder:text-subtle"
            />
            {active.error && active.error !== 'regexServerDown' && (
              <p className="border-t border-border-subtle bg-error-bg px-3 py-2 text-xs text-error">
                {t.errors[active.error]}
                {active.detail ? <span className="block font-mono opacity-80">{active.detail}</span> : null}
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
            <div className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3">
              <label htmlFor={inputId} className="text-[11px] font-medium tracking-wider text-subtle uppercase">
                {t.regex.testString}
              </label>
            </div>
            <textarea
              id={inputId}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
              className="min-h-[160px] w-full resize-y bg-transparent p-3 font-mono text-sm leading-6 text-fg outline-none"
            />
            <div className="border-t border-border-subtle bg-surface-2 px-3 py-2">
              <p className="font-mono text-sm leading-6 break-all whitespace-pre-wrap text-muted">
                {highlight(input, active.matches).map((part) =>
                  part.hit ? (
                    <mark key={part.at} className="rounded-sm bg-cat-bg px-0.5 text-cat">
                      {part.text}
                    </mark>
                  ) : (
                    <span key={part.at}>{part.text}</span>
                  ),
                )}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
            <div className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3">
              <label htmlFor={replaceId} className="text-[11px] font-medium tracking-wider text-subtle uppercase">
                {t.regex.replacement}
              </label>
            </div>
            <input
              id={replaceId}
              type="text"
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
              placeholder={t.regex.replacementPlaceholder}
              spellCheck={false}
              className="w-full bg-transparent p-3 font-mono text-sm text-fg outline-none placeholder:text-subtle"
            />
            {replaced?.ok && (
              <pre className="border-t border-border-subtle bg-surface-2 px-3 py-2 font-mono text-sm leading-6 break-all whitespace-pre-wrap text-fg">
                {replaced.value}
              </pre>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
            <h2 className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3 text-[11px] font-medium tracking-wider text-subtle uppercase">
              {t.regex.matches}
            </h2>
            {active.matches.length === 0 ? (
              <p className="px-3 py-4 text-sm text-subtle">{t.regex.noMatches}</p>
            ) : (
              <ol className="max-h-[420px] divide-y divide-border-subtle overflow-y-auto">
                {active.matches.map((match) => (
                  <li key={`${match.index}-${match.value}`} className="px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[11px] text-subtle">@{match.index}</span>
                      <span className="font-mono text-sm break-all text-fg">{match.value || '∅'}</span>
                    </div>
                    {match.groups.length > 0 && (
                      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                        {match.groups.map((group) => (
                          <div key={group.name} className="contents">
                            <dt className="font-mono text-[11px] text-cat">{group.name}</dt>
                            <dd className="font-mono text-[11px] break-all text-muted">
                              {group.value === null ? (
                                <span className="text-subtle italic">{t.regex.noCapture}</span>
                              ) : (
                                group.value
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {notes.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
              <h2 className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3 text-[11px] font-medium tracking-wider text-subtle uppercase">
                {t.regex.flavourTitle}
              </h2>
              <ul className="divide-y divide-border-subtle">
                {notes.map((note) => (
                  <li key={note.key} className="flex items-start gap-2 px-3 py-2 text-xs">
                    {note.side === 'dotnetOnly' ? (
                      <TriangleAlert size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
                    ) : (
                      <Info size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-subtle" />
                    )}
                    <span className="text-muted">
                      <code className="mr-1.5 rounded bg-surface-3 px-1 py-0.5 font-mono text-[11px] text-fg">
                        {note.sample}
                      </code>
                      {t.regex.notes[note.key]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
