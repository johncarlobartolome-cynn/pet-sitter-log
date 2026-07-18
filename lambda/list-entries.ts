import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const petId = event.pathParameters?.id;
  if (!petId) {
    return json(400, { error: 'petId is required' });
  }

  const result = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :entry)',
      ExpressionAttributeValues: {
        ':pk': `PET#${petId}`,
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

  return json(200, { entries });
};

const json = (statusCode: number, payload: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
