export class Cache {
  private cache: Map<string, { data: any; timestamp: number; timeoutId?: NodeJS.Timeout }> = new Map();
  private defaultTimeout: number = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: any, timeout?: number): void {
    if (this.cache.has(key)) {
      const existingItem = this.cache.get(key);
      if (existingItem?.timeoutId) clearTimeout(existingItem.timeoutId);
    }

    const timeoutId = timeout ? setTimeout(() => this.cache.delete(key), timeout) : undefined;
    this.cache.set(key, { data: value, timestamp: Date.now(), timeoutId });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.defaultTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.forEach(item => {
      if (item.timeoutId) clearTimeout(item.timeoutId);
    });
    this.cache.clear();
  }
}
