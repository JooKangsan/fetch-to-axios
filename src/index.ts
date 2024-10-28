interface Config {
  baseURL?: string;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
}

const createFetch = (baseConfig: Config = { headers: {} }) => {
  const fetchWithConfig = async (
    url: string,
    options: Config = { headers: {} }
  ) => {
    const config = {
      ...baseConfig,
      ...options,
      headers: {
        ...baseConfig.headers,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  return fetchWithConfig;
};

// 2단계: HTTP 메서드 구현
const createHTTPClient = (baseConfig = {}) => {
  const fetchWithConfig = createFetch(baseConfig);

  return {
    get: (url: string, config = {}) => 
      fetchWithConfig(url, { ...config, method: 'GET' }),
      
    post: (url: string, data?: any, config = {}) =>
      fetchWithConfig(url, {
        ...config,
        method: 'POST',
        body: JSON.stringify(data)
      }),

    put: (url: string, data?: any, config = {}) =>
      fetchWithConfig(url, {
        ...config,
        method: 'PUT',
        body: JSON.stringify(data)
      }),

    patch: (url: string, data?: any, config = {}) =>
      fetchWithConfig(url, {
        ...config,
        method: 'PATCH',
        body: JSON.stringify(data)
      }),

    delete: (url: string, config = {}) =>
      fetchWithConfig(url, { ...config, method: 'DELETE' })
  };
};