import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;
    private isConnected = false;

    constructor() {
        let redisUrl = process.env.REDIS_URL;
        const isLocal = process.platform === 'win32' || process.platform === 'darwin' || process.env.NODE_ENV === 'development';

        if (!redisUrl) {
            let host = process.env.REDIS_HOST || process.env.REDISHOST;
            const port = process.env.REDIS_PORT || process.env.REDISPORT || '6379';
            const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || '';
            const user = process.env.REDIS_USER || process.env.REDISUSER || '';

            // Proactive local detection: if we are local and host looks like railway internal, ignore it
            if (isLocal && host?.includes('railway.internal')) {
                console.log('Local environment detected. Skipping Railway internal Redis host:', host);
                host = undefined;
            }

            if (host) {
                const auth = password ? (user ? `${user}:${password}@` : `default:${password}@`) : '';
                redisUrl = `redis://${auth}${host}:${port}`;
            }
        }

        // Hard fallback for local development
        const finalUrl = redisUrl || 'redis://127.0.0.1:6379';
        const sanitizedUrl = finalUrl.replace(/:[^:@]+@/, ':***@');
        
        console.log(`Initializing Redis client with: ${sanitizedUrl}`);

        this.client = createClient({ 
            url: finalUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 2) {
                        if (finalUrl.includes('railway.internal') || !this.isConnected) {
                            return new Error('RECONNECT_LOCAL_FALLBACK');
                        }
                        return new Error('Retry limit reached');
                    }
                    return Math.min(retries * 500, 2000);
                }
            }
        });

        this.client.on('error', (err) => {
            if (err.message === 'RECONNECT_LOCAL_FALLBACK') {
                if (isLocal || finalUrl.includes('railway.internal')) {
                    this.reconnectToLocalFallback();
                }
                return;
            }
            if (!this.isConnected) {
                console.warn(`Redis Connection Warning: ${err.message}`);
            }
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('Redis connected successfully');
        });
    }

    private async reconnectToLocalFallback() {
        if (this.isConnected) return;
        
        console.log('Attempting Redis connection to localhost fallback...');
        try {
            if (this.client) {
                await this.client.disconnect().catch(() => {});
            }
            this.client = createClient({ url: 'redis://127.0.0.1:6379' });
            this.client.on('error', (err) => {
                if (!this.isConnected) console.warn('Redis Fallback Error:', err.message);
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('Redis connected to local fallback');
            });
            await this.client.connect().catch(() => {});
        } catch (e) {
            // Silently fail after fallback
        }
    }

    async onModuleInit() {
        try {
            await this.client.connect();
        } catch (e) {
            console.warn('Could not connect to Redis on startup. Running in degraded cache mode.');
        }
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.client.quit();
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch {
            return null; // Graceful degradation
        }
    }

    async set(key: string, value: string, expirationSeconds: number = 300): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.setEx(key, expirationSeconds, value);
        } catch {
            // Ignore set errors to not break application flow
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.del(key);
        } catch {
            // Ignore
        }
    }
}
