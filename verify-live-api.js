const http = require('http');
const https = require('https');

const ENV = process.argv[2] === 'live' ? 'live' : 'local';
const BASE_URL = ENV === 'live' 
    ? 'https://api-production.up.railway.app/api' 
    : 'http://localhost:3001/api';

const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Current Puja', path: '/puja/current' },
    { name: 'Festivals List', path: '/festivals' },
    { name: 'Swagger Documentation', path: '/docs' },
    { name: 'Static Uploads Prefix', path: '/uploads' },
    { name: 'Analytics Public', path: '/analytics' },
];

async function checkEndpoint(endpoint) {
    const url = `${BASE_URL}${endpoint.path}`;
    const client = url.startsWith('https') ? https : http;
    
    return new Promise((resolve) => {
        process.stdout.write(`Checking ${endpoint.name.padEnd(25)} [${url}] ... `);
        client.get(url, (res) => {
            const status = res.statusCode;
            const color = status < 400 ? '\x1b[32m' : '\x1b[31m';
            console.log(`${color}${status}\x1b[0m`);
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ name: endpoint.name, status });
            });
        }).on('error', (err) => {
            console.log(`\x1b[31mERROR: ${err.message}\x1b[0m`);
            resolve({ name: endpoint.name, status: 'ERROR' });
        });
    });
}

async function run() {
    console.log(`\x1b[36m\x1b[1m--- COMPREHENSIVE ${ENV.toUpperCase()} API VERIFICATION ---\x1b[0m\x1b[0m`);
    console.log(`Time: ${new Date().toLocaleString()}\n`);
    
    const results = [];
    for (const ep of endpoints) {
        results.push(await checkEndpoint(ep));
    }
    
    console.log('\n\x1b[36m--------------------------------------------\x1b[0m');
    const successCount = results.filter(r => r.status < 400).length;
    console.log(`Summary: ${successCount}/${endpoints.length} endpoints responded with success.`);
    
    if (ENV === 'live' && results.some(r => r.status === 404)) {
        console.log('\n\x1b[33mNOTE: 404 "Application not found" usually means Railway is still deploying or domain propagation is pending.\x1b[0m');
    }
    
    if (ENV === 'local' && results.every(r => r.status === 'ERROR')) {
        console.log('\n\x1b[31mERROR: Local API is not running. Please start it with "npm run dev --workspace=api" in another terminal.\x1b[0m');
    }
}

run();
