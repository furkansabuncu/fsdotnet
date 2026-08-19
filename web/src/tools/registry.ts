import type { ToolCategory, ToolDefinition } from './types';
import { CATEGORY_ORDER } from './categories';

import base64 from './base64';

/**
 * Sitedeki TEK araç kaynağı.
 *
 * Route'lar, ana sayfa grid'i, komut paleti ve arama — hepsi bu diziden türer.
 * Yeni araç eklemek = tools/<id>/ klasörü açıp buraya bir satır eklemek.
 */
export const TOOLS: readonly ToolDefinition[] = [base64];

const byId = new Map(TOOLS.map((t) => [t.id, t]));

export function getTool(id: string | undefined): ToolDefinition | undefined {
  return id ? byId.get(id) : undefined;
}

export function toolsByCategory(): { category: ToolCategory; tools: ToolDefinition[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    tools: TOOLS.filter((t) => t.category === category),
  })).filter((group) => group.tools.length > 0);
}

/**
 * Basit skorlu arama: isimde geçen eşleşme, açıklama/keyword eşleşmesinden
 * önce gelir. Fuzzy kütüphanesi araç sayısı 40'ı geçene kadar gereksiz.
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
    else if (tool.description.toLowerCase().includes(q)) score = 30;

    if (score > 0) scored.push({ tool, score });
  }

  return scored.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name)).map((s) => s.tool);
}
