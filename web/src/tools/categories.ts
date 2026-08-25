import type { LucideIcon } from 'lucide-react';
import { Braces, Clock, Shield, Sparkles, Wand2 } from 'lucide-react';
import type { ToolCategory } from './types';

/**
 * Kategorinin dilden bağımsız kısmı. Etiket ve açıklama sözlükte
 * (`i18n/en.ts` → `categories`), çünkü onlar çevrilir; ikon ve renk çevrilmez.
 */
export interface CategoryMeta {
  icon: LucideIcon;
  /**
   * Kategorinin aksan rengini taşıyan CSS değişkeni adı. Component bunu
   * inline style ile --cat / --cat-bg olarak geçirir; böylece altı kategori
   * için altı ayrı Tailwind sınıf seti yazmak gerekmez.
   */
  varName: string;
}

export const CATEGORY_ORDER: ToolCategory[] = [
  'dotnet',
  'converters',
  'formatters',
  'security',
  'testing',
];

export const CATEGORIES: Record<ToolCategory, CategoryMeta> = {
  dotnet: { icon: Sparkles, varName: 'dotnet' },
  converters: { icon: Wand2, varName: 'converters' },
  formatters: { icon: Braces, varName: 'formatters' },
  security: { icon: Shield, varName: 'security' },
  testing: { icon: Clock, varName: 'testing' },
};

/** Kategori rengini component'e geçiren inline style nesnesi. */
export function categoryVars(category: ToolCategory): React.CSSProperties {
  const name = CATEGORIES[category].varName;
  return {
    ['--cat' as string]: `var(--cat-${name})`,
    ['--cat-bg' as string]: `var(--cat-${name}-bg)`,
  };
}
