import 'dotenv/config';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { winstonConfig } from './infrastructure/logging/winston.config';
import { AllExceptionsFilter } from './infrastructure/logging/all-exceptions.filter';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Debug environment variables immediately on load
console.log('--- PRODUCTION ENVIRONMENT VERIFICATION ---');
const debugPrefixes = ['REDIS_', 'NEXT_PUBLIC_', 'TURSO_', 'JWT_', 'AWS_', 'DATABASE_'];
Object.keys(process.env).forEach(key => {
    if (debugPrefixes.some(p => key.startsWith(p)) || key.includes('DOPPLER') || key.includes('TOKEN')) {
        const val = process.env[key];
        const displayVal = val ? (val.length > 5 ? `${val.substring(0, 3)}...` : '[HIDDEN]') : '[EMPTY]';
        console.log(`Env Verify: ${key}=${displayVal}`);
    }
});
console.log('-------------------------------------------');

async function bootstrap() {
    // Inject Winston Logger Context
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: WinstonModule.createLogger(winstonConfig) });

    // Switch default internal logger to Winston globally
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    // Serve Local Static Assets for Virtual S3 Provider
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/api/uploads/',
    });

    // Register Global Exception Filter with Http Adapter and Winston
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(app.get(WINSTON_MODULE_NEST_PROVIDER)));

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // Prefix all HTTP routes with /api (e.g. /api/analytics, /api/festivals)
    app.setGlobalPrefix('api');

    // Security: Secure HTTP Headers configured for CORS compatibility
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

    // OpenAPI Documentation: Swagger
    const config = new DocumentBuilder()
        .setTitle('DDD Enterprise API')
        .setDescription('Organizer Hub V2 REST documentation.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || 
                origin.includes('.vercel.app') || 
                origin.includes('.railway.app') || 
                origin.includes('localhost') ||
                origin === 'https://jmks.vercel.app') {
                callback(null, true);
            } else {
                console.warn(`CORS REJECTED: ${origin}`);
                callback(new Error(`CORS Error: Origin ${origin} not allowed`));
            }
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization,x-organization-id',
    });

    await app.listen(3001);
}
bootstrap();
