export async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    if (/^\s*(?:<!doctype\s+html|<html\b)/i.test(body)) {
      throw new Error(
        'The local API returned an HTML page instead of JSON. Start VLI with "npm run dev" or keep the local API server running alongside the Vite client.'
      );
    }
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new Error(`The local API returned an unexpected response (HTTP ${response.status}).`);
    }
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`The local API returned malformed JSON (HTTP ${response.status}).`);
  }
}
