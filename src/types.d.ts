export interface FetchOptions extends Omit<RequestInit, "cache"> {
  baseURL?: string;
  params?: Record<string, string | number>;
  timeout?: number;
  useCache?: boolean; // cache를 useCache로 이름 변경
  cacheTimeout?: number;
  headers?: Record<string, string>;
}

export interface AxiosLikeResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: FetchOptions;
}

export interface AxiosLikeError extends Error {
  response?: AxiosLikeResponse;
  status?: number;
  config?: FetchOptions;
}

export type InterceptorFn = (value: any) => any | Promise<any>;

export interface Interceptors {
  request: {
    use: (fn: InterceptorFn) => number;
    eject: (id: number) => void;
  };
  response: {
    use: (fn: InterceptorFn) => number;
    eject: (id: number) => void;
  };
}
