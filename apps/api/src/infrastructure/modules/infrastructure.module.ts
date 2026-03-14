import { Module, Global } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { S3Adapter } from '../adapters/s3.adapter';
import { LogService } from '../../application/services/log.service';

@Global()
@Module({
    providers: [RedisService, S3Adapter, LogService],
    exports: [RedisService, S3Adapter, LogService],
})
export class InfrastructureModule { }
