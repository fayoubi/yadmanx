import winston from 'winston';
import { config } from '../config/index.js';
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json());
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
        metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
}));
export const logger = winston.createLogger({
    level: config.server.env === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'llm-quote-service' },
    transports: [
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});
// Log uncaught exceptions
logger.exceptions.handle(new winston.transports.Console({
    format: consoleFormat
}));
//# sourceMappingURL=logger.js.map