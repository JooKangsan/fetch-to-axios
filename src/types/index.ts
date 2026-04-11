type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface NextOptions {
  revalidate?: number | false;
  tags?: string[];
}

interface BaseConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  next?: NextOptions;
}

interface RequestOptions extends BaseConfig {
  url?: string;
  method?: HTTPMethod;
  params?: Record<string, unknown>; // any → unknown으로 변경. 이유: any는 타입 체크 무력화
  body?: unknown;
  signal?: AbortSignal;
  credentials?: "same-origin" | "include" | "omit";
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: unknown) => boolean;
}

// NextConfig / ReactConfig 통합
// 이유: 둘을 유니온으로 쓰면 타입 좁히기가 복잡해짐. cache 하나로 통일
type Config = RequestOptions & {
  cache?: RequestCache;
  retryConfig?: RetryConfig;
  responseType?: "json" | "blob" | "text" | "stream"; // 응답 타입 추가
};

interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

// code → message로 변경
// 이유: Error 클래스 기본 필드가 message라 일관성 있음. code는 별도 필드로 분리
export class APIError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown = null,
    message: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface Interceptor<T> {
  onFulfilled?: (value: T) => T | Promise<T>;
  onRejected?: (error: unknown) => unknown;
}

interface Client {
  get<T = unknown>(url: string, config?: Config): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: Config): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: Config): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: Config): Promise<T>;
  delete<T = unknown>(url: string, config?: Config): Promise<T>;
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
  Config,
  APIResponse,
  Interceptor,
  Client,
};
