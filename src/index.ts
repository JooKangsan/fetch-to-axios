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

