/** 把小时转成毫秒 */
export const hourToMs = (hour: number) => {
  return hour * 3600000;
};

/** 默认：'%d [%t] %i [%l] - m%'，如：2023/6/15 16:22:08 [I] 1010 [req-conf] - xxxx */
export enum FormatCode {
  /** 日期 */
  Date = 'd%',
  /** type */
  Type = 't%',
  /** index */
  Idx = 'i%',
  /** label */
  Label = 'l%',
  /** message */
  Msg = 'm%',
}

export enum LogLevel {
  /** 普通信息 */
  Info = 'I',
  /** 调试信息 */
  Debug = 'D',
  /** 警告 */
  Warn = 'W',
  /** 错误 */
  Error = 'E',
  /** 跟踪 */
  Trace = 'T',
  /** 严重错误 */
  Fatal = 'F',
}

export interface LogItem {
  /** 时间字符串 */
  d: string;
  /** level */
  lv: LogLevel | string;
  /** message */
  m: any;
  /** label */
  lb: string;
}

export type Formatter =
  | string
  | ((log: LogItem, index: number, iterationStr: string) => string);

export type LoggerKey = 'date' | 'number' | ((log: LogItem) => string);

/** 下载日志 */
export const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.hidden = true;
  anchor.download = filename;
  anchor.click();
  anchor.remove();
};
