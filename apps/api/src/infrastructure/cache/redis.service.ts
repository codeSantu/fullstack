import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;
    private isConnected = false;

    constructor() {
        let redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            // Check for underscored variables first (Doppler/User) then Railway defaults
            const host = process.env.REDIS_HOST || process.env.REDISHOST;
            const port = process.env.REDIS_PORT || process.env.REDISPORT || '6379';
            const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || '';
            const user = process.env.REDIS_USER || process.env.REDISUSER || '';

            if (host) {
                const auth = password ? (user ? `${user}:${password}@` : `default:${password}@`) : '';
                redisUrl = `redis://${auth}${host}:${port}`;
            }
        }

        // Hard fallback for local development or if Railway internal host fails
        redisUrl = redisUrl || 'redis://127.0.0.1:6379';
        
        this.client = createClient({ 
            url: redisUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        // After 3 attempts, if we were trying a railway internal host, try localhost
                        if (redisUrl?.includes('railway.internal')) {
                            console.warn('Switching to localhost redis fallback...');
                            return new Error('RECONNECT_LOCAL_FALLBACK');
                        }
                        return new Error('Retry limit reached');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        this.client.on('error', (err) => {
            if (err.message === 'RECONNECT_LOCAL_FALLBACK') {
                this.reconnectToLocalFallback();
                return;
            }
            const sanitizedUrl = (redisUrl || '').replace(/:[^:@]+@/, ':***@');
            console.warn(`Redis Cache Error (${sanitizedUrl}):`, err.message);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('Redis connected successfully');
        });
    }

    private async reconnectToLocalFallback() {
        console.log('Attempting Redis connection to localhost:6379');
        try {
            if (this.client) {
                await this.client.disconnect().catch(() => {});
            }
            this.client = createClient({ url: 'redis://127.0.0.1:6379' });
            this.client.on('error', (err) => {
                console.warn('Redis Fallback Error:', err.message);
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('Redis connected to local fallback');
            });
            await this.client.connect();
        } catch (e) {
            console.warn('Final Redis connection attempt failed.');
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
