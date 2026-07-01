const SESSION_TOKEN_KEY = 'kle-session-token';

function getToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY);
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
  const response = await fetch(input, {
    ...init,
    headers: buildHeaders(init?.headers),
  });

  if (!response.ok) {
    let errorMessage = 'La operación no se pudo completar.';
    try {
      const payload = await response.json() as { error?: string };
      errorMessage = payload.error || errorMessage;
    } catch {
      // Ignore malformed error payload.
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
