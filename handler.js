const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

module.exports.createMessage = async (event) => {
    const { username, text } = JSON.parse(event.body);
    const id = Date.now().toString();
    const formatDate = (date) => {
      const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
      
      const day = date.getDate().toString().padStart(2, '0'); // Få dagens datum med två siffror
      const month = months[date.getMonth()]; // Få månadsnamnet från arrayen
      const year = date.getFullYear(); // Få årtalet
      const hours = date.getHours().toString().padStart(2, '0'); // Få timmar med två siffror
      const minutes = date.getMinutes().toString().padStart(2, '0'); // Få minuter med två siffror
  
      return `${day} ${month} ${year} ${hours}:${minutes}`;
  };
    const createdAt = formatDate(new Date());

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
        },
    };
};

module.exports.getMessages = async () => {
    const params = {
        TableName: tableName,
    };

    const result = await docClient.scan(params).promise();

    return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
    };
};