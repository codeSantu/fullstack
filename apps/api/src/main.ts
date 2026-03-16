import { NestFactory } from '@nestjs/core';
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
     * TRUST PROXY (Railway / reverse proxy support)
     */
    app.set('trust proxy', 1);

    /**
     * USE WINSTON LOGGER
     */
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    /**
     * GLOBAL API PREFIX
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
     * GLOBAL VALIDATION
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
            contentSecurityPolicy: false, // required for Swagger
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
        'https://jmks.vercel.app',
        'https://jmksangha.netlify.app',
        'http://localhost:3000',
        'http://localhost:3001',
    ];

    app.enableCors({
        origin: (origin, callback) => {
            // allow curl, server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (
                allowedOrigins.includes(origin) ||
                origin.endsWith('.vercel.app') ||
                origin.endsWith('.railway.app') ||
                origin.endsWith('.netlify.app')
            ) {
                return callback(null, true);
            }

            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            return callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Accept',
            'Authorization',
            'x-organization-id',
        ],
        exposedHeaders: ['Content-Length'],
        optionsSuccessStatus: 204,
    });

    /**
     * PORT (Railway provides PORT)
     */
    const port = process.env.PORT || 3001;

    /**
     * START SERVER
     */
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Server running on port: ${port}`);
    logger.log(`🌍 API URL: http://localhost:${port}/api`);
    logger.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
}

bootstrap();