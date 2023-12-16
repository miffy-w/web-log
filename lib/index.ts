import WebLogger, { LoggerConfig } from './web-logger';
import { WorkerLogger } from './worker-logger';

export function createLogger(options?: LoggerConfig): WebLogger;
export function createLogger(
  options?: LoggerConfig,
  worker?: Worker
): WorkerLogger;
export function createLogger(options?: LoggerConfig, worker?: Worker) {
  if (worker) {
    return new WorkerLogger(options, worker);
  } else {
    return new WebLogger(options);
  }
}
