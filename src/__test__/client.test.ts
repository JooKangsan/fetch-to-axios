import { createClient } from "../index";
import { APIError, APIResponse } from "../types";

describe("HTTP Client", () => {
  const mockBaseUrl = "https://api.example.com";

  // 인터셉터 테스트에서 클라이언트 공유 시 인터셉터가 누적되는 문제 방지
  // 이유: 기존 코드는 describe 스코프에서 client를 공유해서 인터셉터가 테스트 간 오염됨
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    global.fetch = jest.fn();
    client = createClient({
      baseURL: mockBaseUrl,
      headers: {
        Authorization: "Bearer test-token",
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET 요청", () => {
    it("성공적인 GET 요청을 처리해야 합니다", async () => {
      const mockData = { id: 1, name: "Test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
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
        }),
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

    it("APIError에 올바른 status와 message가 담겨야 합니다", async () => {
      const errorData = { message: "Not Found" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorData,
      });

      // 이유: status, message 검증 안 하면 에러 구조가 맞는지 알 수 없음
      await expect(client.get("/users/999")).rejects.toMatchObject({
        status: 404,
        message: "Not Found",
      });
    });
  });

  describe("POST 요청", () => {
    it("성공적인 POST 요청을 처리해야 합니다", async () => {
      const postData = { name: "New User" };
      const mockResponse = { id: 1, ...postData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
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
            Authorization: "Bearer test-token",
          }),
        }),
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
          status: 200,
          headers: new Headers(),
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

    it("retryCondition이 false면 재시도하지 않아야 합니다", async () => {
      // 이유: retryCondition 분기가 실제로 동작하는지 검증 안 되어 있었음
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(
        client.get("/users/1", {
          retryConfig: {
            maxRetries: 3,
            retryDelay: 100,
            retryCondition: () => false,
          },
        }),
      ).rejects.toThrow("Network error");

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("타임아웃", () => {
    it("지정된 시간 내에 응답이 없으면 abort 되어야 합니다", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("AbortError")), 1000);
          }),
      );

      await expect(client.get("/users/1", { timeout: 500 })).rejects.toThrow();
    });
  });

  describe("응답 타입", () => {
    it("responseType이 blob이면 blob을 반환해야 합니다", async () => {
      const mockBlob = new Blob(["test"]);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        blob: async () => mockBlob,
      });

      const response = await client.get<Blob>("/files/image.png", {
        responseType: "blob",
      });

      expect(response).toBeInstanceOf(Blob);
    });

    it("responseType이 text면 string을 반환해야 합니다", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => "hello",
      });

      const response = await client.get<string>("/files/readme.txt", {
        responseType: "text",
      });

      expect(response).toBe("hello");
    });
  });

  describe("인터셉터", () => {
    it("response 인터셉터가 응답을 수정할 수 있어야 합니다", async () => {
      interface MockData {
        id: number;
        name: string;
      }
      type ResponseWithModified = MockData & { modified: boolean };

      const mockData: MockData = { id: 1, name: "Test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      client.interceptors.response.push({
        onFulfilled: (response: APIResponse<unknown>) => {
          const original = response.data as MockData;
          return {
            data: { ...original, modified: true } as ResponseWithModified,
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

    it("request 인터셉터가 헤더를 추가할 수 있어야 합니다", async () => {
      // 이유: request 인터셉터 테스트가 기존에 없었음
      const mockData = { id: 1 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

      client.interceptors.request.push({
        onFulfilled: (config) => ({
          ...config,
          headers: { ...config.headers, "X-Custom-Header": "test" },
        }),
      });

      await client.get("/users/1");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Custom-Header": "test",
          }),
        }),
      );
    });
  });
});
