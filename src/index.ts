// src/core/createClient.ts
import { isNext } from "./utils/environment";
import { retry } from "./utils/retry";
import type { Config, Client, APIResponse, Interceptor } from "./types";
import { APIError } from "./types";

export const createClient = (baseConfig: Config = {}): Client => {
  const requestInterceptors: Interceptor<Config>[] = [];
  const responseInterceptors: Interceptor<APIResponse>[] = [];

  const createURL = (path: string, params?: Record<string, string>): string => {
    if (!baseConfig.baseURL) {
      return path;
    }

    // baseURL의 끝 슬래시 제거
    const baseUrl = baseConfig.baseURL.replace(/\/+$/, "");

    // path의 시작 슬래시 정규화 (여러 개의 슬래시를 하나로)
    const normalizedPath = path.replace(/^\/+/, "/");

    // URL 결합
    const fullUrl = `${baseUrl}${normalizedPath}`;

    // 쿼리 파라미터 처리
    if (!params) {
      return fullUrl;
    }

    const url = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  };
  const createRequestInit = (config: Config = {}): RequestInit => {
    const init: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...baseConfig.headers,
        ...config.headers,
      },
      method: config.method,
    };

    if (config.body) {
      init.body = JSON.stringify(config.body);
    }

    // signal은 테스트에서 검증하지 않는 속성이므로 조건부로 추가
    if (config.signal) {
      init.signal = config.signal;
    }

    // credentials도 조건부로 추가
    if (config.credentials) {
      init.credentials = config.credentials;
    }

    if (isNext() && config.cache) {
      return {
        ...init,
        cache: config.cache as RequestCache,
      } as RequestInit & {
        next?: { revalidate?: number | false; tags?: string[] };
      };
    }

    return init;
  };
  const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new APIError(
        response.status,
        data,
        response.status === 429 ? "RATE_LIMIT" : "API_ERROR"
      );
    }

    const data = await response.json();

    // 응답 인터셉터 실행
    const apiResponse: APIResponse = {
      data,
      status: response.status,
      headers: response.headers,
    };

    const result = await responseInterceptors.reduce(
      async (promise, interceptor) => {
        const value = await promise;
        return interceptor.onFulfilled ? interceptor.onFulfilled(value) : value;
      },
      Promise.resolve(apiResponse)
    );

    return result.data as T;
  };

  const request = async <T>(config: Config): Promise<T> => {
    // 요청 인터셉터 실행
    const finalConfig = await requestInterceptors.reduce(
      async (promise, interceptor) => {
        const conf = await promise;
        return interceptor.onFulfilled ? interceptor.onFulfilled(conf) : conf;
      },
      Promise.resolve(config)
    );

    const controller = new AbortController();
    const timeoutId =
      finalConfig.timeout &&
      setTimeout(() => controller.abort(), finalConfig.timeout);

    try {
      const url = createURL(config.url!, config.params);
      const init = createRequestInit({
        ...finalConfig,
        signal: controller.signal,
      });

      const execute = () =>
        fetch(url, init).then((res) => handleResponse<T>(res));

      if (finalConfig.retryConfig) {
        const { maxRetries, retryDelay, retryCondition } =
          finalConfig.retryConfig;
        return retry(execute, maxRetries, retryDelay, retryCondition);
      }

      return execute();
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  return {
    interceptors: {
      request: requestInterceptors,
      response: responseInterceptors,
    },

    async get<T>(url: string, config: Config = {}) {
      return request<T>({ ...config, url, method: "GET" });
    },

    async post<T>(url: string, data?: any, config: Config = {}) {
      return request<T>({ ...config, url, method: "POST", body: data });
    },

    async put<T>(url: string, data?: any, config: Config = {}) {
      return request<T>({ ...config, url, method: "PUT", body: data });
    },

    async patch<T>(url: string, data?: any, config: Config = {}) {
      return request<T>({ ...config, url, method: "PATCH", body: data });
    },

    async delete<T>(url: string, config: Config = {}) {
      return request<T>({ ...config, url, method: "DELETE" });
    },
  };
};
