export interface ApiError {
  title: string;
  message: string;
  requestId?: string;
}


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

/**
 * Parses a raw response body string, extracting a human-readable message
 * from JSON payloads instead of returning the raw JSON string.
 */
export function parseBodyText(raw: string): string {
  if (!raw) return '';
  try {
    const json = JSON.parse(raw);
    return json.message || json.error || raw;
  } catch {
    return raw;
  }
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
