import { FetchToAxios } from "../src";

// Mock fetch globally
global.fetch = jest.fn();

describe("FetchToAxios", () => {
  let api: FetchToAxios;

  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
    // Initialize API instance
    api = new FetchToAxios({
      baseURL: "https://api.example.com",
    });
  });

  it("should create instance with baseURL", () => {
    expect(api).toBeInstanceOf(FetchToAxios);
  });

  it("should make GET request with correct URL", async () => {
    // Mock successful response
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ data: "test" }),
      headers: new Map([["content-type", "application/json"]]),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Make request
    const response = await api.get("/users");

    // Assertions
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ data: "test" });
  });

  it("should make POST request with data", async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      statusText: "Created",
      json: () => Promise.resolve({ id: 1 }),
      headers: new Map([["content-type", "application/json"]]),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const postData = { name: "Test User" };
    const response = await api.post("/users", postData);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(postData),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(response.status).toBe(201);
    expect(response.data).toEqual({ id: 1 });
  });

  it("should handle query parameters correctly", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ data: [] }),
      headers: new Map(),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    await api.get("/users", {
      params: { page: 1, limit: 10 },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/users?page=1&limit=10",
      expect.any(Object)
    );
  });

  it("should handle errors correctly", async () => {
    const errorResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ error: "Not found" }),
      headers: new Map(),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse);

    await expect(api.get("/invalid")).rejects.toThrow();
  });

  // Cache testing
  it("should cache GET requests when enabled", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ data: "cached" }),
      headers: new Map(),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    // First request
    await api.get("/users", { useCache: true });
    // Second request with same URL
    await api.get("/users", { useCache: true });

    // Fetch should only be called once due to caching
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
