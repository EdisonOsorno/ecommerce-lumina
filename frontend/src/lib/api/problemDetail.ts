/**
 * Extracción de mensajes legibles de errores del backend.
 * El backend responde con Problem Detail (RFC 7807): { title, detail, state, ... }.
 */

export async function extractProblemDetailMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === 'object') {
      const problem = data as { detail?: unknown; message?: unknown; title?: unknown };
      const detail = typeof problem.detail === 'string' ? problem.detail : undefined;
      const message = typeof problem.message === 'string' ? problem.message : undefined;
      const title = typeof problem.title === 'string' ? problem.title : undefined;
      return detail ?? message ?? title ?? fallbackMessage;
    }
  } catch {
    // El body no es JSON (ej. respuesta vacía o HTML de error) — usar el fallback
  }
  return `${fallbackMessage} (HTTP ${response.status})`;
}
