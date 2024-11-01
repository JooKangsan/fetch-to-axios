# (주의!)위 라이브러리는 정식판이 아닌 테스트 판입니다. 사용방법을 자세하게 달아놓았지만 부족한 내용이 많습니다.

# @rivermountain/fetch-to-axios

# Korean

Axios와 유사한 인터페이스를 가진 Fetch API 기반의 HTTP 클라이언트 라이브러리입니다. TypeScript로 작성되었으며, 타입 안정성과 가벼운 번들 사이즈가 특징입니다.

## 특징

- 🚀 Fetch API 기반 구현
- 📦 의존성 없는 경량 패키지 (16.5kB)
- 💪 TypeScript로 작성된 견고한 타입 지원
- 🔄 인터셉터 지원
- ⚡ 자동 재시도 기능
- ⏱️ 타임아웃 설정
- 🔍 쿼리 파라미터 지원

## 설치

```bash
npm install @rivermountain/fetch-to-axios
```

## 기본 사용법

```typescript
import { createClient } from "@rivermountain/fetch-to-axios";

// 클라이언트 인스턴스 생성
const client = createClient({
  baseURL: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// GET 요청
const getData = async () => {
  const response = await client.get("/users");
  return response;
};

// POST 요청
const createUser = async (userData) => {
  const response = await client.post("/users", userData);
  return response;
};
```

## 고급 기능

### 인터셉터 사용

```typescript
// 요청 인터셉터
client.interceptors.request.push({
  onFulfilled: (config) => {
    // 브라우저 환경에서만 실행
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return config;
  },
});

// 응답 인터셉터
client.interceptors.response.push({
  onFulfilled: (response) => response,
  onRejected: async (error) => {
    // 에러 처리
    return Promise.reject(error);
  },
});
```

### 재시도 설정

```typescript
const response = await client.get("/users", {
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => error.status === 500,
  },
});
```

### 타임아웃 설정

```typescript
const response = await client.get("/users", {
  timeout: 5000, // 5초
});
```

### 쿼리 파라미터

```typescript
const response = await client.get("/users", {
  params: {
    page: 1,
    limit: 10,
    search: "john",
  },
});
```

### Next.js 지원

```typescript
const response = await client.get("/users", {
  cache: "force-cache",
  next: {
    revalidate: 3600,
    tags: ["users"],
  },
});
```

## API 에러 처리

```typescript
import { APIError } from "@rivermountain/fetch-to-axios";

try {
  const response = await client.get("/users");
} catch (error) {
  if (error instanceof APIError) {
    console.log(error.status); // HTTP 상태 코드
    console.log(error.message); // 에러 메시지
  }
}
```

## Config 타입 정의

```typescript
interface Config {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, any>;
  body?: any;
  credentials?: "same-origin" | "include" | "omit";
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    retryCondition?: (error: any) => boolean;
  };
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}
```

## 주의사항

- Node.js 환경에서는 `fetch`가 전역으로 제공되어야 합니다 (Node.js 18+ 또는 polyfill 필요)
- 브라우저 환경에서 CORS 설정이 필요한 경우 적절한 credentials 옵션을 설정해야 합니다

# English

# (Caution!)This library is a test version, not the official release. Although detailed usage instructions are provided, there is still a lot of missing information.

A lightweight HTTP client library based on Fetch API with an Axios-like interface. Built with TypeScript for robust type safety and minimal bundle size.

## Features

- 🚀 Built on Fetch API
- 📦 Zero dependencies (16.5kB)
- 💪 First-class TypeScript support
- 🔄 Interceptors support
- ⚡ Automatic retry functionality
- ⏱️ Timeout configuration
- 🔍 Query parameters support

## Installation

```bash
npm install @rivermountain/fetch-to-axios
Basic Usage
typescriptCopyimport { createClient } from '@rivermountain/fetch-to-axios';

// Create client instance
const client = createClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// GET request
const getData = async () => {
  const response = await client.get('/users');
  return response;
};

// POST request
const createUser = async (userData) => {
  const response = await client.post('/users', userData);
  return response;
};
Advanced Features
Using Interceptors
typescriptCopy// Request interceptor
client.interceptors.request.push({
  onFulfilled: (config) => {
    // Execute only in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
    }
    return config;
  }
});

// Response interceptor
client.interceptors.response.push({
  onFulfilled: (response) => response,
  onRejected: async (error) => {
    // Error handling
    return Promise.reject(error);
  }
});
Retry Configuration
typescriptCopyconst response = await client.get('/users', {
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => error.status === 500
  }
});
Timeout Configuration
typescriptCopyconst response = await client.get('/users', {
  timeout: 5000  // 5 seconds
});
Query Parameters
typescriptCopyconst response = await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    search: 'john'
  }
});
Next.js Support
typescriptCopyconst response = await client.get('/users', {
  cache: 'force-cache',
  next: {
    revalidate: 3600,
    tags: ['users']
  }
});
API Error Handling
typescriptCopyimport { APIError } from '@rivermountain/fetch-to-axios';

try {
  const response = await client.get('/users');
} catch (error) {
  if (error instanceof APIError) {
    console.log(error.status);  // HTTP status code
    console.log(error.message); // Error message
  }
}
Config Type Definition
typescriptCopyinterface Config {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, any>;
  body?: any;
  credentials?: 'same-origin' | 'include' | 'omit';
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    retryCondition?: (error: any) => boolean;
  };
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}
Important Notes

In Node.js environments, fetch must be globally available (Node.js 18+ or polyfill required)
For browser environments requiring CORS, appropriate credentials options must be configured

License
MIT
```
