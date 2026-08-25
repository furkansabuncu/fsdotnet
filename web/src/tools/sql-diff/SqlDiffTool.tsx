import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { formatSql } from '../sql-format/sqlFormat';
import { MAX_LINES, diffLines, type DiffRow } from './diff';

const SAMPLE_BEFORE = [
  'create or replace view vw_rapor as',
  'select r.rapor_id,',
  '       r.hasta_id,',
  '       r.rapor_tarihi',
  '  from txhastarapor r',
  ' where r.grup_id = 5029',
].join('\n');

const SAMPLE_AFTER = [
  'create or replace view vw_rapor as',
  'select r.rapor_id,',
  '       r.hasta_id,',
  '       r.rapor_tarihi,',
  '       r.aciklama',
  '  from txhastarapor r',
  ' where r.grup_id = 6000',
  '   and nvl(r.iptal, 0) = 0',
].join('\n');

const ROW_TONE: Record<DiffRow['op'], string> = {
  equal: '',
  insert: 'bg-success-bg',
  delete: 'bg-error-bg',
};

const MARKER: Record<DiffRow['op'], string> = { equal: ' ', insert: '+', delete: '-' };

/** Satır içi vurgu varsa parça parça, yoksa düz metin. */
function LineText({ row }: { row: DiffRow }) {
  if (!row.parts) return <>{row.text}</>;

  return (
    <>
      {/* oxlint-disable-next-line react/no-array-index-key -- parçaların
          indeks dışında kimliği yok; aynı kelime bir satırda tekrar edebilir
          ve liste zaten satırla birlikte bütün olarak yeniden kuruluyor. */}
      {row.parts.map((part, index) => (
        <span
          key={index}
          className={
            part.changed
              ? row.op === 'insert'
                ? 'rounded-sm bg-success/25 text-fg'
                : 'rounded-sm bg-error/25 text-fg'
              : ''
          }
        >
          {part.text}
        </span>
      ))}
    </>
  );
}

export default function SqlDiffTool() {
  const { t } = useI18n();
  const [before, setBefore] = useState(SAMPLE_BEFORE);
  const [after, setAfter] = useState(SAMPLE_AFTER);
  const [normalize, setNormalize] = useState(false);

  /**
   * Biçimlendirerek karşılaştırma, bu aracın SQL'e özel tarafı: yalnızca
   * girintisi değişmiş bir view düz diff'te baştan sona farklı görünür.
   * Biçimlendirme başarısız olursa ham metne düşülür — diff yine çalışsın.
   */
  const prepare = (sql: string) => {
    if (!normalize) return sql;
    const formatted = formatSql(sql, { dialect: 'plsql', keywordCase: 'upper' });
    return formatted.ok ? formatted.value : sql;
  };

  const summary = diffLines(prepare(before), prepare(after));
  const identical = summary.added === 0 && summary.removed === 0;

  const pane =
    'min-h-40 w-full resize-y rounded-lg border border-border-subtle bg-surface p-3 font-mono text-sm leading-6 text-fg shadow-elev-1 outline-none placeholder:text-subtle focus-visible:border-cat';

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.sqlDiff.before}
          </span>
          <textarea
            value={before}
            onChange={(event) => setBefore(event.target.value)}
            placeholder={t.sqlDiff.placeholderBefore}
            spellCheck={false}
            className={pane}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.sqlDiff.after}
          </span>
          <textarea
            value={after}
            onChange={(event) => setAfter(event.target.value)}
            placeholder={t.sqlDiff.placeholderAfter}
            spellCheck={false}
            className={pane}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={normalize}
            onChange={(event) => setNormalize(event.target.checked)}
            className="size-3.5 accent-[var(--cat)]"
          />
          {t.sqlDiff.normalize}
          <span className="text-subtle">{t.sqlDiff.normalizeHint}</span>
        </label>

        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px]">
          <span className="rounded bg-success-bg px-2 py-1 text-success">
            +{summary.added} {t.sqlDiff.added}
          </span>
          <span className="rounded bg-error-bg px-2 py-1 text-error">
            −{summary.removed} {t.sqlDiff.removed}
          </span>
          <span className="rounded bg-surface-2 px-2 py-1 text-subtle">
            {summary.unchanged} {t.sqlDiff.unchanged}
          </span>
        </span>

        <button
          type="button"
          onClick={() => {
            setBefore(SAMPLE_BEFORE);
            setAfter(SAMPLE_AFTER);
          }}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <RotateCcw size={12} aria-hidden="true" />
          {t.sqlDiff.example}
        </button>
      </div>

      {summary.truncated && (
        <p className="rounded bg-warning-bg p-2 text-xs text-warning">{t.sqlDiff.truncated(MAX_LINES)}</p>
      )}

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
        {identical ? (
          <p className="p-8 text-center text-sm text-muted">{t.sqlDiff.identical}</p>
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <tbody>
                {/* İndeks yerine kararlı anahtar: aynı metin birden çok
                    satırda geçebilir, ama (op, sol no, sağ no) üçlüsü tekil. */}
                {summary.rows.map((row) => (
                  <tr key={`${row.op}-${row.left}-${row.right}`} className={ROW_TONE[row.op]}>
                    {/* Satır numaraları seçilemez: diff'i kopyalarken
                        numaraların da gelmesi işe yaramaz. */}
                    <td className="w-12 border-r border-border-subtle px-2 py-0.5 text-right text-subtle select-none">
                      {row.left ?? ''}
                    </td>
                    <td className="w-12 border-r border-border-subtle px-2 py-0.5 text-right text-subtle select-none">
                      {row.right ?? ''}
                    </td>
                    <td className="w-5 px-1 py-0.5 text-center text-subtle select-none">
                      {MARKER[row.op]}
                    </td>
                    <td className="py-0.5 pr-3 whitespace-pre-wrap text-fg">
                      <LineText row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
