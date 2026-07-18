import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { json } from './http';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const token = event.pathParameters?.token;
  if (!token) {
    return json(400, { error: 'token is required' });
  }

  // Find the pet by its share token. GSI1 is sparse, so only the profile matches.
  const found = await db.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'shareToken = :t',
      ExpressionAttributeValues: { ':t': token },
    }),
  );

  const profile = found.Items?.[0];
  if (!profile) {
    return json(404, { error: 'no pet for this token' });
  }

  // Same query as list-entries: this pet's entries, newest first.
  const result = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :entry)',
      ExpressionAttributeValues: {
        ':pk': profile.PK,
        ':entry': 'ENTRY#',
      },
      ScanIndexForward: false,
    }),
  );

  const entries = (result.Items ?? []).map((item) => ({
    type: item.type,
    note: item.note,
    createdAt: item.createdAt,
  }));

  return json(200, {
    pet: {
      name: profile.name,
      owner: profile.owner,
      careNotes: profile.careNotes,
      createdAt: profile.createdAt,
    },
    entries,
  });
};
