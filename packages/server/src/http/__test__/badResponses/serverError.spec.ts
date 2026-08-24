import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServerError } from "../../badResponses/serverError";

describe("ServerError", () => {
	// biome-ignore lint/suspicious/noExplicitAny: intentional
	let consoleLogSpy: any;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		process.env.NODE_ENV = "development";
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		delete process.env.NODE_ENV;
	});

	describe("constructor", () => {
		it("should create instance with correct default values", () => {
			const error = new ServerError("Internal server error");

			expect(error.name).toBe("ServerError");
			expect(error.status).toBe(500);
			expect(error.statusText).toBe("Internal server error");
		});

		it("should set custom message", () => {
			const error = new ServerError("Database connection failed");

			expect(error.statusText).toBe("Database connection failed");
		});

		it("should set cause when provided", () => {
			const cause = { error: "ECONNREFUSED", host: "localhost", port: 5432 };
			const error = new ServerError("Database connection failed", cause);

			expect(error.cause).toBe(JSON.stringify(cause));
		});

		it("should not set cause when not provided", () => {
			const error = new ServerError("Internal server error");

			expect(error.cause).toBeUndefined();
		});

		it("should stringify complex cause object", () => {
			const cause = {
				error: "Unhandled exception",
				stack: "Error: Something went wrong\n    at Function.execute",
				timestamp: "2026-02-02T10:00:00Z",
				requestId: "req-abc-123",
			};
			const error = new ServerError("Unexpected error occurred", cause);

			expect(error.cause).toBe(JSON.stringify(cause));
		});

		it("should call onDebug on instantiation", () => {
			const _error = new ServerError("Internal server error");

			expect(consoleLogSpy).toHaveBeenCalled();
		});
	});

	describe("makeBody method", () => {
		it("should return correct body structure", () => {
			const error = new ServerError("Internal server error");
			const body = error.makeBody();

			expect(body).toEqual({
				name: "ServerError",
				message: "Internal server error",
				cause: undefined,
			});
		});

		it("should include cause in body when provided", () => {
			const cause = { code: "ERR_INTERNAL" };
			const error = new ServerError("Internal server error", cause);
			const body = error.makeBody();

			expect(body).toEqual({
				name: "ServerError",
				message: "Internal server error",
				cause: JSON.stringify(cause),
			});
		});
	});

	describe("toResponse method", () => {
		it("should return Response object", () => {
			const error = new ServerError("Internal server error");
			const response = error.toResponse();

			expect(response).toBeInstanceOf(Response);
		});

		it("should have correct status code", () => {
			const error = new ServerError("Internal server error");
			const response = error.toResponse();

			expect(response.status).toBe(500);
		});

		it("should have correct status text", () => {
			const error = new ServerError("Internal server error");
			const response = error.toResponse();

			expect(response.statusText).toBe("Internal server error");
		});

		it("should have correct Content-Type header", () => {
			const error = new ServerError("Internal server error");
			const response = error.toResponse();

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("should have correct JSON body", async () => {
			const error = new ServerError("Internal server error");
			const response = error.toResponse();
			const body = await response.json();

			expect(body).toEqual({
				name: "ServerError",
				message: "Internal server error",
				cause: undefined,
			});
		});

		it("should include cause in response body", async () => {
			const cause = { errorCode: "DB_ERROR" };
			const error = new ServerError("Database error", cause);
			const response = error.toResponse();
			const body = await response.json();

			expect(body.cause).toBe(JSON.stringify(cause));
		});

		it("should return valid JSON string", async () => {
			const error = new ServerError("Internal server error");
			const response = error.toResponse();
			const text = await response.text();

			expect(() => JSON.parse(text)).not.toThrow();
		});
	});

	describe("toJson method", () => {
		it("should return Response object", () => {
			const error = new ServerError("Internal server error");
			const response = error.toJson();

			expect(response).toBeInstanceOf(Response);
		});

		it("should have correct status code", () => {
			const error = new ServerError("Internal server error");
			const response = error.toJson();

			expect(response.status).toBe(500);
		});

		it("should have correct status text", () => {
			const error = new ServerError("Internal server error");
			const response = error.toJson();

			expect(response.statusText).toBe("Internal server error");
		});

		it("should have correct JSON body", async () => {
			const error = new ServerError("Internal server error");
			const response = error.toJson();
			const body = await response.json();

			expect(body).toEqual({
				name: "ServerError",
				message: "Internal server error",
				cause: undefined,
			});
		});

		it("should include cause in response body", async () => {
			const cause = { service: "payment-api", timeout: true };
			const error = new ServerError("Service timeout", cause);
			const response = error.toJson();
			const body = await response.json();

			expect(body.cause).toBe(JSON.stringify(cause));
		});

		it("should automatically set Content-Type to application/json", () => {
			const error = new ServerError("Internal server error");
			const response = error.toJson();

			expect(response.headers.get("Content-Type")).toContain(
				"application/json",
			);
		});
	});

	describe("integration scenarios", () => {
		it("should handle database connection failure", async () => {
			const cause = {
				error: "ECONNREFUSED",
				host: "db.example.com",
				port: 5432,
				database: "production",
			};
			const error = new ServerError("Database connection failed", cause);
			const response = error.toResponse();
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.message).toBe("Database connection failed");
			expect(body.cause).toBe(JSON.stringify(cause));
		});

		it("should handle unhandled exception", async () => {
			const cause = {
				type: "TypeError",
				message: "Cannot read property 'id' of undefined",
				stack: "TypeError: Cannot read property 'id' of undefined\n    at ...",
			};
			const error = new ServerError("An unexpected error occurred", cause);
			const response = error.toJson();
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.name).toBe("ServerError");
			expect(body.message).toBe("An unexpected error occurred");
		});

		it("should handle external API failure", async () => {
			const cause = {
				service: "stripe-api",
				statusCode: 503,
				message: "Service unavailable",
				retryAfter: 30,
			};
			const error = new ServerError("Payment service error", cause);
			const response = error.toResponse();
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.cause).toBe(JSON.stringify(cause));
		});

		it("should handle file system error", async () => {
			const cause = {
				code: "ENOENT",
				path: "/var/data/config.json",
				syscall: "open",
			};
			const error = new ServerError("Configuration file not accessible", cause);
			const response = error.toJson();

			expect(response.status).toBe(500);
			expect(response.statusText).toBe("Configuration file not accessible");
		});

		it("should handle memory allocation error", async () => {
			const cause = {
				error: "ENOMEM",
				requestedBytes: 1073741824,
				availableBytes: 536870912,
			};
			const error = new ServerError("Insufficient memory", cause);
			const response = error.toResponse();
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.message).toBe("Insufficient memory");
		});

		it("should handle cache service failure", async () => {
			const cause = {
				service: "redis",
				error: "Connection timeout",
				host: "cache.internal",
				port: 6379,
			};
			const error = new ServerError("Cache service unavailable", cause);
			const response = error.toResponse();

			expect(response.status).toBe(500);
		});

		it("should handle queue processing error", async () => {
			const cause = {
				queue: "email-notifications",
				jobId: "job-12345",
				attempts: 3,
				lastError: "SMTP connection refused",
			};
			const error = new ServerError("Failed to process queue job", cause);
			const response = error.toJson();
			const body = await response.json();

			expect(response.status).toBe(500);
			expect(body.cause).toBe(JSON.stringify(cause));
		});
	});

	describe("comparison between toResponse and toJson", () => {
		it("should produce equivalent responses", async () => {
			const error = new ServerError("Internal server error");
			const response1 = error.toResponse();
			const response2 = error.toJson();

			const body1 = await response1.json();
			const body2 = await response2.json();

			expect(body1).toEqual(body2);
			expect(response1.status).toBe(response2.status);
			expect(response1.statusText).toBe(response2.statusText);
		});

		it("should produce equivalent responses with cause", async () => {
			const cause = { error: "Test error", code: "ERR_TEST" };
			const error = new ServerError("Internal server error", cause);
			const response1 = error.toResponse();
			const response2 = error.toJson();

			const body1 = await response1.json();
			const body2 = await response2.json();

			expect(body1).toEqual(body2);
		});
	});

	describe("cause exposure by environment (SEC-05)", () => {
		afterEach(() => {
			delete process.env.NODE_ENV;
		});

		it("hides cause from the response body in production", async () => {
			process.env.NODE_ENV = "production";

			const cause = {
				stack: "Error: connect ECONNREFUSED\n    at internal/db.ts:12",
				sql: "SELECT * FROM users",
			};
			const error = new ServerError("Internal server error", cause);
			const body = await error.toResponse().json();

			expect(body).toEqual({
				name: "ServerError",
				message: "Internal server error",
				cause: undefined,
			});
		});

		it("still exposes cause in development for debugging", async () => {
			process.env.NODE_ENV = "development";

			const cause = { errorCode: "DB_ERROR" };
			const error = new ServerError("Internal server error", cause);
			const body = await error.toResponse().json();

			expect(body.cause).toBe(JSON.stringify(cause));
		});
	});

	describe("edge cases", () => {
		it("should handle empty message", () => {
			const error = new ServerError("");

			expect(error.statusText).toBe("");
			expect(error.status).toBe(500);
		});

		it("should handle very long message", () => {
			const longMessage = "A".repeat(1000);
			const error = new ServerError(longMessage);

			expect(error.statusText).toBe(longMessage);
		});

		it("should handle null cause", () => {
			const error = new ServerError("Internal server error", null);

			expect(error.cause).toBeUndefined();
		});

		it("should handle undefined cause explicitly", () => {
			const error = new ServerError("Internal server error", undefined);

			expect(error.cause).toBeUndefined();
		});

		it("should handle array as cause", () => {
			const cause = ["error1", "error2", "error3"];
			const error = new ServerError("Multiple errors occurred", cause);

			expect(error.cause).toBe(JSON.stringify(cause));
		});

		it("should handle nested object as cause", () => {
			const cause = {
				primary: {
					code: "DB_ERROR",
					message: "Connection refused",
				},
				secondary: {
					code: "CACHE_ERROR",
					message: "Redis timeout",
				},
				timestamp: "2026-02-02T10:00:00Z",
			};
			const error = new ServerError("Multiple service failures", cause);

			expect(error.cause).toBe(JSON.stringify(cause));
		});

		it("should handle special characters in message", () => {
			const message = 'Server Error: {"code": "ERR_500"}';
			const error = new ServerError(message);

			expect(error.statusText).toBe(message);
		});

		it("should handle unicode characters in message", () => {
			const message = "Erro interno do servidor: 服务器内部错误";
			const error = new ServerError(message);

			expect(error.statusText).toBe(message);
		});

		it("should handle boolean as cause", () => {
			const error = new ServerError("Internal server error", true);

			expect(error.cause).toBe("true");
		});

		it("should handle number as cause", () => {
			const error = new ServerError("Internal server error", 500);

			expect(error.cause).toBe("500");
		});

		it("should handle empty object as cause", () => {
			const error = new ServerError("Internal server error", {});

			expect(error.cause).toBe("{}");
		});

		it("should handle empty array as cause", () => {
			const error = new ServerError("Internal server error", []);

			expect(error.cause).toBe("[]");
		});

		it("should handle error object as cause", () => {
			const originalError = new Error("Original error message");
			const cause = {
				name: originalError.name,
				message: originalError.message,
				stack: originalError.stack,
			};
			const error = new ServerError("Wrapped error", cause);

			expect(error.cause).toBe(JSON.stringify(cause));
		});

		it("should handle circular reference prevention", () => {
			const cause = { id: 1, name: "test" };
			const error = new ServerError("Internal server error", cause);

			// biome-ignore lint/style/noNonNullAssertion: intentional
			expect(() => JSON.parse(error.cause!)).not.toThrow();
		});
	});
});
