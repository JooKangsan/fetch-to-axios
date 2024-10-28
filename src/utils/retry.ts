// src/utils/retry.ts
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number,
  shouldRetry?: (error: any) => boolean
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (maxRetries <= 0 || (shouldRetry && !shouldRetry(error))) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, maxRetries - 1, delay, shouldRetry);
  }
};
