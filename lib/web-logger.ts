import { Write } from './console';
import LogDB, { DbOptions } from './db';
import { replaceSensitiveData, FilterWords } from './filter';
import {
  LogItem,
  Formatter,
  LogLevel,
  FormatCode,
  LoggerKey,
  download,
} from './util';
import WritingMiddleware, { MiddlewareFn } from './middleware';

export interface LoggerConfig {
  /** 日志格式化形式，在日志导出时会用到 */
  formatter?: Formatter;
  /** 日志对应的 key，默认使用 date 作为 key */
  key?: LoggerKey;
  /** logDB 配置 */
  dbOptions?: DbOptions;
  /** 是否启用写入、读取功能，默认：true */
  enable?: boolean;
  /**
   * 过滤敏感数据，尽量在写入之前就过滤掉敏感数据
   * 传入的数组，会查找对象中包含的该参数，把值替换一下
   * 或者 key=value 形式也会被替换，默认：`filterSensitiveData: [
      { name: 'securityKey' },
      { name: 'xyToken' },
      { name: 'token' },
    ]`
  */
  filterSensitiveData?: FilterWords;
  /** 是否启用过滤，默认：启用（true） */
  enbaleFilterSensitiveData?: boolean;
}

export const defaultFilterSensitiveData: FilterWords = {
  securityKey: {},
  xyToken: {},
  token: {},
};

const DEFAULT_OPTIONS: Required<LoggerConfig> = {
  key: 'date',
  dbOptions: {},
  enable: true,
  enbaleFilterSensitiveData: true,
  filterSensitiveData: defaultFilterSensitiveData,
  formatter: `${FormatCode.Date} [${FormatCode.Type}] ${FormatCode.Idx} [${FormatCode.Label}] - ${FormatCode.Msg}\r\n`,
};

export default class WebLogger extends Write {
  LEVEL = LogLevel;

  private _count = 0;

  logDB: LogDB;
  options: Required<LoggerConfig>;
  private beforeWritingMiddleware: WritingMiddleware;
  constructor(options?: LoggerConfig) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logDB = new LogDB(this.options.dbOptions);

    this.getBlob = this.getBlob.bind(this);
    this.toString = this.toString.bind(this);
    this.download = this.download.bind(this);

    /** 注册中间件 */
    this.beforeWritingMiddleware = new WritingMiddleware([
      (log) => {
        return typeof log === 'string' ? log : JSON.stringify(log);
      },
    ]);
    this.registerMiddleware = this.registerMiddleware.bind(this);
  }

  private async getKey(log: LogItem) {
    const logKeyConf = this.options.key;
    if (logKeyConf === 'date') {
      return log.d;
    }
    if (typeof logKeyConf === 'function') {
      return logKeyConf(log);
    }
    const len = this._count > 0 ? ++this._count : await this.logDB.length();
    return len;
  }

  /** 最先注册的中间件会最后才去执行 */
  registerMiddleware(fn: MiddlewareFn) {
    this.beforeWritingMiddleware.append(fn);
  }

  /** 写日志 */
  override async write<T = any>(data: T, label = 'LOG', level = LogLevel.Info) {
    if (!this.options.enable) return;
    const msg = await this.beforeWritingMiddleware.run(data);
    /** 写入之前判断是否需要过滤敏感字段 */
    const { enbaleFilterSensitiveData } = this.options;
    const logPayload = enbaleFilterSensitiveData
      ? replaceSensitiveData(msg, this.options.filterSensitiveData)
      : msg;

    const log: LogItem = {
      d: new Date().toLocaleString(),
      lv: level,
      lb: label,
      m: logPayload,
    };
    const dbKey = await this.getKey(log);
    /** 把日志写入 indexedDB 中 */
    this.logDB.setItem(dbKey.toString(), log);
  }

  getLogText(template: string, log: LogItem, idx: number): string {
    const { d, m, lb, lv } = log;
    return template
      .replace(FormatCode.Date, d)
      .replace(FormatCode.Idx, `${idx}`)
      .replace(FormatCode.Label, lb)
      .replace(FormatCode.Msg, m)
      .replace(FormatCode.Type, lv);
  }

  /**
   * 导出日志
   * 根据 options 中的 formatter 参数生成对应的日志格式
   */
  override toString(): Promise<string> {
    const { formatter } = this.options;
    return new Promise((resolve, reject) => {
      if (!this.options.enable) resolve('');
      let result = '';
      this.logDB.lf.iterate(
        (item: LogItem, _: string, idx: number) => {
          if (typeof formatter === 'function') {
            result = formatter(item, idx, result);
          } else if (typeof formatter === 'string') {
            const log = this.getLogText(formatter, item, idx);
            result = `${log}${result}`;
          } else {
            reject(new Error('Invalid formatter'));
          }
        },
        (err: unknown) => {
          err ? reject(err) : resolve(result);
        }
      );
    });
  }

  /** 生成 blob 数据 */
  async getBlob() {
    /** 生成 log 文本 */
    const logText = await this.toString();
    const blob = new Blob([logText]);
    return blob;
  }

  async download(filename = 'app.log') {
    if (!this.options.enable) return;
    const blob = await this.getBlob();
    download(blob, filename);
  }
}
