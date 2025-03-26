import { NextResponse } from 'next/server';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  module: string;
  includeTimestamp?: boolean;
  logLevel?: LogLevel;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: any;
}

// Determine if we should print debug logs
const DEBUG_MODE = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';

export class Logger {
  private module: string;
  private includeTimestamp: boolean;
  private logLevel: LogLevel;
  
  constructor(options: LoggerOptions) {
    this.module = options.module;
    this.includeTimestamp = options.includeTimestamp ?? true;
    this.logLevel = options.logLevel ?? 'info';
  }
  
  private createLogEntry(level: LogLevel, message: string, details?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      details
    };
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.logLevel];
  }
  
  private log(level: LogLevel, message: string, details?: any): void {
    if (!this.shouldLog(level)) return;
    
    const entry = this.createLogEntry(level, message, details);
    
    // Format the log message
    let logMessage = '';
    
    if (this.includeTimestamp) {
      logMessage += `[${entry.timestamp}] `;
    }
    
    logMessage += `[${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;
    
    // Log to console with appropriate method
    switch (level) {
      case 'debug':
        if (DEBUG_MODE) {
          console.debug(logMessage, details ? details : '');
        }
        break;
      case 'info':
        console.info(logMessage, details ? details : '');
        break;
      case 'warn':
        console.warn(logMessage, details ? details : '');
        break;
      case 'error':
        console.error(logMessage, details ? details : '');
        break;
    }
  }
  
  debug(message: string, details?: any): void {
    this.log('debug', message, details);
  }
  
  info(message: string, details?: any): void {
    this.log('info', message, details);
  }
  
  warn(message: string, details?: any): void {
    this.log('warn', message, details);
  }
  
  error(message: string, details?: any): void {
    this.log('error', message, details);
  }
  
  // Helper for API routes to handle errors consistently
  apiError(message: string, error: any, statusCode: number = 500): NextResponse {
    this.error(message, error);
    
    const errorDetail = error instanceof Error 
      ? { message: error.message, stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined }
      : error;
      
    return NextResponse.json(
      { 
        error: message, 
        details: process.env.NODE_ENV !== 'production' ? errorDetail : undefined,
        success: false,
        timestamp: new Date().toISOString(),
      }, 
      { status: statusCode }
    );
  }
  
  // Helper for API success responses
  apiSuccess(data: any, statusCode: number = 200): NextResponse {
    return NextResponse.json(
      { 
        data, 
        success: true,
        timestamp: new Date().toISOString(),
      }, 
      { status: statusCode }
    );
  }
}

// Export a default instance for quick use
export const createLogger = (module: string, options: Omit<LoggerOptions, 'module'> = {}) => {
  return new Logger({ module, ...options });
}; 