/**
 * Error handling utilities
 */

/**
 * Extracts a meaningful message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Helper for API error responses
 */
export function createErrorResponse(message: string, details: string, status: number = 500) {
  return Response.json(
    { error: message, details },
    { status }
  );
} 