const SESSION_TOKEN_KEY = 'kle-session-token';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

function resolveApiUrl(input: string) {
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  return `${API_BASE_URL}${input}`;
}

function buildHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export function setSessionToken(token: string | null) {
  if (token) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(resolveApiUrl(input), {
      ...init,
      headers: buildHeaders(init?.headers),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa la URL de la API desplegada.');
  }

  if (!response.ok) {
    let errorMessage = `La operación no se pudo completar (HTTP ${response.status}).`;
    try {
      const payload = await response.json() as { error?: string };
      errorMessage = payload.error || errorMessage;
    } catch {
      const responseText = await response.text().catch(() => '');
      if (responseText.trim()) {
        errorMessage = responseText;
      }
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function postJson<T>(input: string, body: unknown) {
  return apiRequest<T>(input, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function putJson<T>(input: string, body: unknown) {
  return apiRequest<T>(input, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
