import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;
    private isConnected = false;
    private fallbackPromise: Promise<void> | null = null;

    constructor() {
        let redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            let host = process.env.REDIS_HOST || process.env.REDISHOST;
            const port = process.env.REDIS_PORT || process.env.REDISPORT || '6379';
            const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || '';
            const user = process.env.REDIS_USER || process.env.REDISUSER || '';

            // If we are local (detected via Windows/Mac) and host looks like railway internal, ignore it
            const isLocalDev = process.platform === 'win32' || process.platform === 'darwin';
            if (isLocalDev && host?.includes('railway.internal')) {
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
                    if (retries > 1) {
                        return new Error('RECONNECT_LOCAL_FALLBACK');
                    }
                    return 500;
                }
            }
        });

        this.client.on('error', (err) => {
            if (err.message === 'RECONNECT_LOCAL_FALLBACK') {
                if (!this.fallbackPromise) {
                    this.fallbackPromise = this.reconnectToUniversalFallback();
                }
                return;
            }
            if (!this.isConnected && !this.client.isOpen) {
                console.warn(`Redis Connection Attempt failed: ${err.message}`);
            }
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('Redis connected successfully');
        });
    }

    private async reconnectToUniversalFallback() {
        if (this.isConnected) return;
        
        // Universal list of fallbacks for local dev, containers, and virtual environments
        const fallbacks = [
            'redis://127.0.0.1:6379',
            'redis://host.docker.internal:6379',
            'redis://localhost:6379'
        ];

        for (const url of fallbacks) {
            if (this.isConnected) break;
            console.log(`Trying Redis fallback: ${url}`);
            try {
                if (this.client) {
                    await this.client.disconnect().catch(() => {});
                }
                this.client = createClient({ 
                    url,
                    socket: { connectTimeout: 1500 }
                });
                this.client.on('error', () => { this.isConnected = false; });
                this.client.on('connect', () => {
                    this.isConnected = true;
                    console.log(`Redis connected to fallback: ${url}`);
                });
                await this.client.connect();
                if (this.isConnected) return;
            } catch (e) {
                // Continue to next fallback
            }
        }
        
        if (!this.isConnected) {
            console.warn('All Redis fallbacks failed. Running in degraded cache mode.');
        }
    }

    async onModuleInit() {
        try {
            await this.client.connect().catch(() => {});
            
            // If the initial connection triggered a fallback, wait for the fallback to finish
            if (this.fallbackPromise) {
                await this.fallbackPromise;
            }

            if (!this.isConnected) {
                console.warn('Redis not available. Starting in degraded mode.');
            }
        } catch (e) {
            console.warn('Redis startup integration failed. Degraded mode active.');
        }
    }

    async onModuleDestroy() {
        if (this.isConnected && this.client) {
            try {
                await this.client.quit();
            } catch {
                // Ignore close errors
            }
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch {
            return null;
        }
    }

    async set(key: string, value: string, expirationSeconds: number = 300): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.setEx(key, expirationSeconds, value);
        } catch {
            // Ignore
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
