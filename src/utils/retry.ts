// src/utils/retry.ts
// 재귀 → 루프로 변경
// 이유: 재귀는 maxRetries만큼 콜스택 쌓임. 루프는 콜스택 1개로 고정
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number,
  shouldRetry?: (error: unknown) => boolean,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || (shouldRetry && !shouldRetry(error))) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
