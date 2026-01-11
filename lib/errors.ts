// Standardized API error responses for the licensing system

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
  signature?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Error codes
export const ErrorCodes = {
  // Validation errors (400)
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_LICENSE_KEY: 'INVALID_LICENSE_KEY',
  INVALID_DEVICE_ID: 'INVALID_DEVICE_ID',
  INVALID_RECEIPT: 'INVALID_RECEIPT',

  // Authorization errors (401/403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  LICENSE_REVOKED: 'LICENSE_REVOKED',
  LICENSE_REFUNDED: 'LICENSE_REFUNDED',
  DEVICE_NOT_ACTIVATED: 'DEVICE_NOT_ACTIVATED',

  // Limit errors (403)
  DEVICE_LIMIT_REACHED: 'DEVICE_LIMIT_REACHED',
  TRIAL_ALREADY_USED: 'TRIAL_ALREADY_USED',

  // Not found (404)
  LICENSE_NOT_FOUND: 'LICENSE_NOT_FOUND',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',

  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  IAP_VERIFICATION_ERROR: 'IAP_VERIFICATION_ERROR',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    success: false,
    error: {
      code: ErrorCodes[code],
      message,
      details,
    },
  };
}

export function successResponse<T>(data: T, signature?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    signature,
  };
}

// HTTP status codes for each error type
export function getHttpStatusForError(code: ErrorCode): number {
  switch (code) {
    case 'INVALID_REQUEST':
    case 'INVALID_LICENSE_KEY':
    case 'INVALID_DEVICE_ID':
    case 'INVALID_RECEIPT':
      return 400;

    case 'UNAUTHORIZED':
      return 401;

    case 'LICENSE_REVOKED':
    case 'LICENSE_REFUNDED':
    case 'DEVICE_NOT_ACTIVATED':
    case 'DEVICE_LIMIT_REACHED':
    case 'TRIAL_ALREADY_USED':
      return 403;

    case 'LICENSE_NOT_FOUND':
    case 'DEVICE_NOT_FOUND':
      return 404;

    case 'RATE_LIMITED':
      return 429;

    case 'INTERNAL_ERROR':
    case 'IAP_VERIFICATION_ERROR':
    default:
      return 500;
  }
}
