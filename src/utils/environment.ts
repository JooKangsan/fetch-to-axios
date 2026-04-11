// src/utils/environment.ts
export const isServer = typeof window === "undefined";

// 함수 → 즉시실행함수(IIFE)로 변경
// 이유: 매 요청마다 require() 시도하는 건 비쌈. 앱 시작할 때 한 번만 체크하면 됨
export const isNext = (() => {
  try {
    require("next/cache");
    return true;
  } catch {
    return false;
  }
})();
