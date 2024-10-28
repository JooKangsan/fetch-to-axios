// src/utils/environment.ts
export const isServer = typeof window === "undefined";

export const isNext = () => {
  try {
    require("next/cache");
    return true;
  } catch {
    return false;
  }
};
