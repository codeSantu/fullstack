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

        redisUrl = redisUrl || 'redis://127.0.0.1:6379';
        this.client = createClient({ url: redisUrl });

        this.client.on('error', (err) => {
            const sanitizedUrl = (redisUrl || '').replace(/:[^:@]+@/, ':***@');
            console.warn(`Redis Cache Error (${sanitizedUrl}):`, err.message);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            this.isConnected = true;
        });
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
