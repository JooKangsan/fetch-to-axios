import {
  FetchOptions,
  AxiosLikeResponse,
  AxiosLikeError,
  Interceptors,
} from "./types";
import { createURLWithParams } from "./utils";
import { InterceptorManager } from "./interceptor";
import { Cache } from "./cache";

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

    // Cache check (useCache로 변경)
    if (options.useCache && options.method === "GET") {
      const cachedResponse = this.cache.get(finalURL);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    const controller = new AbortController();
    const timeout = options.timeout || this.defaultOptions.timeout;

    let timeoutId: NodeJS.Timeout | undefined;
    if (timeout) {
      timeoutId = setTimeout(() => controller.abort(), timeout);
    }

    try {
      // RequestInit 타입과 호환되도록 options 가공
      const fetchOptions: RequestInit = {
        ...this.defaultOptions,
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      };

      let modifiedOptions = await this.requestInterceptor.execute(fetchOptions);

      const response = await fetch(finalURL, modifiedOptions);

      if (!response.ok) {
        throw this.createError(
          `Request failed with status ${response.status}`,
          options,
          response
        );
      }

      const data = await response.json();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let result: AxiosLikeResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
        config: options,
      };

      result = await this.responseInterceptor.execute(result);

      // Cache the response if needed (useCache로 변경)
      if (options.useCache && options.method === "GET") {
        this.cache.set(finalURL, result, options.cacheTimeout);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw this.createError(error.message, options);
      }
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async get<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<AxiosLikeResponse<T>> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  async post<T>(
    url: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<AxiosLikeResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async put<T>(
    url: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<AxiosLikeResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  async delete<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<AxiosLikeResponse<T>> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export type { FetchOptions, AxiosLikeResponse, AxiosLikeError };
