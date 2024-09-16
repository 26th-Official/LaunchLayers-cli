#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const SERVER_URL = 'http://localhost:3001';
async function downloadFile(file_id, outputPath) {
    const writer = fs.createWriteStream(outputPath);

    const response = await axios({
        url: `${SERVER_URL}/output/${file_id}.zip`,
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function unzipFile(zipPath) {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(path.dirname(zipPath), true);
}

async function main(file_id) {
    const zipPath = path.join(__dirname,"output");
    await downloadFile(file_id, zipPath);
    unzipFile(zipPath);
    fs.unlinkSync(zipPath); // Delete the ZIP file
}

const [,, file_id] = process.argv;
if (!file_id) {
    console.error('Please provide a File ID');
    process.exit(1);
}

main(file_id).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
