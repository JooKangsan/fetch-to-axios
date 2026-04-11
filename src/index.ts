import { isNext } from "./utils/environment";
import { retry } from "./utils/retry";
import type { Config, Client, APIResponse, Interceptor } from "./types";
import { APIError } from "./types";

export const createClient = (baseConfig: Config = {}): Client => {
  const requestInterceptors: Interceptor<Config>[] = [];
  const responseInterceptors: Interceptor<APIResponse>[] = [];

  const createURL = (
    path: string,
    params?: Record<string, unknown>,
  ): string => {
    const baseUrl = baseConfig.baseURL?.replace(/\/+$/, "") ?? "";
    const normalizedPath = path.replace(/^\/+/, "/");
    const fullUrl = `${baseUrl}${normalizedPath}`;

    if (!params) return fullUrl;

    const url = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) url.searchParams.append(key, String(value));
    });
    return url.toString();
  };

  const createRequestInit = (config: Config): RequestInit => {
    const isFormData = config.body instanceof FormData;
    const baseHeaders = { ...baseConfig.headers, ...config.headers };

    // FormData일 때 Content-Type 제거
    // 이유: Content-Type 직접 설정하면 boundary 값이 없어서 서버가 파싱 못함
    const headers = isFormData
      ? Object.fromEntries(
          Object.entries(baseHeaders).filter(
            ([key]) => key.toLowerCase() !== "content-type",
          ),
        )
      : { "Content-Type": "application/json", ...baseHeaders };

    return {
      method: config.method,
      headers,
      ...(config.body
        ? {
            body: isFormData
              ? (config.body as FormData)
              : JSON.stringify(config.body),
          }
        : {}),
      ...(config.signal ? { signal: config.signal } : {}),
      ...(config.credentials ? { credentials: config.credentials } : {}),
      ...(isNext && config.cache ? { cache: config.cache } : {}),
      ...(isNext && config.next ? { next: config.next } : {}),
    };
  };

  const parseResponse = async <T>(
    response: Response,
    responseType?: Config["responseType"],
  ): Promise<T> => {
    switch (responseType) {
      case "blob":
        return response.blob() as Promise<T>;
      case "text":
        return response.text() as Promise<T>;
      case "stream":
        return Promise.resolve(response.body) as Promise<T>;
      default:
        return response.json() as Promise<T>;
    }
  };

  const handleResponse = async <T>(
    response: Response,
    responseType?: Config["responseType"],
  ): Promise<T> => {
    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // blob, text 요청이어도 에러 응답은 보통 JSON으로 내려옴
      }
      throw new APIError(
        response.status,
        errorData,
        errorData?.message ?? `Error ${response.status}`,
      );
    }

    const data = await parseResponse<T>(response, responseType);

    // 인터셉터 없으면 reduce 스킵
    // 이유: 인터셉터 없어도 Promise.resolve 만들고 순회하던 기존 코드 개선
    if (responseInterceptors.length === 0) return data;

    const apiResponse: APIResponse<T> = {
      data,
      status: response.status,
      headers: response.headers,
    };

    const result = await responseInterceptors.reduce(
      async (promise, interceptor) => {
        const value = await promise;
        return interceptor.onFulfilled ? interceptor.onFulfilled(value) : value;
      },
      Promise.resolve(apiResponse as APIResponse),
    );

    return result.data as T;
  };

  const request = async <T>(config: Config): Promise<T> => {
    // 인터셉터 없으면 스킵
    const finalConfig =
      requestInterceptors.length === 0
        ? config
        : await requestInterceptors.reduce(async (promise, interceptor) => {
            const conf = await promise;
            return interceptor.onFulfilled
              ? interceptor.onFulfilled(conf)
              : conf;
          }, Promise.resolve(config));

    // timeout 있을 때만 AbortController 생성
    // 이유: 기존 코드는 항상 생성했음. 불필요한 객체 생성 제거
    const controller = finalConfig.timeout ? new AbortController() : null;
    const timeoutId =
      controller && finalConfig.timeout
        ? setTimeout(() => controller.abort(), finalConfig.timeout)
        : null;

    try {
      const url = createURL(config.url!, config.params);
      const init = createRequestInit({
        ...finalConfig,
        signal: config.signal ?? controller?.signal,
      });

      const execute = () =>
        fetch(url, init).then((res) =>
          handleResponse<T>(res, finalConfig.responseType),
        );

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
    get: <T>(url: string, config: Config = {}) =>
      request<T>({ ...config, url, method: "GET" }),
    post: <T>(url: string, data?: unknown, config: Config = {}) =>
      request<T>({ ...config, url, method: "POST", body: data }),
    put: <T>(url: string, data?: unknown, config: Config = {}) =>
      request<T>({ ...config, url, method: "PUT", body: data }),
    patch: <T>(url: string, data?: unknown, config: Config = {}) =>
      request<T>({ ...config, url, method: "PATCH", body: data }),
    delete: <T>(url: string, config: Config = {}) =>
      request<T>({ ...config, url, method: "DELETE" }),
  };
};
