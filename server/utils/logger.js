import winston from 'winston';
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
import { schedule } from 'node-cron'; // Corrected import for node-cron

dotenv.config();

// Log cleanup function
const cleanupOldLogs = () => {
    // It's generally safer to define logDir relative to the current file
    // or use a configuration variable, but process.cwd() is fine if that's your intent.
    const logDir = process.cwd();
    const files = ['error.log', 'combined.log'];
    const daysToKeep = 7;
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    files.forEach(file => {
        const filePath = path.join(logDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileAgeDays = (now - stats.mtimeMs) / msPerDay;
            
            if (fileAgeDays > daysToKeep) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted old log file: ${file}`);
                } catch (err) {
                    console.error(`Error deleting log file ${file}:`, err);
                }
            }
        }
    });
};

// Schedule daily cleanup at 2 AM
// Use the imported 'schedule' function directly
schedule('0 2 * * *', cleanupOldLogs);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({
            stack: true
        }),
        winston.format.splat(),
        winston.format.json()
    ),

    transports : [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({filename: 'error.log', level:'error'}),
        new winston.transports.File({filename: 'combined.log'})
    ]
});

export default logger;
