const crypto = require('crypto');
const fs = require('fs');

// Function to calculate MD5 hash of a file
function calculateMD5(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => {
            hash.update(data);
        });

        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });

        stream.on('error', (error) => {
            reject(error);
        });
    });
}

// Function to read MD5 hash from a file
function readMD5File(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data.split(' ')[0].trim());
            }
        });
    });
}

// Main function to verify a file with an MD5 file
async function verifyFileWithMD5(file, md5File) {
    console.log('verifying backup...');
    try {
        const [calculatedMD5, md5FromFile] = await Promise.all([
            calculateMD5(file),
            readMD5File(md5File)
        ]);

        console.log('calculatedMD5:', calculatedMD5);
        console.log('md5FromFile:', md5FromFile);

        if (calculatedMD5 === md5FromFile) {
            console.log('The file is verified successfully.');
        } else {
            console.log('The file is not verified.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

module.exports = verifyFileWithMD5;
