export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface LogContext {
	[key: string]: any;
}

export interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context?: LogContext;
	error?: {
		name: string;
		message: string;
		stack?: string;
	};
}

// ANSI color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	gray: '\x1b[90m',
};

class Logger {
	private logLevel: LogLevel;

	constructor(logLevel: LogLevel = LogLevel.INFO) {
		this.logLevel = logLevel;
	}

	private shouldLog(level: LogLevel): boolean {
		return level >= this.logLevel;
	}

	private formatTimestamp(): string {
		return new Date().toISOString();
	}

	private createLogEntry(level: string, message: string, context?: LogContext, error?: Error): LogEntry {
		const entry: LogEntry = {
			timestamp: this.formatTimestamp(),
			level,
			message,
		};

		if (context && Object.keys(context).length > 0) {
			entry.context = context;
		}

		if (error) {
			entry.error = {
				name: error.name,
				message: error.message,
				stack: error.stack,
			};
		}

		return entry;
	}

	private getLevelColor(level: string): string {
		switch (level.toUpperCase()) {
			case 'DEBUG':
				return colors.gray;
			case 'INFO':
				return colors.blue;
			case 'WARN':
				return colors.yellow;
			case 'ERROR':
				return colors.red;
			default:
				return colors.reset;
		}
	}

	private formatContext(context?: LogContext): string {
		if (!context || Object.keys(context).length === 0) {
			return '';
		}

		const formatted = Object.entries(context)
			.map(([key, value]) => {
				// Handle different value types
				if (typeof value === 'string') {
					return `${key}="${value}"`;
				} else if (typeof value === 'number') {
					return `${key}=${value}`;
				} else if (typeof value === 'boolean') {
					return `${key}=${value}`;
				} else {
					return `${key}=${JSON.stringify(value)}`;
				}
			})
			.join(' ');

		return ` [${formatted}]`;
	}

	private output(entry: LogEntry): void {
		// Colorized development output with brackets
		const timestamp = `${colors.gray}${entry.timestamp.split('T')[1].split('.')[0]}${colors.reset}`;
		const levelColor = this.getLevelColor(entry.level);
		const level = `${levelColor}${entry.level.toUpperCase().padEnd(5)}${colors.reset}`;
		const message = `${colors.bright}${entry.message}${colors.reset}`;
		const context = `${colors.cyan}${this.formatContext(entry.context)}${colors.reset}`;

		let output = `${timestamp} [${level}] ${message}${context}`;

		if (entry.error) {
			output += `\n${colors.red}  ↳ Error: ${entry.error.name}: ${entry.error.message}${colors.reset}`;
			if (entry.error.stack) {
				output += `\n${colors.gray}    ${entry.error.stack.split('\n').slice(1).join('\n    ')}${colors.reset}`;
			}
		}

		console.log(output);
	}

	debug(message: string, context?: LogContext): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			const entry = this.createLogEntry('debug', message, context);
			this.output(entry);
		}
	}

	info(message: string, context?: LogContext): void {
		if (this.shouldLog(LogLevel.INFO)) {
			const entry = this.createLogEntry('info', message, context);
			this.output(entry);
		}
	}

	warn(message: string, context?: LogContext, error?: Error): void {
		if (this.shouldLog(LogLevel.WARN)) {
			const entry = this.createLogEntry('warn', message, context, error);
			this.output(entry);
		}
	}

	error(message: string, context?: LogContext, error?: Error): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			const entry = this.createLogEntry('error', message, context, error);
			this.output(entry);
		}
	}

	// Convenience method for logging errors with automatic context extraction
	logError(error: Error, message?: string, context?: LogContext): void {
		const errorMessage = message || `Unhandled error: ${error.message}`;
		this.error(errorMessage, context, error);
	}

	// Method to log API calls
	logApiCall(method: string, url: string, statusCode?: number, duration?: number, context?: LogContext): void {
		const apiContext = {
			method,
			url,
			statusCode,
			duration: duration ? `${duration}ms` : undefined,
			...context,
		};

		if (statusCode && statusCode >= 400) {
			this.warn(`API call failed`, apiContext);
		} else {
			this.info(`API call completed`, apiContext);
		}
	}

	// Method to log scheduled job events
	logJobEvent(event: string, jobName: string, context?: LogContext): void {
		const jobContext = {
			event,
			jobName,
			...context,
		};

		this.info(`Job event: ${event}`, jobContext);
	}

	// Method to create child logger with persistent context
	child(persistentContext: LogContext): Logger {
		const childLogger = new Logger(this.logLevel);

		// Override output to include persistent context
		const originalOutput = childLogger.output.bind(childLogger);
		childLogger.output = (entry: LogEntry) => {
			entry.context = { ...persistentContext, ...entry.context };
			originalOutput(entry);
		};

		return childLogger;
	}
}

// Create default logger instance
function createLogger(): Logger {
	// In Cloudflare Workers, detect environment
	const isDevelopment =
		typeof globalThis !== 'undefined' && ((globalThis as any).ENVIRONMENT === 'development' || process?.env?.NODE_ENV === 'development');

	const logLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

	return new Logger(logLevel);
}

export const logger = createLogger();

// Export the Logger class for creating custom instances
export { Logger };

// Utility functions for common logging patterns
export const loggers = {
	// Logger for API operations
	api: logger.child({ component: 'api' }),

	// Logger for database operations
	database: logger.child({ component: 'database' }),

	// Logger for scheduled jobs
	scheduler: logger.child({ component: 'scheduler' }),

	// Logger for Challonge operations
	challonge: logger.child({ component: 'challonge' }),
};
