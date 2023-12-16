# web-logger

`w-log` 是一个在浏览器中写入日志的包，可以通过 `WebWorker` 将日志写入到 `indexedDB` 中，也支持导出文件、过滤敏感信息等功能。

## 下载

```bash
pnpm add w-log
```

```bash
yarn add w-log
```

```bash
npm install w-log
```

## 使用

如果你的项目使用 `Webpack4`，并且使用 `WebWorker` 写入日志，则需要下载 `worker-loader` 包，并按照[官方的配置](https://github.com/webpack-contrib/worker-loader) 使用 WebWorker。

```ts
// App.tsx
import Worker from 'worker-loader!w-log/lig/log.worker';
import { createLogger } from 'w-log';

const worker = new Worker();

const logger = createLogger(
  {
    // Logger Options...
  },
  worker
);

// 写入日志...
logger.write('logger initialized', logger.LEVEL.Info);

// 定义 TypeScript 类型
declare module 'worker-loader!*' {
  // You need to change `Worker`, if you specified a different value for the `workerType` option
  class WebpackWorker extends Worker {
    constructor();
  }

  // Uncomment this if you set the `esModule` option to `false`
  // export = WebpackWorker;
  export default WebpackWorker;
}
```

如果你的项目里使用的是 `Webpack5`，可以使用 Web Workers 代替 worker-loader。

官方文档：[Web workers](https://www.webpackjs.com/guides/web-workers/#root)

```ts
import { createLogger } from 'w-log';
const worker = new Worker(
  new URL('w-log/lig/log.worker', import.meta.url)
);

const logger = createLogger(
  {
    // Logger Options...
  },
  worker
);
```

## 导出日志

```ts
logger.download('app.log');
```

你也可以定义一个“隐藏”的路由，当浏览器跳转到这个路由时，调用 `download` 完成下载，然后重定向到其他路由页面。

## API

- `formatter`: 导出日志时的格式化方式，默认：`%d [%t] %i [%l] - m%`，如：2023/6/15 16:22:08 [I] 1010 [req-conf] - xxxx；
- `key`: 日志对应的 key，默认使用 date 作为 key（即：2023/6/15 16:22:08），也可以使用 `number` 作为索引，或者传入一个函数：`(log: LogItem) => string`；
- `dbOptions`: LogDB 对应的配置参数；
- `enable`: 是否启用写入、读取、下载功能，默认：true，你可以根据这个参数在不同环境启用日志能力，比如在 prd 环境关闭日志；
- `filterSensitiveData`: 过滤敏感数据，尽量在写入之前就过滤掉敏感数据，传入的数组，会查找对象中包含的该参数，把值替换一下。或 `key=value` 形式也会被替换，默认：`filterSensitiveData: [{ name: 'securityKey' },{ name: 'xyToken' },{ name: 'token' }]`；
- `enbaleFilterSensitiveData`: 是否启用敏感数据过滤；

需要注意是，如果启用了 webworker，则配置参数都将无法支持传入 `function` 类型的配置（直接忽略掉）。

格式化的占位符：

```ts
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
```

日志等级：可以在 `logger.LEVEL` 对象中获取到。

```ts
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
```

`LogDB` 配置参数：

- `maxSize?`: `number`，最多存储的条目，默认：6W 条记录；
- `dbName?`: `string`，数据库名称，默认：`log-db`；
- `storeName?`: `string`，存储的 store 名称，默认：`log-store`；
- `expire?`: `number`，过期天数，以小时为单位，默认：`14` 天；
- `dbVersion?`: `number`，版本，默认：1；

## 记录 `Axios` 请求日志

可以在请求拦截器中拦截：

```ts
axios.interceptors.response.use(void 0, (err) => {
  const res = err?.response ? err.response : err;
  logger.write(JSON.stringify(res), 'res-err', logger.LEVEL.Error);
  return Promise.reject(err);
});

axios.interceptors.request.use(
  (config) => {
    logger.write(JSON.stringify(config), 'req-conf', logger.LEVEL.Info);
  },
  (err) => {
    logger.write(JSON.stringify(err), 'req-err', logger.LEVEL.Error);
  }
);
```
