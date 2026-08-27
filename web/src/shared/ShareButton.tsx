import { useEffect, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { MAX_LINK, encodeState, withState } from './shareLink';

/**
 * Aracın o anki girdisini taşıyan bağlantıyı panoya kopyalar.
 *
 * Kodlama asenkron (`CompressionStream` bir akış), o yüzden bağlantı
 * tıklama anında değil girdi değiştikçe hazırlanıyor — tıklamayla kopyalama
 * arasında `await` olsaydı bazı tarayıcılar pano erişimini kullanıcı
 * hareketiyle ilişkilendiremeyip reddederdi.
 */
export default function ShareButton({ value }: { value: string }) {
  const { t } = useI18n();
  /* Üretilen bağlantı, ÜRETİLDİĞİ girdiyle birlikte tutuluyor. Kodlama
     asenkron olduğu için girdi bu arada değişmiş olabilir; kaynağı
     karşılaştırmadan saklamak, eski girdiye ait bir bağlantının yeni
     girdiye aitmiş gibi kopyalanmasına yol açardı. */
  const [encoded, setEncoded] = useState<{ source: string; href: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (value === '') return;

    let current = true;
    void encodeState(value).then((payload) => {
      if (!current) return;
      const href = withState(window.location.href, payload);
      // Taşınmayacak kadar uzunsa bağlantı YOK: çalışmayan bir link vermek,
      // hiç vermemekten kötü.
      setEncoded({ source: value, href: href.length > MAX_LINK ? '' : href });
    });

    return () => {
      current = false;
    };
  }, [value]);

  const link = encoded?.source === value && encoded.href !== '' ? encoded.href : null;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const disabled = link === null;

  return (
    <button
      type="button"
      disabled={disabled}
      title={value !== '' && disabled ? t.share.tooLong : t.share.label}
      onClick={() => {
        if (link === null) return;
        navigator.clipboard.writeText(link).then(
          () => setCopied(true),
          // Pano reddedilirse onay göstermemek, yanlış geri bildirimden iyi.
          () => setCopied(false),
        );
      }}
      className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40"
    >
      {copied ? (
        <Check size={12} aria-hidden="true" className="text-success" />
      ) : (
        <Link2 size={12} aria-hidden="true" />
      )}
      {copied ? t.share.copied : t.share.label}
    </button>
  );
}
