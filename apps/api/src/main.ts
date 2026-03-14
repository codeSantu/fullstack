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
        origin: true, // Allow all origins in production, or configure via env if stricter control is needed
        credentials: true,
    });

    await app.listen(3001);
    app.get(WINSTON_MODULE_NEST_PROVIDER).log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
