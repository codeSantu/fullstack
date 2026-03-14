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
                host = undefined;
            }

            if (host) {
                const auth = password ? (user ? `${user}:${password}@` : `default:${password}@`) : '';
                redisUrl = `redis://${auth}${host}:${port}`;
            }
        }

        const finalUrl = redisUrl || 'redis://127.0.0.1:6379';
        const sanitizedUrl = finalUrl.replace(/:[^:@]+@/, ':***@');
        console.log(`Initializing Redis client with: ${sanitizedUrl}`);

        this.client = createClient({ 
            url: finalUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 2) {
                        return new Error('RECONNECT_LOCAL_FALLBACK');
                    }
                    return Math.min(retries * 500, 2000);
                }
            }
        });

        this.client.on('error', (err) => {
            if (err.message === 'RECONNECT_LOCAL_FALLBACK') {
                this.reconnectToLocalFallback();
                return;
            }
            if (!this.isConnected && !this.client.isOpen) {
                // Only log if we aren't even connected yet
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
        
        const fallbacks = ['redis://127.0.0.1:6379'];
        // If we are in a Linux environment (like a container), try host.docker.internal
        if (process.platform === 'linux') {
            fallbacks.push('redis://host.docker.internal:6379');
        }

        for (const url of fallbacks) {
            if (this.isConnected) break;
            console.log(`Attempting Redis connection to fallback: ${url}`);
            try {
                if (this.client) {
                    await this.client.disconnect().catch(() => {});
                }
                this.client = createClient({ 
                    url,
                    socket: { connectTimeout: 2000 }
                });
                this.client.on('error', () => { this.isConnected = false; });
                this.client.on('connect', () => {
                    this.isConnected = true;
                    console.log(`Redis connected to fallback: ${url}`);
                });
                await this.client.connect();
                if (this.isConnected) return;
            } catch (e) {
                // Try next fallback
            }
        }
        
        if (!this.isConnected) {
            console.warn('All Redis connection attempts failed. Running in degraded mode.');
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
