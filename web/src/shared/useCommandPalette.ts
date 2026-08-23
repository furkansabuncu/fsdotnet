import { useSyncExternalStore } from 'react';

/**
 * Komut paletinin açık/kapalı durumu.
 *
 * Modül seviyesinde tutuluyor çünkü paleti hem global Ctrl+K dinleyicisi hem
 * de Header'daki arama düğmesi açıyor; ikisi ortak bir React ağacı paylaşmıyor.
 * Bunun için Context sağlayıcısı kurmak veya state kütüphanesi eklemek tek bir
 * boolean için fazla ağır.
 */
let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const commandPalette = {
  open: () => {
    if (!open) {
      open = true;
      emit();
    }
  },
  close: () => {
    if (open) {
      open = false;
      emit();
    }
  },
  toggle: () => {
    open = !open;
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCommandPaletteOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
