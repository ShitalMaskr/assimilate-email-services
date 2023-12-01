'use strict';
const { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoDbClient = new DynamoDBClient({ region: 'ap-south-1' });

module.exports.createOrganization = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const putParams = {
            TableName: process.env.DYNAMODB_ORGANIZATION_TABLE,
            Item: {
                id: { S: body.domain },
                organizationName: { S: body.organizationName },
                userName: { S: body.userName },
                address: { S: body.address },
                contactNo: { S: body.contactNo },
                email: { S: body.email },
                url: { S: body.url },
                domain: { S: body.domain },
                host: { S: body.host },
                port: { S: body.port },
                password: { S: body.password }
            },
        };
        const putCommand = new PutItemCommand(putParams);
        await dynamoDbClient.send(putCommand);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: 'Organization created successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Could not create organization" }),
        };
    }
};

module.exports.getOrganizations = async (event) => {
    try {
        const scanParams = {
            TableName: process.env.ORGANIZATION_TABLE_NAME,
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
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                total: result.Count,
                items: await result.Items.map((organization) => {
                    return {
                        id: organization.id.S,
                        organizationName: organization.organizationName.S,
                        userName: organization.userName.S,
                        address: organization.address.S,
                        contactNo: organization.contactNo.S,
                        email: organization.email.S,
                        url: organization.url.S,
                        domain: organization.domain.S,
                        host: organization.host.S,
                        port: organization.port.S,
                        password: organization.password.S
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
module.exports.getOrganizationById = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const organizationId = body.id;
        const queryParams = {
            TableName: process.env.DYNAMODB_ORGANIZATION_TABLE,
            KeyConditionExpression: "#id = :id",
            ExpressionAttributeNames: {
                "#id": "id"
            },
            ExpressionAttributeValues: {
                ":id": { S: organizationId }
            },
            Limit: 1
        };
        const result = await dynamoDbClient.send(new QueryCommand(queryParams));
        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No organizations found for the specified domain' }),
            };
        }
        const [organizationDetails] = result.Items || [];
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                organizationName: organizationDetails.organizationName.S,
                userName: organizationDetails.userName.S,
                address: organizationDetails.address.S,
                contactNo: organizationDetails.contactNo.S,
                email: organizationDetails.email.S,
                url: organizationDetails.url.S,
                domain: organizationDetails.domain.S,
                host: organizationDetails.host.S,
                port: organizationDetails.port.S,
                password: organizationDetails.password.S
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};

module.exports.updateOrganization = async (event) => {
    try {
        const body = JSON.parse(event.body);
        console.log(body.id, "body");
        const updateParams = {
            TableName: process.env.DYNAMODB_ORGANIZATION_TABLE,
            Key: { id: { S: body.id } },
            UpdateExpression: 'SET organizationName = :organizationName, userName = :userName, address = :address, contactNo = :contactNo, email = :email, #url = :url, #domain = :domain, #host = :host, port = :port, password = :password',
            ExpressionAttributeNames: {
                "#url": "url",
                "#domain": "domain",
                "#host": "host"
            },
            ExpressionAttributeValues: {
                ':organizationName': { S: body.organizationName },
                ':userName': { S: body.userName },
                ':address': { S: body.address },
                ':contactNo': { S: body.contactNo },
                ':email': { S: body.email },
                ':url': { S: body.url },
                ':domain': { S: body.domain },
                ':host': { S: body.host },
                ':port': { S: body.port },
                ':password': { S: body.password }
            },
        };
        await dynamoDbClient.send(new UpdateItemCommand(updateParams));

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: 'Organization updated successfully' }),

        };
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred' })
        };
    }
};

module.exports.deleteOrganization = async (event, context) => {
    try {
        const userId = event.pathParameters.id;

        const deleteParams = {
            TableName: process.env.ORGANIZATION_TABLE_NAME,
            Key: { id: { S: userId } },
        };

        await dynamoDbClient.send(new DeleteItemCommand(deleteParams));

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: 'Organization deleted successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};