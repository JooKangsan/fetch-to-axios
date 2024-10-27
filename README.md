# @rivermountain/fetch-to-axios

Advanced fetch API wrapper with Axios-like interface and TypeScript support.

## Features

- 🔄 Axios-like interface
- 📝 Full TypeScript support
- 🌐 Base URL configuration
- ⏱️ Timeout support
- 🔍 Query parameters support
- 🎯 Interceptors for request/response
- 💾 Caching support
- ❌ Enhanced error handling
- 🔄 Response transformation

## Installation

```bash
npm install @rivermountain/fetch-to-axios
```

## Basic Usage

```typescript
import { FetchToAxios } from "@rivermountain/fetch-to-axios";

const api = new FetchToAxios({
  baseURL: "https://api.example.com",
  timeout: 5000,
});

// GET request
const response = await api.get("/users", {
  params: { page: 1 },
});

// POST request
const user = await api.post("/users", {
  name: "John",
  email: "john@example.com",
});
```

## Advanced Features

### Interceptors

```typescript
// Request interceptor
api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    Authorization: "Bearer token",
  };
  return config;
});

// Response interceptor
api.interceptors.response.use((response) => {
  console.log("Response:", response);
  return response;
});
```

### Caching

```typescript
// Enable caching for GET requests
const cachedResponse = await api.get("/users", {
  cache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
});

// Clear cache
api.clearCache();
```

### Error Handling

```typescript
try {
  const response = await api.get("/invalid-url");
} catch (error) {
  if (error.response) {
    console.log("Status:", error.response.status);
    console.log("Data:", error.response.data);
  }
}
```

## API Reference

### Configuration Options

```typescript
interface FetchOptions {
  baseURL?: string;
  timeout?: number;
  params?: Record;
  cache?: boolean;
  cacheTimeout?: number;
  headers?: Record;
}
```

### Available Methods

- `get<T>(url: string, options?: FetchOptions): Promise<AxiosLikeResponse<T>>`
- `post<T>(url: string, data?: any, options?: FetchOptions): Promise<AxiosLikeResponse<T>>`
- `put<T>(url: string, data?: any, options?: FetchOptions): Promise<AxiosLikeResponse<T>>`
- `delete<T>(url: string, options?: FetchOptions): Promise<AxiosLikeResponse<T>>`
- `clearCache(): void`

## License

MIT
