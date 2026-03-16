import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { winstonConfig } from './infrastructure/logging/winston.config';
import { AllExceptionsFilter } from './infrastructure/logging/all-exceptions.filter';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * GLOBAL ERROR HANDLERS
 * Ensures Railway logs the real error instead of silent crash
 */
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: WinstonModule.createLogger(winstonConfig),
    });

    /**
     * TRUST PROXY (required for Railway / reverse proxies)
     */
    app.set('trust proxy', 1);

    /**
     * Use Winston as global logger
     */
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    /**
     * GLOBAL PREFIX
     */
    app.setGlobalPrefix('api');

    /**
     * STATIC FILES (uploads)
     */
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/api/uploads/',
    });

    /**
     * GLOBAL EXCEPTION FILTER
     */
    app.useGlobalFilters(
        new AllExceptionsFilter(app.get(WINSTON_MODULE_NEST_PROVIDER)),
    );

    /**
     * VALIDATION PIPE
     */
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    );

    /**
     * SECURITY HEADERS
     */
    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            contentSecurityPolicy: false, // needed for Swagger UI
        }),
    );

    /**
     * SWAGGER SETUP
     */
    const swaggerConfig = new DocumentBuilder()
        .setTitle('DDD Enterprise API')
        .setDescription('Organizer Hub V2 REST documentation.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, document);

    /**
     * CORS CONFIGURATION
     */
    const allowedOrigins = [
        '*',
        'https://jmks.vercel.app',
        'https://jmksangha.netlify.app',
        'http://localhost:3000',
        'http://localhost:3001',
    ];

    app.enableCors({
        origin: (origin, callback) => {
            if (
                !origin ||
                allowedOrigins.includes(origin) ||
                origin?.endsWith('.vercel.app') ||
                origin?.endsWith('.railway.app') ||
                origin?.endsWith('.netlify.app')
            ) {
                callback(null, true);
            } else {
                callback(new Error(`CORS Error: Origin ${origin} not allowed`));
            }
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders:
            'Content-Type,Accept,Authorization,x-organization-id',
    });

    /**
     * PORT (Railway provides PORT env)
     */
    const port = process.env.PORT || 3001;

    /**
     * START SERVER
     */
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Server running on port: ${port}`);
    logger.log(`📚 Swagger Docs available at: /api/docs`);
}

/**
 * BOOTSTRAP
 */
bootstrap();