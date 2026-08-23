import type { ToolCategory, ToolDefinition } from './types';
import { CATEGORY_ORDER } from './categories';
import { PLANNED_TOOLS } from './planned';

import base64 from './base64';
import mojibake from './mojibake';

/** Yazılmış, açılabilir araçlar. Yeni araç buraya eklenir. */
const READY_TOOLS: readonly ToolDefinition[] = [base64, mojibake];

/**
 * Sitedeki TEK araç kaynağı.
 *
 * Route'lar, ana sayfa ızgarası, komut paleti ve arama — hepsi bu diziden
 * türer. Yeni araç eklemek = tools/<id>/ klasörü açıp yukarıya bir satır
 * eklemek (ve planned.ts'ten çıkarmak).
 */
export const TOOLS: readonly ToolDefinition[] = [...READY_TOOLS, ...PLANNED_TOOLS];

const byId = new Map<string, ToolDefinition>(TOOLS.map((t) => [t.id, t]));

export function getTool(id: string | undefined): ToolDefinition | undefined {
  return id ? byId.get(id) : undefined;
}

export const READY_COUNT = READY_TOOLS.length;
export const TOTAL_COUNT = TOOLS.length;

export function toolsByCategory(
  tools: readonly ToolDefinition[] = TOOLS,
): { category: ToolCategory; tools: ToolDefinition[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    tools: tools.filter((t) => t.category === category),
  })).filter((group) => group.tools.length > 0);
}

/**
 * Basit skorlu arama: isimde geçen eşleşme, keyword eşleşmesinden önce gelir.
 * Açıklamaya bakılmaz — açıklama artık sözlükte; onun yerine araç tanımlarına
 * her iki dilde arama terimi yazılıyor. Hazır araçlar eşit skorda planlananların önüne alınır — kullanıcı
 * açabildiği bir şeyi görmek ister. Fuzzy kütüphanesi araç sayısı 40'ı geçene
 * kadar gereksiz.
 */
export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...TOOLS];

  const scored: { tool: ToolDefinition; score: number }[] = [];
  for (const tool of TOOLS) {
    const name = tool.name.toLowerCase();
    let score = 0;
    if (name.startsWith(q)) score = 100;
    else if (name.includes(q)) score = 80;
    else if (tool.id.includes(q)) score = 70;
    else if (tool.keywords.some((k) => k.toLowerCase().includes(q))) score = 50;

    if (score > 0) scored.push({ tool, score });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.tool.status === 'ready') - Number(a.tool.status === 'ready') ||
        a.tool.name.localeCompare(b.tool.name),
    )
    .map((s) => s.tool);
}
