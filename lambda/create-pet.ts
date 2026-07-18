import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const { name, owner, careNotes } = JSON.parse(event.body ?? '{}');

  if (!name) {
    return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }) };
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
        owner: owner ?? null,
        careNotes: careNotes ?? null,
        shareToken,
        createdAt: new Date().toISOString(),
      },
    }),
  );

  return {
    statusCode: 201,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ petId, shareToken }),
  };
};
