import 'dotenv/config';
import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const url = process.env.TURSO_DB_URL;
    const authToken = process.env.TURSO_TOKEN;

    if (!url || !authToken) {
        console.error('TURSO_DB_URL and TURSO_TOKEN are required');
        process.exit(1);
    }

    const client = createClient({ url, authToken });
    const sqlPath = path.join(__dirname, 'prisma', 'schema_utf8.sql');
    
    // Read the file. Note: The previous view_file failed with UTF-16LE error. 
    // PowerShell redirection often creates UTF-16LE. We need to handle it or ensure UTF-8.
    const sql = fs.readFileSync(sqlPath, 'utf8').replace(/^\uFEFF/, ''); // Remove BOM if present

    console.log('Applying schema to Turso...');
    
    // Split by semicolons and execute each statement
    // This is a naive split, but migration scripts are usually simple enough.
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const statement of statements) {
        try {
            await client.execute(statement);
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.warn(`Statement skipped (exists): ${statement.substring(0, 50)}...`);
            } else {
                console.error(`Error executing statement: ${statement}`);
                console.error(e.message);
            }
        }
    }

    console.log('Schema applied successfully.');
}

main().catch(console.error);
