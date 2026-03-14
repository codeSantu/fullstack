import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis | null = null;
    private isConnected = false;

    constructor() { }

    async onModuleInit() {
        let redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            let host = process.env.REDIS_HOST || process.env.REDISHOST;
            const port = parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379', 10);
            const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || '';
            const user = process.env.REDIS_USER || process.env.REDISUSER || '';

            // Skip railway internal if local (windows/mac)
            const isLocalDev = process.platform === 'win32' || process.platform === 'darwin';
            if (isLocalDev && host?.includes('railway.internal')) {
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
            this.logger.log(`Attempting Redis connection: ${sanitizedUrl}`);

            try {
                const tempClient = new Redis(url, {
                    connectTimeout: 2000,
                    maxRetriesPerRequest: 1,
                    retryStrategy: () => null // Don't auto-retry here, we handle the sequence
                });

                await new Promise<void>((resolve, reject) => {
                    tempClient.once('ready', () => resolve());
                    tempClient.once('error', (err) => reject(err));
                });

                this.client = tempClient;
                this.isConnected = true;
                this.logger.log(`Redis connected successfully to ${sanitizedUrl}`);
                break;
            } catch (err) {
                this.logger.warn(`Failed to connect to ${sanitizedUrl}: ${err.message}`);
                // Ensure client is closed
            }
        }

        if (this.isConnected && this.client) {
            this.client.on('error', (err) => {
                this.logger.warn(`Redis Runtime Error: ${err.message}`);
            });
        } else {
            this.logger.warn('All Redis connection attempts failed. Running in degraded cache mode.');
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
            // ioredis get returns Promise<string | null>
            return await this.client.get(key);
        } catch {
            return null;
        }
    }

    async set(key: string, value: string, expirationSeconds: number = 300): Promise<void> {
        if (!this.isConnected || !this.client) return;
        try {
            // ioredis uses setex(key, seconds, value) or set(key, value, 'EX', seconds)
            await this.client.setex(key, expirationSeconds, value);
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
