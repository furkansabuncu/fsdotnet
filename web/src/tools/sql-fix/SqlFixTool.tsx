import { useState } from 'react';
import { ArrowUp, RotateCcw } from 'lucide-react';
import ConverterShell from '../../shared/ConverterShell';
import { useI18n } from '../../i18n/I18nProvider';
import { ok, type ToolResult } from '../types';
import { analyze, applyFixes, fixableCount, type Finding } from './sqlFix';

/**
 * Örnekler SQL Server'dan Oracle'a taşınan tipik bir sorgu, Delphi'den
 * kopyalanmış bir string ifadesi ve yapıştırma hasarı. Tablo adları
 * uydurma — araç şema görmüyor, örneklerin de gerçek bir şemayı
 * anlatması gerekmiyor.
 */
const SAMPLES = {
  tsql: [
    'SELECT TOP 10 [ad], ISNULL(s.tutar, 0) AS tutar,',
    'FROM siparis AS s',
    'INNER JOIN kitap AS k ON k.kitap_id = s.kitap_id',
    'WHERE s.kanal_id = @kanal AND k.baslik = "Sessiz Ev"',
    'ORDER BY s.siparis_tarihi DESC;',
  ].join('\n'),

  delphi: [
    "'select k.baslik, k.fiyat from kitap k ' +",
    "'where k.tur_id = :tur and k.fiyat > :alt_sinir '",
  ].join('\n'),

  /* Kırılmaz boşluk ve akıllı tırnak kaçış dizisiyle yazılıyor: kaynak
     dosyaya olduğu gibi konsalar gözle ayırt edilemez ve bir sonraki
     düzenlemede sessizce kaybolurlardı. */
  paste: [
    'SQL> select ad, soyad from uye',
    '  2  where uye_id = 42 and ad = ‘Ali’;',
  ].join('\n'),
} as const;

type SampleKey = keyof typeof SAMPLES;

export default function SqlFixTool() {
  const { t } = useI18n();
  const [input, setInput] = useState<string>(SAMPLES.tsql);
  /** Kullanıcının kapattığı düzeltmeler; varsayılan hepsi açık. */
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());

  const analysis = analyze(input);
  const findings: Finding[] = analysis.ok ? analysis.value : [];
  const fixed = analysis.ok ? applyFixes(input, findings, excluded) : '';
  const result: ToolResult<string> = analysis.ok ? ok(fixed) : analysis;

  const fixable = fixableCount(findings);
  const changed = analysis.ok && fixed !== input;

  const load = (key: SampleKey) => {
    setInput(SAMPLES[key]);
    setExcluded(new Set());
  };

  const toggle = (id: string) => {
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <ConverterShell
        input={input}
        onInputChange={setInput}
        result={result}
        inputLabel={t.sqlFix.input}
        outputLabel={t.sqlFix.output}
        placeholder={t.sqlFix.placeholder}
        toolbar={
          <>
            {(['tsql', 'delphi', 'paste'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => load(key)}
                className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                {t.sqlFix.samples[key]}
              </button>
            ))}

            {analysis.ok && (
              <span
                className={`rounded px-2 py-1 font-mono text-[11px] ${
                  findings.length === 0 ? 'bg-success-bg text-success' : 'bg-cat-bg text-cat'
                }`}
              >
                {findings.length === 0 ? t.sqlFix.clean : t.sqlFix.count(findings.length, fixable)}
              </span>
            )}

            {/*
              Düzeltilmiş metni girdiye taşımak şart, süs değil: bazı
              düzeltmeler bir sonraki turda YENİ bulgular açıyor. Ana
              dilden yapıştırılmış bir string çözülmeden içindeki SQL
              hiç incelenemiyor.
            */}
            <button
              type="button"
              onClick={() => {
                setInput(fixed);
                setExcluded(new Set());
              }}
              disabled={!changed}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowUp size={12} aria-hidden="true" />
              {t.sqlFix.applyToInput}
            </button>

            <button
              type="button"
              onClick={() => load('tsql')}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <RotateCcw size={12} aria-hidden="true" />
              {t.sqlFix.reset}
            </button>
          </>
        }
      />

      {findings.length > 0 && (
        <section className="rounded-lg border border-border-subtle bg-surface p-3 shadow-elev-1">
          <h2 className="mb-2 text-[11px] font-medium tracking-wider text-subtle uppercase">
            {t.sqlFix.findingsTitle}
          </h2>

          <ul className="flex flex-col gap-1.5">
            {findings.map((finding) => {
              const rule = t.sqlFix.rules[finding.rule];
              const hasFix = finding.edits.length > 0;

              return (
                <li key={finding.id} className="flex items-start gap-2.5 rounded-md bg-surface-2 p-2.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      finding.severity === 'error'
                        ? 'bg-error-bg text-error'
                        : 'bg-warning-bg text-warning'
                    }`}
                  >
                    {finding.position}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-fg">
                      {rule.title}
                      {finding.detail !== undefined && (
                        /* Çevrilmez: girdiden gelen token ya da somut kod önerisi. */
                        <code className="ml-2 font-mono text-xs text-cat">{finding.detail}</code>
                      )}
                    </p>
                    <p className="text-xs leading-5 text-muted">{rule.hint}</p>
                  </div>

                  {hasFix ? (
                    <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={!excluded.has(finding.id)}
                        onChange={() => toggle(finding.id)}
                        className="size-3.5 accent-[var(--cat)]"
                      />
                      {t.sqlFix.apply}
                    </label>
                  ) : (
                    <span className="shrink-0 text-xs text-subtle">{t.sqlFix.manual}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
