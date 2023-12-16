import localforage from 'localforage';
import { promisify } from 'es6-promisify';
import { LogItem, hourToMs } from './util';

export interface DbOptions {
  /** 最多存储的条目，默认：1W 条记录 */
  maxSize?: number;
  /** 数据库名称，默认：log-db */
  dbName?: string;
  /** 存储的 store 名称，默认：log-store */
  storeName?: string;
  /** 过期天数，以小时为单位，默认：14天 */
  expire?: number;
  /** 版本，默认：1 */
  dbVersion?: number;
}

const DEFAULT_OPTIONS: Required<DbOptions> = {
  maxSize: 1e4,
  dbName: 'log-db',
  storeName: 'log-store',
  expire: 14 * 24,
  dbVersion: 1,
} as const;

export default class LogDB {
  options: Required<DbOptions>;
  lf: ReturnType<typeof localforage.createInstance>;

  constructor(options: DbOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.lf = localforage.createInstance({
      name: this.options.dbName,
      version: this.options.dbVersion,
      storeName: this.options.storeName,
      description: '存储日志数据',
      driver: localforage.INDEXEDDB,
    });
    this.clear = this.clear.bind(this);
    this.length = this.length.bind(this);
    this.getKeys = this.getKeys.bind(this);
    this.setItem = this.setItem.bind(this);

    this.init();
  }

  private async init() {
    /** 如果最新的日志超过天数，则先把数据库清空 */
    const key = await this.getKeyByIdx(-1);
    const date = new Date(key || '');
    if (date.getTime() - Date.now() >= hourToMs(this.options.expire)) {
      await this.lf.clear();
    }
  }

  length() {
    return promisify(this.lf.length.bind(this.lf))();
  }

  clear() {
    return promisify(this.lf.clear.bind(this.lf))();
  }

  parse(msg: string) {
    try {
      return JSON.parse(msg);
    } catch (error: unknown) {
      return msg;
    }
  }

  setItem<T = any>(key: string, data: T) {
    this.lf.setItem(key, data);
  }

  async getKeys() {
    return await this.lf.keys();
  }

  /** 根据 idx 获取第几条 key，如果传入的是 -1，则认为是最后一条 */
  async getKeyByIdx(idx = 0) {
    const keys = await this.getKeys();
    return keys[idx];
  }

  async removeEndItem() {
    const keys = await this.getKeys();
    const length = keys.length;
    length > 0 && this.lf.removeItem(keys[length - 1]);
  }

  async toString() {
    return new Promise<string>((resolve, reject) => {
      let record: string = '';
      this.lf.iterate(
        (item: LogItem, key: string) => {
          record = `${key} [${item.lv || 'I'}] [${item.lb || 'LOG'}] - ${
            typeof item.m === 'string' ? item.m : JSON.stringify(item.m)
          }\r\n${record}`;
        },
        (err: unknown) => {
          err ? reject(err) : resolve(record);
        }
      );
    });
  }

  async toTextBlob() {
    const content = await this.toString();
    const blob = new Blob([content], { type: 'text' });
    return blob;
  }
}
