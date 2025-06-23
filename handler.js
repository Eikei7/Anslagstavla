const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

// Rate limiting map
const rateLimitMap = new Map();

// Helper function för rate limiting
const checkRateLimit = (ip) => {
    const now = Date.now();
    const windowMs = 60000; // 1 minut
    const maxRequests = 10;
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }
    
    const requests = rateLimitMap.get(ip);
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
        return false;
    }
    
    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    return true;
};

// Helper function för att få IP-adress
const getClientIP = (event) => {
    return event.requestContext?.identity?.sourceIp || 
           event.headers?.['X-Forwarded-For']?.split(',')[0] || 
           'unknown';
};

// Helper function för CORS headers
const getCorsHeaders = () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
});

// Helper function för input validering och sanitering
const validateAndSanitizeInput = (username, text) => {
    // Validera användarnamn
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return { error: 'Användarnamn är obligatoriskt' };
    }
    if (username.length > 50) {
        return { error: 'Användarnamn får vara max 50 tecken' };
    }

    // Validera text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return { error: 'Meddelande är obligatoriskt' };
    }
    if (text.length > 75) {
        return { error: 'Meddelande får vara max 75 tecken' };
    }

    // Sanitera input
    const sanitizedUsername = username.trim().replace(/[<>&"']/g, '');
    const sanitizedText = text.trim().replace(/[<>&"']/g, '');

    // Kontrollera att sanitering inte tömde fälten
    if (sanitizedUsername.length === 0) {
        return { error: 'Användarnamn innehåller otillåtna tecken' };
    }
    if (sanitizedText.length === 0) {
        return { error: 'Meddelande innehåller otillåtna tecken' };
    }

    return { 
        sanitizedUsername, 
        sanitizedText 
    };
};

module.exports.createMessage = async (event) => {
    try {
        // Rate limiting
        const clientIP = getClientIP(event);
        if (!checkRateLimit(clientIP)) {
            return {
                statusCode: 429,
                body: JSON.stringify({ error: 'För många förfrågningar. Försök igen senare.' }),
                headers: getCorsHeaders()
            };
        }

        // Parse och validera JSON
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Ogiltig JSON-data' }),
                headers: getCorsHeaders()
            };
        }

        const { username, text } = body;

        // Validera och sanitera input
        const validation = validateAndSanitizeInput(username, text);
        if (validation.error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: validation.error }),
                headers: getCorsHeaders()
            };
        }

        const { sanitizedUsername, sanitizedText } = validation;
        const id = Date.now().toString();
        const createdAt = new Date().toISOString();

        const params = {
            TableName: tableName,
            Item: {
                id,
                username: sanitizedUsername,
                text: sanitizedText,
                createdAt,
            },
        };

        await docClient.put(params).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ 
                id, 
                username: sanitizedUsername, 
                text: sanitizedText, 
                createdAt 
            }),
            headers: getCorsHeaders()
        };

    } catch (error) {
        console.error('Error creating message:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Kunde inte skapa meddelandet' }),
            headers: getCorsHeaders()
        };
    }
};

module.exports.updateMessage = async (event) => {
    try {
        // Rate limiting
        const clientIP = getClientIP(event);
        if (!checkRateLimit(clientIP)) {
            return {
                statusCode: 429,
                body: JSON.stringify({ error: 'För många förfrågningar. Försök igen senare.' }),
                headers: getCorsHeaders()
            };
        }

        const { id } = event.pathParameters;
        
        // Validera ID
        if (!id || typeof id !== 'string') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Ogiltigt meddelande-ID' }),
                headers: getCorsHeaders()
            };
        }

        // Parse JSON
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Ogiltig JSON-data' }),
                headers: getCorsHeaders()
            };
        }

        const { text } = body;

        // Validera text
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Meddelande är obligatoriskt' }),
                headers: getCorsHeaders()
            };
        }
        if (text.length > 75) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Meddelande får vara max 75 tecken' }),
                headers: getCorsHeaders()
            };
        }

        // Sanitera text
        const sanitizedText = text.trim().replace(/[<>&"']/g, '');
        if (sanitizedText.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Meddelande innehåller otillåtna tecken' }),
                headers: getCorsHeaders()
            };
        }

        // Kontrollera att meddelandet finns innan uppdatering
        const checkParams = {
            TableName: tableName,
            Key: { id }
        };

        const existingItem = await docClient.get(checkParams).promise();
        if (!existingItem.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Meddelandet hittades inte' }),
                headers: getCorsHeaders()
            };
        }

        const updateParams = {
            TableName: tableName,
            Key: { id },
            UpdateExpression: 'set #textField = :text, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#textField': 'text',
                '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues: {
                ':text': sanitizedText,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await docClient.update(updateParams).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(result.Attributes),
            headers: getCorsHeaders()
        };

    } catch (error) {
        console.error('Error updating message:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Kunde inte uppdatera meddelandet' }),
            headers: getCorsHeaders()
        };
    }
};

module.exports.getMessages = async (event) => {
    try {
        const params = {
            TableName: tableName,
        };

        const result = await docClient.scan(params).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
            headers: getCorsHeaders()
        };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Kunde inte hämta meddelanden" }),
            headers: getCorsHeaders()
        };
    }
};

module.exports.getMessagesByUsername = async (event) => {
    try {
        const { username } = event.pathParameters;

        // Validera användarnamn
        if (!username || typeof username !== 'string') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Ogiltigt användarnamn' }),
                headers: getCorsHeaders()
            };
        }

        const params = {
            TableName: tableName,
            FilterExpression: "#username = :usernameValue",
            ExpressionAttributeNames: {
                "#username": "username",
            },
            ExpressionAttributeValues: {
                ":usernameValue": decodeURIComponent(username),
            },
        };

        const result = await docClient.scan(params).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
            headers: getCorsHeaders()
        };
    } catch (error) {
        console.error("Error fetching messages by username:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Kunde inte hämta meddelanden för användaren' }),
            headers: getCorsHeaders()
        };
    }
};