export type MiddlewareFn = (log: any) => any;

/** 写入日志时触发 */
export default class WritingMiddleware {
  middleware = new Set<MiddlewareFn>();

  constructor(middlewares: MiddlewareFn[] = []) {
    this.run = this.run.bind(this);
    this.append = this.append.bind(this);
    middlewares.forEach((fn) => this.middleware.add(fn));
  }

  append(fn: MiddlewareFn) {
    return this.middleware.add(fn);
  }

  async run(log: any) {
    let newLog = log;
    const arr = Array.from(this.middleware).reverse();
    for (let fn of arr) {
      newLog = fn(log);
    }
    return newLog;
  }

  remove(fn: MiddlewareFn) {
    return this.middleware.delete(fn);
  }
}
