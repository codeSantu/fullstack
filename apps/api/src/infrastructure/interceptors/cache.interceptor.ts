import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    constructor(private redisService: RedisService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        // Only intercept GET requests
        if (request.method !== 'GET') {
            return next.handle();
        }

        const cacheKey = `route-cache:${request.url}`;
        const cachedData = await this.redisService.get(cacheKey);

        if (cachedData) {
            console.log(`[CacheInterceptor] CACHE HIT for ${request.url}`);
            return of(JSON.parse(cachedData));
        }

        console.log(`[CacheInterceptor] CACHE MISS for ${request.url}`);
        return next.handle().pipe(
            tap(async (response) => {
                // Cache response for 60 seconds TTL
                await this.redisService.set(cacheKey, JSON.stringify(response), 60);
            }),
        );
    }
}
