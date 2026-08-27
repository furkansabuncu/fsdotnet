import type { Dictionary } from '../i18n/en';
import type { RuleText } from '../lint/types';
import type { ToolId } from '../tools/types';

/**
 * Bir aracın kural metinlerini sözlükten alır.
 *
 * Daraltma çalışma zamanında yapılıyor çünkü araç kimliği adresten geliyor:
 * `sql-fix` sözlükte `sqlFix` bölümü. Bu eşlemeyi tip düzeyinde ifade etmek,
 * kural sayfasının kazandığından fazlasını maliyet olarak getirirdi —
 * karşılığında bir test var: katalogdaki her kuralın iki dilde de metni
 * bulunmak zorunda.
 */
export function ruleTexts(dictionary: Dictionary, tool: ToolId): Record<string, RuleText> {
  const key = tool.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
  const section = (dictionary as unknown as Record<string, { rules?: Record<string, RuleText> }>)[key];
  return section?.rules ?? {};
}
