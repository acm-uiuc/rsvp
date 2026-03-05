export interface ApiError {
  title: string;
  message: string;
  requestId?: string;
}

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Permission Denied',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Server Error',
  503: 'Service Unavailable',
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly title: string,
    public readonly requestId?: string,
    public readonly isProfileRequired = false,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function parseApiError(response: Response, fallbackTitle = 'Request Failed'): Promise<ApiError> {
  const requestId = response.headers.get('x-request-id') ?? undefined;
  const title = STATUS_TITLES[response.status] ?? fallbackTitle;

  let message = `An error occurred (Status: ${response.status})`;
  try {
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        message = json.message || json.error || text;
      } catch {
        message = text;
      }
    }
  } catch {
    // keep default
  }

  return { title, message, requestId };
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiRequestError) {
    return { title: err.title, message: err.message, requestId: err.requestId };
  }
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  return { title: 'Error', message };
}

export function makeApiError(message: string, title = 'Error'): ApiError {
  return { title, message };
}
