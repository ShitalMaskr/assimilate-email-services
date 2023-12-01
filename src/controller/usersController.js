'use strict';
const { DynamoDBClient, PutItemCommand, ScanCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoDbClient = new DynamoDBClient({ region: 'ap-south-1' });

module.exports.createUser = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const putParams = {
            TableName: process.env.USER_TABLE_NAME,
            Item: {
                id: { S: uuidv4() },
                firstName: { S: body.firstName },
                lastName: { S: body.lastName },
                email: { S: body.email },
                password: { S: body.password },
                phoneNumber: { S: body.phoneNumber },
            },
        };
        const putCommand = new PutItemCommand(putParams);

        await dynamoDbClient.send(putCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User created successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Could not create user" }),
        };
    }
};

module.exports.getUsers = async (event) => {
    try {
        const scanParams = {
            TableName: process.env.DYNAMODB_USER_TABLE,
        };

        const scanCommand = new ScanCommand(scanParams);

        const result = await dynamoDbClient.send(scanCommand);

        if (result.Count === 0) {
            return {
                statusCode: 404,
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                total: result.Count,
                items: await result.Items.map((user) => {
                    return {
                        id: user.id.S,
                        firstName: user.firstName.S,
                        lastName: user.lastName.S,
                        email: user.email.S,
                        password: user.password.S,
                        phoneNumber: user.phoneNumber.S,
                    };
                }),
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred' }),
        };
    }
};

module.exports.updateUser = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const updateParams = {
            TableName: process.env.DYNAMODB_USER_TABLE,
            Key: { id: { S: body.id } },
            UpdateExpression: 'SET firstName = :firstName, lastName = :lastName, email = :email, password = :password, phoneNumber = :phoneNumber',
            ExpressionAttributeValues: {
                ':firstName': { S: body.firstName },
                ':lastName': { S: body.lastName },
                ':email': { S: body.email },
                ':password': { S: body.password },
                ':phoneNumber': { S: body.phoneNumber },
            },
        };
        await dynamoDbClient.send(new UpdateItemCommand(updateParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User Updated successfully' }),

        };
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred' })
        };
    }
};

module.exports.deleteUser = async (event, context) => {
    try {
        const userId = event.pathParameters.id;

        const deleteParams = {
            TableName: process.env.DYNAMODB_USER_TABLE,
            Key: { id: { S: userId } },
        };

        await dynamoDbClient.send(new DeleteItemCommand(deleteParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User deleted successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
