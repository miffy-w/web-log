export enum WorkerAction {
  /** 初始化 log */
  init = 1,
  /** 下载 */
  downloadLog = 2,
  /** 写日志 */
  log = 3,
  /** 销毁日志 */
  destroy = 4,
}

export interface WorkerMsg {
  data: any;
  id: WorkerAction;
}
