import { InterceptorFn } from "./types";

export class InterceptorManager {
  private interceptors: Map<number, InterceptorFn> = new Map();
  private id: number = 0;

  use(fn: InterceptorFn): number {
    this.id += 1;
    this.interceptors.set(this.id, fn);
    return this.id;
  }

  eject(id: number): void {
    this.interceptors.delete(id);
  }

  async execute(value: any): Promise<any> {
    let result = value;
    for (const interceptor of this.interceptors.values()) {
      result = await interceptor(result);
    }
    return result;
  }
}
