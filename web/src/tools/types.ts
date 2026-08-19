import type { ComponentType, LazyExoticComponent } from 'react';

export type ToolCategory = 'converters' | 'formatters' | 'security' | 'testing' | 'web';

/**
 * Aracın nerede çalıştığı.
 *
 * 'client' varsayılandır: girdi tarayıcıdan hiç çıkmaz. Bir aracın 'server'
 * olması ancak gerçek bir parser/derleyici gerektiriyorsa kabul edilir
 * (ör. T-SQL → LINQ). Gerekçe: docs/adr/0001-client-side-by-default.md
 */
export type ToolRuntime = 'client' | 'server';

export interface ToolDefinition {
  /** URL slug — /t/<id>. Registry içinde benzersiz olmalı. */
  id: string;
  name: string;
  /** Kart ve komut paletinde görünen tek satır. */
  description: string;
  category: ToolCategory;
  /** İsim ve açıklamada GEÇMEYEN arama terimleri (eş anlamlılar, kısaltmalar). */
  keywords: string[];
  runtime: ToolRuntime;
  /** Lazy: aracın kodu ve ağır bağımlılıkları yalnızca açıldığında indirilir. */
  component: LazyExoticComponent<ComponentType>;
}

/**
 * Her araç fonksiyonunun ortak dönüş tipi. Araçlar exception fırlatmaz —
 * geçersiz girdi beklenen bir durumdur, istisna değil.
 */
export type ToolResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function ok<T>(value: T): ToolResult<T> {
  return { ok: true, value };
}

export function err<T = never>(error: string): ToolResult<T> {
  return { ok: false, error };
}
