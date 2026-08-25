import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'fsdev.theme';

/**
 * İlk tema.
 *
 * Ön-render sırasında tarayıcı yok: `localStorage` ve `matchMedia`
 * tanımsızdır ve okumak render'ı düşürür. Sunucuda koyu tema varsayılıyor —
 * `index.html`'deki önyükleme script'i sayfa boyanmadan önce gerçek tercihi
 * uyguluyor, yani bu varsayım kullanıcıya hiç görünmüyor.
 */
function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Gizli sekmede localStorage erişimi hata verebiliyor.
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    // Token'lar .dark sınıfına bağlı (index.css); sınıfı html üzerinde tutuyoruz
    // ki body arka planı da ilk boyamada doğru gelsin.
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Yazamıyorsak tercih hatırlanmaz; tema yine de çalışır.
    }
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  };
}
