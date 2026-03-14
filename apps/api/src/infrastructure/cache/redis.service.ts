import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType | null = null;
    private isConnected = false;

    constructor() {}

    async onModuleInit() {
        let redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            let host = process.env.REDIS_HOST || process.env.REDISHOST;
            const port = process.env.REDIS_PORT || process.env.REDISPORT || '6379';
            const password = process.env.REDIS_PASSWORD || process.env.REDIS_PASSWORD || '';
            const user = process.env.REDIS_USER || process.env.REDISUSER || '';

            // Skip railway internal if local (windows/mac)
            if ((process.platform === 'win32' || process.platform === 'darwin') && host?.includes('railway.internal')) {
                host = undefined;
            }

            if (host) {
                const auth = password ? (user ? `${user}:${password}@` : `default:${password}@`) : '';
                redisUrl = `redis://${auth}${host}:${port}`;
            }
        }

        const initialUrl = redisUrl || 'redis://127.0.0.1:6379';
        
        // List of URLs to try in order
        const urlsToTry = [initialUrl];
        if (initialUrl !== 'redis://127.0.0.1:6379') urlsToTry.push('redis://127.0.0.1:6379');
        urlsToTry.push('redis://host.docker.internal:6379');
        urlsToTry.push('redis://localhost:6379');

        // Deduplicate
        const uniqueUrls = [...new Set(urlsToTry)];

        for (const url of uniqueUrls) {
            if (this.isConnected) break;
            
            const sanitizedUrl = url.replace(/:[^:@]+@/, ':***@');
            console.log(`Attempting Redis connection: ${sanitizedUrl}`);
            
            try {
                const tempClient = createClient({ 
                    url,
                    socket: { connectTimeout: 2000 }
                });
                
                tempClient.on('error', (err) => {
                    if (this.isConnected) {
                        console.warn('Redis Runtime Error:', err.message);
                    }
                });

                await tempClient.connect();
                
                this.client = tempClient as any;
                this.isConnected = true;
                console.log(`Redis connected successfully to ${sanitizedUrl}`);
                break;
            } catch (err) {
                console.log(`Failed to connect to ${sanitizedUrl}: ${err.message}`);
            }
        }

        if (!this.isConnected) {
            console.warn('All Redis connection attempts failed. Running in degraded cache mode.');
        }
    }

    async onModuleDestroy() {
        if (this.isConnected && this.client) {
            try {
                await this.client.quit();
            } catch {
                // Ignore
            }
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.isConnected || !this.client) return null;
        try {
            return await this.client.get(key);
        } catch {
            return null;
        }
    }

    async set(key: string, value: string, expirationSeconds: number = 300): Promise<void> {
        if (!this.isConnected || !this.client) return;
        try {
            await this.client.setEx(key, expirationSeconds, value);
        } catch {
            // Ignore
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected || !this.client) return;
        try {
            await this.client.del(key);
        } catch {
            // Ignore
        }
    }
}
