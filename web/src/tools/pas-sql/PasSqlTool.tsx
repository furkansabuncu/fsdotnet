import { useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import CopyButton from '../../shared/CopyButton';
import { useI18n } from '../../i18n/I18nProvider';
import { extractSql } from './pasSql';

/**
 * Örnek, tipik bir VCL event handler'ı: sorgu satır satır birleştirilmiş,
 * bir bağlama değişkeni ve bir de enterpolasyon var. Birim adları uydurma.
 */
const SAMPLE = [
  'procedure TfrmSiparis.btnListeleClick(Sender: TObject);',
  'begin',
  '  qrySiparis.Close;',
  '  qrySiparis.SQL.Text :=',
  "    'select s.siparis_id, s.siparis_tarihi, k.baslik ' +",
  "    'from siparis s ' +",
  "    'join kitap k on k.kitap_id = s.kitap_id ' +",
  "    'where s.kanal_id = :kanal_id ' +",
  "    'and s.iptal = 0' +",
  "    'order by s.siparis_tarihi desc';",
  '',
  "  qrySiparis.ParamByName('kanal_id').AsInteger := FKanalId;",
  '  qrySiparis.Open;',
  '',
  "  lblOzet.Caption := 'Toplam: ' + IntToStr(qrySiparis.RecordCount);",
  'end;',
].join('\n');

export default function PasSqlTool() {
  const { t } = useI18n();
  const [input, setInput] = useState(SAMPLE);

  const result = extractSql(input);
  const blocks = result.ok ? result.value : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <RotateCcw size={12} aria-hidden="true" />
          {t.pasSql.sample}
        </button>

        <span
          className={`rounded px-2 py-1 font-mono text-[11px] ${
            result.ok ? 'bg-cat-bg text-cat' : 'bg-surface-2 text-subtle'
          }`}
        >
          {result.ok ? t.pasSql.count(blocks.length) : t.errors[result.error]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1">
          <div className="flex h-8 items-center border-b border-border-subtle bg-surface-2 px-3">
            <label
              htmlFor="pas-source"
              className="text-[11px] font-medium tracking-wider text-subtle uppercase"
            >
              {t.pasSql.input}
            </label>
          </div>

          <textarea
            id="pas-source"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t.pasSql.placeholder}
            spellCheck={false}
            className="min-h-[420px] flex-1 resize-none bg-transparent p-3 font-mono text-sm leading-6 text-fg outline-none placeholder:text-subtle"
          />
        </section>

        <div className="flex min-w-0 flex-col gap-3">
          {blocks.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-surface p-8 text-center text-sm text-muted">
              {t.pasSql.empty}
            </p>
          ) : (
            blocks.map((block) => (
              <section
                key={`${block.lines}:${block.sql.slice(0, 40)}`}
                className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-elev-1"
              >
                <div className="flex h-8 items-center gap-2 border-b border-border-subtle bg-surface-2 px-3">
                  {/* Satır numarası ve sahip çevrilmez — kaynaktan geliyorlar. */}
                  <code className="font-mono text-[11px] text-cat">{block.lines}</code>
                  {block.owner !== null && (
                    <code className="truncate font-mono text-[11px] text-subtle">{block.owner}</code>
                  )}
                  <span className="ml-auto">
                    <CopyButton value={block.sql} />
                  </span>
                </div>

                <pre className="overflow-x-auto p-3 font-mono text-sm leading-6 whitespace-pre-wrap text-fg">
                  {block.sql}
                </pre>

                {(block.binds.length > 0 || block.interpolations.length > 0) && (
                  <div className="flex flex-col gap-1.5 border-t border-border-subtle bg-surface-2 px-3 py-2">
                    {block.binds.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-subtle">
                        {t.pasSql.binds}
                        {block.binds.map((bind) => (
                          <code key={bind} className="rounded bg-surface px-1.5 py-0.5 font-mono text-cat">
                            :{bind}
                          </code>
                        ))}
                      </p>
                    )}

                    {/* Enterpolasyon ayrı ve UYARI tonunda: bağlama değişkeni
                        değil, metne gömülen değer — enjeksiyon kapısı. */}
                    {block.interpolations.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-warning">
                        <AlertTriangle size={12} aria-hidden="true" />
                        {t.pasSql.interpolations}
                        {block.interpolations.map((piece) => (
                          <code key={piece} className="rounded bg-warning-bg px-1.5 py-0.5 font-mono">
                            {piece}
                          </code>
                        ))}
                      </p>
                    )}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
