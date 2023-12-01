'use strict';
const jwt = require('jsonwebtoken');
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const secretKey = 'LEAD-SECRET';

const dynamoDbClient = new DynamoDBClient();

module.exports.login = async (event) => {
    const body = JSON.parse(event.body);
    const email = body.email;
    const password = body.password;

    const params = {
        TableName: process.env.USER_TABLE_NAME,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': { S: email },
        },
    };

    try {
        const result = await dynamoDbClient.send(new QueryCommand(params));

        if (result.Count === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid credentials' })
            };
        }

        const storedPasswordHash = result.Items[0].password.S;
        if (password !== storedPasswordHash) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid password' })
            };
        }

        const token = jwt.sign({ email }, secretKey, { expiresIn: '1h' });
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ token })
        };
    } catch (error) {
        console.error('Error querying DynamoDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
}