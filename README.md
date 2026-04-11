# @rivermountain/fetch-to-axios

> ⚠️ 테스트 버전입니다. 프로덕션 사용 시 주의하세요.

Axios와 유사한 인터페이스를 가진 Fetch API 기반의 HTTP 클라이언트 라이브러리입니다.
TypeScript로 작성되었으며, 타입 안정성과 가벼운 번들 사이즈가 특징입니다.

## 특징

- 🚀 Fetch API 기반 구현
- 📦 의존성 없는 경량 패키지
- 💪 TypeScript 완전 지원
- 🔄 요청 / 응답 인터셉터
- ⚡ 자동 재시도 (retry)
- ⏱️ 타임아웃 설정
- 🔍 쿼리 파라미터 지원
- 🗂️ Blob / Text / Stream 응답 타입 지원
- 🔗 Next.js 캐싱 옵션 지원 (`cache`, `next`)

## 설치

```bash
npm install @rivermountain/fetch-to-axios
```

## 기본 사용법

```typescript
import { createClient } from "@rivermountain/fetch-to-axios";

const client = createClient({
  baseURL: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// GET
const users = await client.get("/users");

// POST
const user = await client.post("/users", { name: "John" });

// PUT
await client.put("/users/1", { name: "John Updated" });

// PATCH
await client.patch("/users/1", { name: "John" });

// DELETE
await client.delete("/users/1");
```

## 고급 기능

### 인터셉터

```typescript
// 요청 인터셉터 — 토큰 자동 첨부
client.interceptors.request.push({
  onFulfilled: (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
});

// 응답 인터셉터
client.interceptors.response.push({
  onFulfilled: (response) => response,
});
```

### 재시도 (Retry)

```typescript
const response = await client.get("/users", {
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) =>
      error instanceof APIError && error.status === 500,
  },
});
```

### 타임아웃

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

### 응답 타입

```typescript
// Blob — 파일 다운로드
const blob = await client.get<Blob>("/files/image.png", {
  responseType: "blob",
});

// Text
const text = await client.get<string>("/files/readme.txt", {
  responseType: "text",
});

// Stream
const stream = await client.get<ReadableStream>("/files/large.csv", {
  responseType: "stream",
});
```

### Next.js 캐싱

```typescript
// 정적 캐싱
const response = await client.get("/users", {
  cache: "force-cache",
});

// ISR — 1시간마다 갱신
const response = await client.get("/users", {
  next: {
    revalidate: 3600,
    tags: ["users"],
  },
});

// 캐싱 비활성화
const response = await client.get("/users", {
  cache: "no-store",
});
```

### FormData 업로드

```typescript
const formData = new FormData();
formData.append("file", file);

// Content-Type 자동 제거 — multipart/form-data로 브라우저가 자동 설정
const response = await client.post("/upload", formData);
```

## 에러 처리

```typescript
import { APIError } from "@rivermountain/fetch-to-axios";

try {
  const response = await client.get("/users");
} catch (error) {
  if (error instanceof APIError) {
    console.log(error.status); // HTTP 상태 코드
    console.log(error.message); // 에러 메시지
    console.log(error.data); // 서버 응답 데이터
  }
}
```

## 타입 정의

```typescript
interface RequestConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  body?: unknown;
  credentials?: "same-origin" | "include" | "omit";
  responseType?: "json" | "blob" | "text" | "stream";
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    retryCondition?: (error: unknown) => boolean;
  };
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}
```

## 주의사항

- Node.js 18 미만 환경에서는 `fetch` 폴리필이 필요해요
- Next.js `cache` / `next` 옵션은 서버 컴포넌트에서만 동작해요
- 브라우저 CORS 설정이 필요한 경우 `credentials` 옵션을 함께 설정하세요

## License

MIT
