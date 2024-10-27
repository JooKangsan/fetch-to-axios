export const createURLWithParams = (
  url: string,
  params?: Record<string, string | number>
): string => {
  if (!params) return url;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return `${url}${url.includes("?") ? "&" : "?"}${searchParams.toString()}`;
};
