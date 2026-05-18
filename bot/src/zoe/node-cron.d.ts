/**
 * Local type shim for node-cron (no @types package installed in this repo).
 * Covers only what bot/src/zoe/scheduler.ts uses.
 */
declare module 'node-cron' {
  export interface ScheduledTask {
    start(): this;
    stop(): this;
  }
  export interface ScheduleOptions {
    timezone?: string;
    scheduled?: boolean;
    name?: string;
  }
  export function schedule(
    cronExpression: string,
    func: () => void | Promise<void>,
    options?: ScheduleOptions,
  ): ScheduledTask;
  export function validate(cronExpression: string): boolean;
  const _default: { schedule: typeof schedule; validate: typeof validate };
  export default _default;
}
