import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig: WinstonModuleOptions = {
    transports: [
        new winston.transports.Console({
            format: isProduction
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                )
                : winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.colorize(),
                    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        return `${timestamp} [${context || 'App'}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                    }),
                ),
        }),
    ],
};
