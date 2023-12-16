import { Write } from './console';
import { LogLevel, download } from './util';
import { WorkerAction, WorkerMsg } from './types';
import WritingMiddleware, { MiddlewareFn } from './middleware';
import { LoggerConfig } from './web-logger';

export class WorkerLogger extends Write {
  LEVEL = LogLevel;

  downloadFilename: string = 'app.log';
  private beforeWritingMiddleware: WritingMiddleware;
  constructor(options: LoggerConfig = {}, public worker: Worker) {
    super();
    const newOptions = JSON.parse(JSON.stringify(options));
    /** 这里需要处理一下，options 中如果有函数参数，需要忽略掉，因为 webWorker 不支持，会报错 */
    worker.postMessage({ id: WorkerAction.init, data: newOptions });
    this.write = this.write.bind(this);
    this.download = this.download.bind(this);

    /** 注册中间件 */
    this.beforeWritingMiddleware = new WritingMiddleware();
    this.registerMiddleware = this.registerMiddleware.bind(this);

    this.worker.addEventListener('message', (event) => {
      const { id, data } = event.data as WorkerMsg;
      if (id === WorkerAction.downloadLog && data instanceof Blob) {
        download(data, this.downloadFilename);
      } else {
        console.error('data is not a Blob');
      }
    });
  }

  /** 最先注册的中间件会最后才去执行 */
  registerMiddleware(fn: MiddlewareFn) {
    this.beforeWritingMiddleware.append(fn);
  }

  override async write<T = any>(data: T, label = 'LOG', level = LogLevel.Info) {
    /** 先执行  */
    const newLog = await this.beforeWritingMiddleware.run(data);
    this.worker.postMessage({
      id: WorkerAction.log,
      data: {
        data: newLog,
        level,
        label,
      },
    });
  }

  download(filename?: string) {
    filename && (this.downloadFilename = filename);
    this.worker.postMessage({ id: WorkerAction.downloadLog });
  }

  destroy() {
    this.worker.postMessage({ id: WorkerAction.destroy });
  }
}

export default WorkerLogger;
