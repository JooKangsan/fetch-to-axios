// src/types/index.ts
type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface NextOptions {
  revalidate?: number | false;
  tags?: string[];
}
// 기본 설정
interface BaseConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  next?: NextOptions;
}

// 요청 옵션
interface RequestOptions extends BaseConfig {
  url?: string;
  method?: HTTPMethod;
  params?: Record<string, any>;
  body?: any;
  signal?: AbortSignal;
}

// 재시도 설정
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: any) => boolean;
}

// Next.js 설정
interface NextConfig extends RequestOptions {
  cache?: RequestCache;
}

// React 설정
interface ReactConfig extends RequestOptions {
  cache?: boolean;
}

// 통합 Config 타입
type Config = (NextConfig | ReactConfig) & {
  retryConfig?: RetryConfig;
  credentials?: "same-origin" | "include" | "omit";
};

// API 응답
interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

// API 에러
class APIError extends Error {
  constructor(
    public status: number,
    public data: any,
    public code: string = "API_ERROR"
  ) {
    super(`API Error: ${status}`);
    this.name = "APIError";
  }
}

// 인터셉터
interface Interceptor<T> {
  onFulfilled?: (value: T) => T | Promise<T>;
  onRejected?: (error: any) => any;
}

// 클라이언트 인터페이스
interface Client {
  get<T = any>(url: string, config?: Config): Promise<T>;
  post<T = any>(url: string, data?: any, config?: Config): Promise<T>;
  put<T = any>(url: string, data?: any, config?: Config): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: Config): Promise<T>;
  delete<T = any>(url: string, config?: Config): Promise<T>;

  interceptors: {
    request: Interceptor<Config>[];
    response: Interceptor<APIResponse>[];
  };
}

export type {
  HTTPMethod,
  BaseConfig,
  RequestOptions,
  RetryConfig,
  NextConfig,
  ReactConfig,
  Config,
  APIResponse,
  Interceptor,
  Client,
};

export { APIError };
