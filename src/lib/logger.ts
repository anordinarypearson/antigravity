type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    private log(level: LogLevel, message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output in development
        if (process.env.NODE_ENV === 'development') {
            const consoleMethod = level === 'debug' ? 'log' : level;
            console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '');
        }
    }

    debug(message: string, data?: any) {
        this.log('debug', message, data);
    }

    info(message: string, data?: any) {
        this.log('info', message, data);
    }

    warn(message: string, data?: any) {
        this.log('warn', message, data);
    }

    error(message: string, data?: any) {
        this.log('error', message, data);
    }

    getLogs(level?: LogLevel): LogEntry[] {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }
}

export const logger = new Logger();
