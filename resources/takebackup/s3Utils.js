const { S3Client, GetObjectTaggingCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const bucket = 'friedlam-backups';
const client = new S3Client();

const writeToS3 = async (zipfilePath, md5filePath, modifiedDate) => {
    try {
        const md5 = fs.readFileSync(md5filePath, 'utf8').split(' ')[0].trim();
        const start = Date.now();
        const body = fs.createReadStream(zipfilePath);

        const results = await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: `${path.basename(zipfilePath)}`,
            Body: body,
            ContentMD5: Buffer.from(md5, 'hex').toString('base64'),
            StorageClass: 'GLACIER_IR',
            Tagging: 'modified=' + modifiedDate
        }));
        const end = Date.now();
        console.log(`Time to put file: ${end - start}ms`);
        console.log(results);
    } catch (err) {
        console.log(err, 'catch error');
    }
};

const previousModifiedDate = async (zipfile) => {
    const results = await client.send(new GetObjectTaggingCommand({
        Bucket: bucket,
        Key: `${zipfile}`
    }));
    console.log('previous modified date:', new Date(+results.TagSet[0].Value).toISOString());
    return +results.TagSet[0].Value;
};

module.exports = { previousModifiedDate, writeToS3 };
