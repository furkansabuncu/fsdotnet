/**
 * Tek API istemcisi.
 *
 * Sitedeki araçların neredeyse tamamı tarayıcıda çalışıyor (ADR-0001); bu
 * dosya yalnızca gerçek bir .NET motoruna ihtiyaç duyan araçlar için var.
 *
 * Taban adres derleme zamanında `VITE_API_URL` ile veriliyor. TANIMSIZ
 * BIRAKMAK GEÇERLİ BİR DURUM: statik barındırmada (Cloudflare Pages) API
 * yok, o zaman sunucuya bağlı araç kendini kapatıp istemci motoruyla
 * devam ediyor. Bu yüzden `isConfigured` bir hata değil, bir yetenek
 * sorgusu.
 */

const configured = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

export const apiBaseUrl = configured;

export const isApiConfigured = configured !== '';

export type ApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'unconfigured' | 'unreachable' | 'status'; detail?: string };

/** İstek bu süreyi aşarsa iptal edilir — sunucu uykudaysa arayüz donmasın. */
const TIMEOUT_MS = 8_000;

export async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  if (!isApiConfigured) return { ok: false, reason: 'unconfigured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      // ProblemDetails gövdesi varsa mesajı taşıyalım; yoksa durum kodu yeter.
      const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
      return { ok: false, reason: 'status', detail: problem?.detail ?? `HTTP ${response.status}` };
    }

    return { ok: true, value: (await response.json()) as T };
  } catch (error) {
    // Ağ hatası, CORS reddi ve zaman aşımı çağıran için aynı şey: API yok.
    return { ok: false, reason: 'unreachable', detail: error instanceof Error ? error.message : undefined };
  } finally {
    clearTimeout(timer);
  }
}
