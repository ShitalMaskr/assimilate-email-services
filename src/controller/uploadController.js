const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { parseFormData } = require('./common');

const BUCKET = process.env.BUCKET;

const s3 = new S3Client({ region: 'ap-south-1' });

module.exports.handle = async (event) => {
    try {
        const { file } = await parseFormData(event);
        const filename = file.filename.filename;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: filename,
            ACL: 'public-read',
            Body: Buffer.from(file.content, 'base64'),
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({ link: `https://${BUCKET}.s3.amazonaws.com/${filename}` })
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.stack })
        };
    }
};
