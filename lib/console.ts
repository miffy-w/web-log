import { LogLevel } from './util';

export class Write {
  async write<T = any>(data: T, label = 'LOG', level = LogLevel.Info) {
    let logFn = console.log.bind(console);
    switch (level) {
      case LogLevel.Fatal:
      case LogLevel.Error:
        logFn = console.error.bind(console);
        break;
      case LogLevel.Warn:
        logFn = console.warn.bind(console);
        break;
      case LogLevel.Debug:
        logFn = console.debug.bind(console);
        break;
      default:
        break;
    }
    return logFn(`${label}:`, data);
  }
  /** Info 日志 */
  i = <T = any>(data: T, tag = 'LOG') => this.write(data, tag, LogLevel.Info);

  /** Error 日志 */
  e = <T = any>(data: T, tag = 'LOG') => this.write(data, tag, LogLevel.Error);

  /** Trace 日志 */
  t = <T = any>(data: T, tag = 'LOG') => this.write(data, tag, LogLevel.Trace);

  /** Fatal 日志 */
  f = <T = any>(data: T, tag = 'LOG') => this.write(data, tag, LogLevel.Fatal);

  /** Debug 日志 */
  d = <T = any>(data: T, tag = 'LOG') => this.write(data, tag, LogLevel.Debug);

  /** Warn 日志 */
  w = <T = any>(data: T, tag = 'LOG') => this.write(data, tag, LogLevel.Warn);
}
