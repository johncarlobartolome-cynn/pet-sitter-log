import type { APIGatewayProxyResultV2 } from 'aws-lambda';

// Shared JSON response helper for all HTTP handlers.
export const json = (
  statusCode: number,
  payload: unknown,
): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
