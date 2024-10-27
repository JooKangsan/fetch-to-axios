import { createURLWithParams } from "./utils";
import { InterceptorManager } from "./interceptor";
import { Cache } from "./cache";
import {
  FetchOptions,
  AxiosLikeResponse,
  AxiosLikeError,
  Interceptors,
} from "./types";

export class FetchToAxios {
  private baseURL: string;
  private defaultOptions: FetchOptions;
  private cache: Cache;
  private requestInterceptor: InterceptorManager;
  private responseInterceptor: InterceptorManager;
  public interceptors: Interceptors;

  constructor(options: FetchOptions = {}) {
    this.baseURL = options.baseURL || "";
    this.defaultOptions = options;
    this.cache = new Cache();

    this.requestInterceptor = new InterceptorManager();
    this.responseInterceptor = new InterceptorManager();

    this.interceptors = {
      request: {
        use: (fn) => this.requestInterceptor.use(fn),
        eject: (id) => this.requestInterceptor.eject(id),
      },
      response: {
        use: (fn) => this.responseInterceptor.use(fn),
        eject: (id) => this.responseInterceptor.eject(id),
      },
    };
  }

  private createError(
    message: string,
    config: FetchOptions,
    response?: Response
  ): AxiosLikeError {
    const error = new Error(message) as AxiosLikeError;
    error.config = config;
    if (response) {
      error.status = response.status;
      error.response = {
        data: null,
        status: response.status,
        statusText: response.statusText,
        headers: {},
        config,
      };
    }
    return error;
  }

  private async request<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<AxiosLikeResponse<T>> {
    const fullURL = this.baseURL + url;
    const finalURL = createURLWithParams(fullURL, options.params);

    if (options.useCache && options.method === "GET") {
      const cachedResponse = this.cache.get(finalURL);
      if (cachedResponse) return cachedResponse;
    }

    const controller = new AbortController();
    const timeout = options.timeout || this.defaultOptions.timeout;
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeout) timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        ...this.defaultOptions,
        ...options,
        headers: { ...this.defaultOptions.headers, ...options.headers },
        signal: controller.signal,
      };

      const modifiedOptions = await this.requestInterceptor.execute(
        fetchOptions
      );
      const response = await fetch(finalURL, modifiedOptions);

      if (!response.ok)
        throw this.createError(
          `Request failed with status ${response.status}`,
          options,
          response
        );

      const data = await response.json();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => (headers[key] = value));

      let result: AxiosLikeResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
        config: options,
      };

      result = await this.responseInterceptor.execute(result);

      if (options.useCache && options.method === "GET") {
        this.cache.set(finalURL, result, options.cacheTimeout);
      }

      return result;
    } catch (error) {
      if (error instanceof Error)
        throw this.createError(error.message, options);
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  // 나머지 get, post, put, delete 메서드는 그대로 유지됩니다.
}
