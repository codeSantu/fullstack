import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator, HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

@Controller('health')
export class HealthController extends HealthIndicator {
    constructor(
        private health: HealthCheckService,
        private prismaHealth: PrismaHealthIndicator,
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {
        super();
    }

    private async checkRedis(): Promise<HealthIndicatorResult> {
        // @ts-ignore - access private isConnected for health check, or just ping if possible
        const isUp = (this.redis as any).isConnected;
        const result = this.getStatus('redis', isUp);
        if (isUp) return result;
        throw new HealthCheckError('Redis cache failed', result);
    }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database', this.prisma),
            () => this.checkRedis(),
        ]);
    }
}
