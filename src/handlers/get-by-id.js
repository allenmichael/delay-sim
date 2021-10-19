// Create clients and set shared const values outside of the handler.

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

// Create a DocumentClient that represents the query to add an item
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

/**
 * A simple example includes a HTTP get method to get one item by id from a DynamoDB table.
 */
exports.getByIdHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  // Get id from pathParameters from APIGateway because of `/{id}` at template.yml
  const id = event.pathParameters.id;

  // Get the item from the table
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
  var params = {
    TableName: tableName,
    Key: { id: id, chunkId: "prime" },
  };
  const data = await docClient.get(params).promise();
  const item = data.Item;

  const n = new Date(Date.now());
  const waitTil = new Date(Number(data.Item.timestamp));

  if (n > waitTil) {
    console.log("Job is ready!");
    const response = {
      statusCode: 200,
      body: JSON.stringify({ status: "COMPLETED", uuid: item.id, chunks_available: [1, 2, 3] })
    };
    return response;
  } else {
    console.log("Job is ready!");
    const response = {
      statusCode: 200,
      body: JSON.stringify({status: "PROCESSING", uuid: item.id})
    };
    return response;
  }
}
