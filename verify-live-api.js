const https = require('https');

const endpoints = [
    'https://api-production.up.railway.app/',
    'https://api-production.up.railway.app/api',
    'https://api-production.up.railway.app/api/health',
];

async function checkEndpoint(url) {
    return new Promise((resolve) => {
        console.log(`Checking: ${url}...`);
        https.get(url, (res) => {
            console.log(`Status: ${res.statusCode}`);
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Data: ${data.substring(0, 100)}...`);
                resolve(true);
            });
        }).on('error', (err) => {
            console.error(`Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function run() {
    for (const url of endpoints) {
        await checkEndpoint(url);
    }
}

run();
