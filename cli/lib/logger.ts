/**
 * Structured logger for CLI operational events.
 * Emits JSON lines for status, errors, and operational events.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEvent {
  timestamp: string;
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(event: string, fields?: Record<string, unknown>): void;
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  error(event: string, fields?: Record<string, unknown>): void;
}

function emitLog(level: LogLevel, event: string, fields?: Record<string, unknown>): void {
  const logEvent: LogEvent = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const output = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  output.write(JSON.stringify(logEvent) + '\n');
}

export function createLogger(): Logger {
  return {
    debug: (event, fields) => emitLog('debug', event, fields),
    info: (event, fields) => emitLog('info', event, fields),
    warn: (event, fields) => emitLog('warn', event, fields),
    error: (event, fields) => emitLog('error', event, fields),
  };
}

export const logger = createLogger();
