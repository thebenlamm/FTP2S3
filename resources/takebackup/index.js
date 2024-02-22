const Client = require('ssh2-sftp-client');
const verifyBackup = require('./verifyBackup');
const { previousModifiedDate, writeToS3 } = require('./s3Utils');
const path = require('path');

const sftp = new Client();

const getModifiedDate = async (sftp, zip) => {
    const files = await sftp.list('./');
    const data = files.filter(file => file.name === zip)[0];
    console.log('latest modifed date:', new Date(data.modifyTime).toISOString());
    console.log('size:', Math.round((data.size / 1024 / 1024) * 100) / 100, 'MB');
    return `${data.modifyTime}`;
};

const downloadFile = async (sftp, md5, zip, tmp) => {
    const start = Date.now();

    await sftp.fastGet(md5, path.join(tmp, md5));
    await sftp.fastGet(zip, path.join(tmp, zip));

    const end = Date.now();
    console.log(`Time to get file: ${end - start}ms`);
};

exports.handler = async (event, context) => {
    try {
        const md5 = '<md5-file>';
        const zip = '<zip-file>';

        const TEMP_DIR = '/tmp';
        const md5Path = path.join(TEMP_DIR, md5);
        const zipPath = path.join(TEMP_DIR, zip);

        await sftp.connect({
            host: process.env.HOST,
            port: process.env.PORT,
            username: process.env.USERNAME,
            password: process.env.PASSWORD
        });
        const modifiedDate = await getModifiedDate(sftp, zip);
        const prevModifiedDate = await previousModifiedDate(zip);

        if (prevModifiedDate >= modifiedDate) {
            console.log('No new backup found');
            return;
        }

        console.log('New backup found. Downloading...');
        await downloadFile(sftp, md5, zip, TEMP_DIR);
        await verifyBackup(zipPath, md5Path);

        console.log('Uploading to S3...');
        await writeToS3(zipPath, md5Path, modifiedDate);
    } catch (err) {
        console.log(err, 'catch error');
    } finally {
        sftp.end();
    }
};
