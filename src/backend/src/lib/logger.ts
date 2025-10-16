import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}`;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), logFormat),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), timestamp(), logFormat)
        })
    ]
});

export function warn(message: string, meta?: Record<string, unknown>) {
    logger.warn(message, meta);
}

export function info(message: string, meta?: Record<string, unknown>) {
    logger.info(message, meta);
}

export function error(message: string, meta?: Record<string, unknown>) {
    logger.error(message, meta);
}
