const https = require('https');

const BASE_URL = 'https://api-production.up.railway.app/api';

const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Current Puja', path: '/puja/current' },
    { name: 'Festivals List', path: '/festivals' },
    { name: 'Swagger Documentation', path: '/docs' },
    { name: 'Static Uploads Prefix', path: '/uploads' },
    { name: 'Analytics Public (If any)', path: '/analytics' },
];

async function checkEndpoint(endpoint) {
    const url = `${BASE_URL}${endpoint.path}`;
    return new Promise((resolve) => {
        process.stdout.write(`Checking ${endpoint.name.padEnd(25)} [${url}] ... `);
        https.get(url, (res) => {
            const status = res.statusCode;
            const color = status < 400 ? '\x1b[32m' : '\x1b[31m';
            console.log(`${color}${status}\x1b[0m`);
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Just diagnostic
                resolve({ name: endpoint.name, status });
            });
        }).on('error', (err) => {
            console.log(`\x1b[31mERROR: ${err.message}\x1b[0m`);
            resolve({ name: endpoint.name, status: 'ERROR' });
        });
    });
}

async function run() {
    console.log('\x1b[36m\x1b[1m--- COMPREHENSIVE LIVE API VERIFICATION ---\x1b[0m\x1b[0m');
    console.log(`Time: ${new Date().toLocaleString()}\n`);
    
    const results = [];
    for (const ep of endpoints) {
        results.push(await checkEndpoint(ep));
    }
    
    console.log('\n\x1b[36m--------------------------------------------\x1b[0m');
    const successCount = results.filter(r => r.status < 400).length;
    console.log(`Summary: ${successCount}/${endpoints.length} endpoints responded with success.`);
    
    if (results.some(r => r.status === 404)) {
        console.log('\n\x1b[33mNOTE: 404 "Application not found" usually means Railway is still deploying or the domain mapping is pending.\x1b[0m');
    }
}

run();
