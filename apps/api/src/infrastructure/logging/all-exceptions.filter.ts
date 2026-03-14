import { Catch, ArgumentsHost, HttpException, HttpStatus, LoggerService } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
    constructor(private readonly logger: LoggerService) {
        super();
    }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
        const message =
            exception instanceof HttpException
                ? typeof exceptionResponse === 'object' 
                    ? (exceptionResponse as any).message || exception.message 
                    : exceptionResponse || exception.message
                : 'Internal server error';

        const isDebug = process.env.DEBUG_MODE === 'true';
        const stack = exception instanceof Error ? exception.stack : 'No stack trace available';

        // CloudWatch ready standardized JSON format
        this.logger.error('Unhandled Exception Caught', {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            status: status,
            message: message,
            stack: stack,
        });

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
            ...(isDebug ? { stack, debugInfo: (exception as any)?.response || exceptionResponse || null } : {}),
        });
    }
}
