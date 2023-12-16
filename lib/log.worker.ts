import WebLogger from './web-logger';
import { WorkerAction, WorkerMsg } from './types';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

let logger: WebLogger;

ctx.addEventListener('message', async (event) => {
  try {
    const { id, data } = event.data as WorkerMsg;

    switch (id) {
      /** 初始化日志 */
      case WorkerAction.init: {
        logger = new WebLogger(data);
        break;
      }

      /** 写入日志 */
      case WorkerAction.log: {
        logger.write(data.data, data.level, data.label);
        break;
      }

      /** 下载日志 */
      case WorkerAction.downloadLog: {
        logger.getBlob().then((blob) => {
          ctx.postMessage({ id: WorkerAction.downloadLog, data: blob });
        });
        break;
      }

      /** 销毁日志 */
      case WorkerAction.destroy: {
        logger.logDB.clear();
        break;
      }
    }
  } catch (error: unknown) {
    console.error('log db error: ', error);
  }
});
