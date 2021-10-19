// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const crypto = require("crypto");

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;
const assetChunkNumber = process.env.ASSET_CHUNK_NUMBER;
const chunkNumber = process.env.VULN_CHUNK_NUMBER;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
exports.putItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body)
    const id = body.id;
    const secondsToWait = body.seconds || 60;
    const assetExportId = body.assetExportId;
    const timeToWait = new Date(Date.now())
    const timeToWaitTimestamp = timeToWait.setSeconds(timeToWait.getSeconds() + secondsToWait);

    // const assetLookupTasks = [];
    // [...Array(Number(assetChunkNumber)).keys()].forEach((chunkNumber) => {
    //     const assetParams = {
    //         TableName: tableName,
    //         Key: { id: assetExportId, chunkId: chunkNumber.toString() },
    //     };
    //     assetLookupTasks.push(docClient.get(assetParams).promise());
    // });

    // const assetValues = await Promise.all(assetLookupTasks);
    const assetValues = [...Array(Number(assetChunkNumber)).keys()].map(f => crypto.randomBytes(16).toString("hex"));
    console.log(assetValues);
    console.log(assetValues.length);

    const ids = [...Array(Number(chunkNumber)).keys()].map(f => crypto.randomBytes(16).toString("hex"));
    const tasks = [];
    ids.forEach((vulnId, i) => {
        const randomAsset = assetValues[Math.floor(Math.random() * assetValues.length)];
        const vulnParams = {
            TableName: tableName,
            Item: { id, chunkId: i.toString(), vulnId, vulnName: `vuln-${i}`, assetId:  randomAsset}
        };
        tasks.push(docClient.put(vulnParams).promise());
    });
    await Promise.all(tasks);
    const chunks = ids.map((id, i) => ({ chunkId: i + 1, id }));
    var params = {
        TableName: tableName,
        Item: { id: id, chunkId: "prime", timestamp: timeToWaitTimestamp, chunks }
    };

    const result = await docClient.put(params).promise();

    const response = {
        statusCode: 200,
        body: JSON.stringify(body)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
