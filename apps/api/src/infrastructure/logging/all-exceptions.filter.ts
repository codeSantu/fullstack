import { Catch, ArgumentsHost, HttpException, HttpStatus, LoggerService } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
    constructor(private readonly logger: LoggerService) {
        super();
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error';

        // CloudWatch ready standardized JSON format
        this.logger.error('Unhandled Exception Caught', {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            status: status,
            message: message,
            stack: exception instanceof Error ? exception.stack : 'No stack trace available',
        });

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
        });
    }
}
