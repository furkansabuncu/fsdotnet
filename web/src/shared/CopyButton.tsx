import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

interface CopyButtonProps {
  value: string;
  /** Erişilebilir adı ezmek için; verilmezse sözlükteki varsayılan kullanılır. */
  label?: string;
}

export default function CopyButton({ value, label }: CopyButtonProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    // İzin reddedilirse veya güvensiz bağlamda çalışıyorsa clipboard reddeder;
    // kopyalanmadıysa onay göstermemek yanlış geri bildirimden iyidir.
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      aria-label={copied ? t.shell.copied : (label ?? t.shell.copy)}
      className="flex size-6 items-center justify-center rounded text-subtle transition-colors hover:bg-surface-3 hover:text-fg disabled:pointer-events-none disabled:opacity-40"
    >
      {copied ? (
        <Check size={14} className="text-success" aria-hidden="true" />
      ) : (
        <Copy size={14} aria-hidden="true" />
      )}
    </button>
  );
}
