// src/__tests__/client.test.ts
import { createClient } from "../core/createClient";
import { APIError, APIResponse } from "../types";

describe("HTTP Client", () => {
  const mockBaseUrl = "https://api.example.com";
  const client = createClient({
    baseURL: mockBaseUrl,
    headers: {
      Authorization: "Bearer test-token",
    },
  });

  beforeEach(() => {
    // fetch mock 초기화
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET 요청", () => {
    it("성공적인 GET 요청을 처리해야 합니다", async () => {
      const mockData = { id: 1, name: "Test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const response = await client.get("/users/1");

      expect(response).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/users/1`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("실패한 GET 요청에서 APIError를 던져야 합니다", async () => {
      const errorData = { message: "Not Found" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorData,
      });

      await expect(client.get("/users/999")).rejects.toThrow(APIError);
    });
  });

  describe("POST 요청", () => {
    it("성공적인 POST 요청을 처리해야 합니다", async () => {
      const postData = { name: "New User" };
      const mockResponse = { id: 1, ...postData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await client.post("/users", postData);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/users`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("재시도 로직", () => {
    it("설정된 횟수만큼 재시도해야 합니다", async () => {
      const mockData = { id: 1, name: "Test" };
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });

      const response = await client.get("/users/1", {
        retryConfig: {
          maxRetries: 2,
          retryDelay: 100,
          retryCondition: () => true,
        },
      });

      expect(response).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("타임아웃", () => {
    it("지정된 시간 내에 응답이 없으면 abort 되어야 합니다", async () => {
      const abortError = new Error("AbortError");
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(abortError), 1000);
          })
      );

      await expect(client.get("/users/1", { timeout: 500 })).rejects.toThrow();
    });
  });

  describe("인터셉터", () => {
    interface MockData {
      id: number;
      name: string;
    }

    it("response 인터셉터가 응답을 수정할 수 있어야 합니다", async () => {
      const mockData: MockData = { id: 1, name: "Test" };
      const mockHeaders = new Headers();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
        headers: mockHeaders,
        status: 200,
      });

      type ResponseWithModified = MockData & { modified: boolean };

      client.interceptors.response.push({
        onFulfilled: (response: APIResponse<unknown>) => {
          const originalData = response.data as MockData;
          return {
            data: {
              id: originalData.id,
              name: originalData.name,
              modified: true,
            } as ResponseWithModified,
            status: response.status,
            headers: response.headers,
          };
        },
      });

      const response = await client.get<ResponseWithModified>("/users/1");
      expect(response).toHaveProperty("modified", true);
      expect(response.id).toBe(1);
      expect(response.name).toBe("Test");
    });
  });
});
