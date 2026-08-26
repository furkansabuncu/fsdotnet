import type { ToolCategory, ToolDefinition } from './types';
import { CATEGORY_ORDER } from './categories';

import base64 from './base64';
import bindParams from './bind-params';
import caseConvert from './case';
import codeFormat from './code-format';
import cron from './cron';
import csvJson from './csv-json';
import dateFormat from './date-format';
import epoch from './epoch';
import hash from './hash';
import httpStatus from './http-status';
import inList from './in-list';
import jsonToCsharp from './json-to-csharp';
import jwt from './jwt';
import mojibake from './mojibake';
import oraErrors from './ora-errors';
import regex from './regex';
import rtf from './rtf';
import sqlDiff from './sql-diff';
import sqlFix from './sql-fix';
import sqlFormat from './sql-format';
import sqlToLinq from './sql-to-linq';
import trData from './tr-data';
import unicode from './unicode';
import uuid from './uuid';
import xmlJson from './xml-json';

/**
 * Sitedeki TEK araç kaynağı.
 *
 * Route'lar, ana sayfa ızgarası, komut paleti ve arama — hepsi bu diziden
 * türer. Yeni araç eklemek = `tools/<id>/` klasörü açıp buraya bir satır
 * eklemek.
 *
 * Sıra ana sayfadaki kategori bloklarının içindeki sırayı belirliyor;
 * kategoriye göre gruplama `toolsByCategory` işini yapıyor.
 *
 * `ToolDefinition` hâlâ `status: 'soon'` durumunu taşıyor: bir araç
 * yazılmaya başlandığında katalogda görünüp route'lanmadan bekleyebilsin
 * diye. Şu an bekleyen araç yok.
 */
const TOOL_LIST: readonly ToolDefinition[] = [
  // .NET ve veri
  jsonToCsharp, sqlToLinq, inList, oraErrors, bindParams, sqlDiff, dateFormat, sqlFix,
  // Dönüştürücüler
  base64, mojibake, rtf, unicode, caseConvert, csvJson, xmlJson,
  // Biçimlendiriciler
  sqlFormat, codeFormat,
  // Güvenlik
  jwt, hash, uuid,
  // Test ve zaman
  regex, cron, epoch, trData,
  // Web
  httpStatus,
];

export const TOOLS: readonly ToolDefinition[] = TOOL_LIST;

const byId = new Map<string, ToolDefinition>(TOOLS.map((tool) => [tool.id, tool]));

export function getTool(id: string | undefined): ToolDefinition | undefined {
  return id ? byId.get(id) : undefined;
}

export const READY_COUNT = TOOLS.filter((tool) => tool.status === 'ready').length;
export const TOTAL_COUNT = TOOLS.length;
export const CLIENT_COUNT = TOOLS.filter((tool) => tool.runtime === 'client').length;

export function toolsByCategory(
  tools: readonly ToolDefinition[] = TOOLS,
): { category: ToolCategory; tools: ToolDefinition[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    tools: tools.filter((tool) => tool.category === category),
  })).filter((group) => group.tools.length > 0);
}

/**
 * Basit skorlu arama: isimde geçen eşleşme, keyword eşleşmesinden önce gelir.
 * Açıklamaya bakılmaz — açıklama sözlükte; onun yerine araç tanımlarına her
 * iki dilde arama terimi yazılıyor. Hazır araçlar eşit skorda planlananların
 * önüne alınır. Fuzzy kütüphanesi araç sayısı 40'ı geçene kadar gereksiz.
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
    else if (tool.keywords.some((keyword) => keyword.toLowerCase().includes(q))) score = 50;

    if (score > 0) scored.push({ tool, score });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.tool.status === 'ready') - Number(a.tool.status === 'ready') ||
        a.tool.name.localeCompare(b.tool.name),
    )
    .map((entry) => entry.tool);
}
