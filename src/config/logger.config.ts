import path from "path";
import winston from "winston";
import { cfg } from "../init";


const { combine, timestamp, json } = winston.format;
export const logger = winston.createLogger({
    level: cfg.LOG_LEVEL,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
        json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            level: 'error',
            filename: 'app-error.log',
            dirname: path.join(__dirname, "../../logs")
        })
    ]
});