import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { json } from './http';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  let body: { name?: string; owner?: string; careNotes?: string };
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }

  const { name, owner, careNotes } = body;

  if (typeof name !== 'string' || name.trim() === '') {
    return json(400, { error: 'name is required and must be a non-empty string' });
  }
  if (owner !== undefined && typeof owner !== 'string') {
    return json(400, { error: 'owner must be a string' });
  }
  if (careNotes !== undefined && typeof careNotes !== 'string') {
    return json(400, { error: 'careNotes must be a string' });
  }

  const petId = randomUUID();
  // The owner opens their read-only view with this token — no account, no login.
  const shareToken = randomUUID().replace(/-/g, '');

  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `PET#${petId}`,
        SK: 'PROFILE',
        name,
        owner,
        careNotes,
        shareToken,
        createdAt: new Date().toISOString(),
      },
    }),
  );

  return json(201, { petId, shareToken });
};
