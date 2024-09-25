const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

module.exports.createMessage = async (event) => {
    const { username, text } = JSON.parse(event.body);
    const id = Date.now().toString();

    // Använd toLocaleString för att säkerställa korrekt svensk tidzon
    const formatDate = (date) => {
      return date.toLocaleString('sv-SE', {
        timeZone: 'Europe/Stockholm', // Svensk tidzon (CET/CEST)
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const createdAt = formatDate(new Date()); // Få rätt formaterat datum och tid

    const params = {
        TableName: tableName,
        Item: {
            id,
            username,
            text,
            createdAt,
        },
    };

    await docClient.put(params).promise();

    return {
        statusCode: 201,
        body: JSON.stringify({ id, username, text, createdAt }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
    };
};


module.exports.updateMessage = async (event) => {
    const { id } = event.pathParameters;
    const { text } = JSON.parse(event.body);
    const params = {
        TableName: tableName,
        Key: { id },
        UpdateExpression: 'set text = :text',
        ExpressionAttributeValues: {
            ':text': text,
        },
        ReturnValues: 'UPDATED_NEW',
    };

    await docClient.update(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify({ id, text }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
    };
};

module.exports.getMessages = async () => {
    const params = {
        TableName: tableName,
    };

    try {
        const result = await docClient.scan(params).promise();
        console.log("Fetched messages:", result.Items); // Logga de hämtade meddelandena
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
            },
        };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Kunde inte hämta meddelanden" }),
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
            },
        };
    }
};
