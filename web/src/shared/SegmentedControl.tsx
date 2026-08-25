interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Görünür etiketi olmayan bir grup; ekran okuyucu için ad zorunlu. */
  ariaLabel: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
}

/**
 * İki-üç seçenekli mod anahtarı.
 *
 * Açılır menü yerine segment: seçenekler az ve hepsi tek bakışta görünmeli.
 * `aria-pressed` kullanılıyor (radio değil) — bunlar bir formu doldurmuyor,
 * bir görünümü açıp kapatıyor.
 */
export default function SegmentedControl<T extends string>({
  ariaLabel,
  value,
  onChange,
  options,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex shrink-0 rounded-md border border-border-subtle bg-surface-2 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          /* Aktif segment kategori rengini alır; --cat renkleri parlak olduğu
             için üstüne sayfa zemini rengi okunaklı düşüyor. */
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            value === option.value ? 'bg-cat text-bg' : 'text-muted hover:text-fg'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
