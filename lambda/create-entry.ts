import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// Entries live under the same partition as the pet's profile (PK = PET#<id>),
// so one query later returns the profile and every entry together.
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const petId = event.pathParameters?.id;

  let body: { type?: string; note?: string };
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }

  if (!petId || typeof body.type !== 'string') {
    return json(400, { error: 'petId and a string "type" are required' });
  }

  const createdAt = new Date().toISOString();

  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `PET#${petId}`,
        SK: `ENTRY#${createdAt}#${randomUUID()}`,
        type: body.type,
        note: body.note,
        createdAt,
      },
    }),
  );

  return json(201, { petId, type: body.type, createdAt });
};

const json = (statusCode: number, payload: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
