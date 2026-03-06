export interface ApiError {
  title: string;
  message: string;
  requestId?: string;
}

const STATUS_TITLES: Record<number, string> = {
  400: 'Pending Provision',
  401: 'Unauthorized',
  403: 'Permission Denied',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Server Error',
  503: 'Service Unavailable',
};

export class ApiRequestError extends Error {
  readonly title: string;
  readonly requestId?: string;
  readonly isProfileRequired: boolean;

  constructor(
    message: string,
    title: string,
    requestId?: string,
    isProfileRequired = false,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.title = title;
    this.requestId = requestId;
    this.isProfileRequired = isProfileRequired;
  }
}

export async function parseApiError(response: Response, fallbackTitle = 'Request Failed'): Promise<ApiError> {
  console.log("HELLO " + response)
  const requestId = response.headers.get('X-Request-Id') ?? undefined;
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
