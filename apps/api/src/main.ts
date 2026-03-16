import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common'; // Added Logger for startup info
import { winstonConfig } from './infrastructure/logging/winston.config';
import { AllExceptionsFilter } from './infrastructure/logging/all-exceptions.filter';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const logger = new Logger('Bootstrap'); // Simple logger for port verification

    // Inject Winston Logger Context
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: WinstonModule.createLogger(winstonConfig)
    });

    // Switch default internal logger to Winston globally
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    // Prefix all HTTP routes with /api BEFORE Swagger/Static Assets
    app.setGlobalPrefix('api');
    // Serve Local Static Assets for Virtual S3 Provider
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/api/uploads/',
    });

    // Register Global Exception Filter
    app.useGlobalFilters(new AllExceptionsFilter(app.get(WINSTON_MODULE_NEST_PROVIDER)));

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

    // Security: Secure HTTP Headers
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false, // Often needed for Swagger UI to load in prod
    }));

    // OpenAPI Documentation
    const config = new DocumentBuilder()
        .setTitle('DDD Enterprise API')
        .setDescription('Organizer Hub V2 REST documentation.')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const allowedOrigins = [
        '*',
        'https://jmks.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'https://jmksangha.netlify.app',
    ];

    //hh
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin ||
                allowedOrigins.includes(origin) ||
                origin.endsWith('.vercel.app') ||
                origin.endsWith('.railway.app')) {
                callback(null, true);
            } else {
                callback(new Error(`CORS Error: Origin ${origin} not allowed`));
            }
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Accept,Authorization,x-organization-id',
    });

    // CRITICAL: Use the PORT provided by Railway or fallback to 3001
    const port = process.env.PORT || 3001;

    // BINDING: Ensure we use '0.0.0.0' for Railway's internal network routing
    await app.listen(port, '0.0.0.0');

    logger.log(`Server is successfully running on port: ${port}`);
    logger.log(`Swagger Docs available at: /api/docs`);
}
bootstrap();