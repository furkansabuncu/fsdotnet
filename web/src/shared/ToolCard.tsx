import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import { useI18n, useLocalePath } from '../i18n/I18nProvider';
import { categoryVars } from '../tools/categories';
import type { ToolDefinition } from '../tools/types';

/**
 * İmleç konumunu CSS değişkeni olarak yazar.
 *
 * State kullanılmıyor: her fare hareketinde React render'ı tetiklemek 60fps'te
 * ızgara boyunca pahalı olurdu. Işığın kendisi tamamen CSS (.spotlight::after),
 * burada sadece iki sayı güncelleniyor.
 */
function trackPointer(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

/**
 * Ana sayfa ızgarasının kartı.
 *
 * Anatomi bilinçli olarak dar: ikon çipi + tek satır başlık + kırpılmış tek
 * satır açıklama. İki satırlık paragraf yok — kartlar aynı yükseklikte kalınca
 * ızgara taranabilir oluyor, açıklama zaten ikincil bilgi.
 *
 * Kategori rengi `categoryVars` ile --cat / --cat-bg olarak kökten geçilir;
 * içerideki `bg-cat-bg`, `text-cat`, `border-cat` bunları okur. Bu yüzden
 * burada tek bir renk seçimi yapılmaz, altı kategori tek kod yolunu paylaşır.
 */
export default function ToolCard({ tool }: { tool: ToolDefinition }) {
  const { t } = useI18n();
  const path = useLocalePath();
  const Icon = tool.icon;
  const ready = tool.status === 'ready';
  const hasBadge = tool.runtime === 'server' || !ready;

  /**
   * `isolate` şart: ışık ve şerit -z-10 / ::after ile konumlanıyor. Kök kendi
   * stacking context'ini kurmazsa negatif z-index kartın opak zemininin
   * ARKASINA düşer ve efekt hiç görünmez.
   */
  const rootClass = [
    'group relative isolate flex min-w-0 flex-col gap-2',
    'rounded-lg border border-border-subtle bg-surface p-3 pl-3.5',
    'shadow-elev-1 transition-all duration-150',
    ready
      ? 'spotlight hover:-translate-y-px hover:border-cat hover:shadow-elev-2 focus-visible:-translate-y-px focus-visible:border-cat focus-visible:shadow-elev-2'
      : 'cursor-not-allowed opacity-60',
  ].join(' ');

  const content = (
    <>
      {/* Sol şerit yalnızca gidilebilir kartta — 'soon' kartın tıklanabilir
          görünmesi yanlış vaat olur. */}
      {ready && (
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-cat opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      )}

      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-cat-bg transition-transform duration-150 group-hover:scale-105"
        >
          <Icon size={18} className="text-cat" />
        </span>

        {/* min-w-0 olmadan flex öğesi içeriğinin altına inemez, truncate ölür. */}
        <span className="min-w-0 truncate text-sm font-medium text-fg">{tool.name}</span>

        {hasBadge && (
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {tool.runtime === 'server' && (
              <span className="rounded bg-info-bg px-1.5 py-0.5 font-mono text-[10px] leading-4 tracking-wide text-info uppercase">
                {t.card.api}
              </span>
            )}
            {!ready && (
              <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] leading-4 tracking-wide text-subtle uppercase">
                {t.card.soon}
              </span>
            )}
          </span>
        )}
      </div>

      <p className="truncate text-xs text-muted">{t.toolDescriptions[tool.id]}</p>
    </>
  );

  /* 'soon' kartı gidilemez → <a> değil <div>. aria-disabled yazılmıyor: role'süz
     bir div'de desteklenmeyen öznitelik, ekran okuyucu yok sayar (axe uyarır);
     durumu zaten görünür "Soon" rozetinin metni taşıyor. */
  if (!ready) {
    return (
      <div style={categoryVars(tool.category)} className={rootClass}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={path(`/t/${tool.id}`)}
      style={categoryVars(tool.category)}
      className={rootClass}
      onMouseMove={trackPointer}
    >
      {content}
    </Link>
  );
}
