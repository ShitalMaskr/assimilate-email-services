'use strict';

const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const nodemailer = require('nodemailer');
const dynamoDbClient = new DynamoDBClient({ region: 'ap-south-1' });

module.exports.sendMail = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const organizationDomain = requestBody.domain;
        const message = requestBody.message;
        const htmlContent = requestBody.htmlContent;

        const queryParams = {
            TableName: process.env.DYNAMODB_ORGANIZATION_TABLE,
            KeyConditionExpression: "#id = :id",
            ExpressionAttributeNames: {
                "#id": "id"
            },
            ExpressionAttributeValues: {
                ":id": { S: organizationDomain }
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
        const [matchedOrganization] = result.Items || [];
        const transporter = nodemailer.createTransport({
            host: matchedOrganization?.host?.S,
            auth: {
                user: matchedOrganization?.email?.S || '',
                pass: matchedOrganization?.password?.S || '',
            },
        });
        const mailOptions = {
            from: matchedOrganization?.email?.S || '',
            to: requestBody.to,
            subject: requestBody.subject,
            text: message,
            html: htmlContent,
        };
        const info = await transporter.sendMail(mailOptions);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                success: true,
                message: `Email sent for organization ${matchedOrganization?.email?.S || ''}`,
            }),
        };
    } catch (error) {
        console.error(error);

        if (error.name === 'ValidationException') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Validation error occurred', details: error.message }),
            };
        } else if (error.name === 'NotFoundException') {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Organization not found', details: error.message }),
            };
        } else if (error.name === 'EmailSendingException') {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Email sending error occurred', details: error.message }),
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
            };
        }
    }
};
