import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadResponse } from "../../badResponses/_badResponse";

describe("BadResponse", () => {
	describe("constructor and default values", () => {
		it("should create instance with default values", () => {
			const badResponse = new BadResponse();

			expect(badResponse.name).toBe("BadResponse");
			expect(badResponse.status).toBe(500);
			expect(badResponse.statusText).toBe("Unknown error");
			expect(badResponse.cause).toBeUndefined();
		});

		it("should allow setting custom status", () => {
			const badResponse = new BadResponse();
			badResponse.status = 400;

			expect(badResponse.status).toBe(400);
		});

		it("should allow setting custom statusText", () => {
			const badResponse = new BadResponse();
			badResponse.statusText = "Custom error message";

			expect(badResponse.statusText).toBe("Custom error message");
		});

		it("should allow setting custom name", () => {
			const badResponse = new BadResponse();
			badResponse.name = "CustomError";

			expect(badResponse.name).toBe("CustomError");
		});

		it("should allow setting cause", () => {
			const badResponse = new BadResponse();
			const cause = { error: "Database connection failed" };
			badResponse.cause = cause;

			expect(badResponse.cause).toEqual(cause);
		});
	});

	describe("makeBody method", () => {
		it("should return body with name and message", () => {
			const badResponse = new BadResponse();
			const body = badResponse.makeBody();

			expect(body).toEqual({
				name: "BadResponse",
				message: "Unknown error",
				cause: undefined,
			});
		});

		it("should include cause in body when set", () => {
			const badResponse = new BadResponse();
			const cause = { error: "Database error" };
			badResponse.cause = cause;

			const body = badResponse.makeBody();

			expect(body).toEqual({
				name: "BadResponse",
				message: "Unknown error",
				cause: cause,
			});
		});

		it("should return custom message in body", () => {
			const badResponse = new BadResponse();
			badResponse.statusText = "Custom error message";

			const body = badResponse.makeBody();

			expect(body.message).toBe("Custom error message");
		});

		it("should return custom name in body", () => {
			const badResponse = new BadResponse();
			badResponse.name = "ValidationError";

			const body = badResponse.makeBody();

			expect(body.name).toBe("ValidationError");
		});

		it("should handle complex cause object", () => {
			const badResponse = new BadResponse();
			const cause = {
				error: "Validation failed",
				fields: ["email", "password"],
				timestamp: "2024-01-01T00:00:00Z",
			};
			badResponse.cause = cause;

			const body = badResponse.makeBody();

			expect(body.cause).toEqual(cause);
		});

		it("should handle null cause", () => {
			const badResponse = new BadResponse();
			badResponse.cause = null;

			const body = badResponse.makeBody();

			expect(body.cause).toBeNull();
		});
	});

	describe("cause exposure by environment (SEC-05)", () => {
		afterEach(() => {
			delete process.env.NODE_ENV;
		});

		it("includes cause in the body in development", () => {
			process.env.NODE_ENV = "development";

			const badResponse = new BadResponse();
			badResponse.cause = { stack: "at internal/module.js:42" };

			expect(badResponse.makeBody().cause).toEqual({
				stack: "at internal/module.js:42",
			});
		});

		it("omits cause from the body in production by default", () => {
			process.env.NODE_ENV = "production";

			const badResponse = new BadResponse();
			badResponse.cause = {
				stack: "at internal/module.js:42",
				sql: "SELECT * FROM users WHERE password = 'x'",
			};

			const body = badResponse.makeBody();

			expect(body.cause).toBeUndefined();
			expect(JSON.stringify(body)).not.toContain("internal/module.js");
		});

		it("still reports name and message in production even when cause is hidden", () => {
			process.env.NODE_ENV = "production";

			const badResponse = new BadResponse();
			badResponse.name = "DatabaseError";
			badResponse.statusText = "Something went wrong";
			badResponse.cause = { secret: "value" };

			expect(badResponse.makeBody()).toEqual({
				name: "DatabaseError",
				message: "Something went wrong",
				cause: undefined,
			});
		});

		it("keeps cause visible in production when exposeCauseInProduction is set", () => {
			process.env.NODE_ENV = "production";

			class ClientFacingResponse extends BadResponse {
				constructor() {
					super();
					this.exposeCauseInProduction = true;
					this.cause = { fieldErrors: { email: "Invalid email" } };
				}
			}

			const response = new ClientFacingResponse();

			expect(response.makeBody().cause).toEqual({
				fieldErrors: { email: "Invalid email" },
			});
		});

		it("does not hide cause for non-production environments like test/staging", () => {
			process.env.NODE_ENV = "staging";

			const badResponse = new BadResponse();
			badResponse.cause = { detail: "still visible" };

			expect(badResponse.makeBody().cause).toEqual({ detail: "still visible" });
		});
	});

	describe("onDebug method", () => {
		// biome-ignore lint/suspicious/noExplicitAny: intentional
		let consoleLogSpy: any;

		beforeEach(() => {
			consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			process.env.NODE_ENV = "development";
		});

		afterEach(() => {
			consoleLogSpy.mockRestore();
			delete process.env.NODE_ENV;
			delete process.env.SHOW_ERRORS_IN_CONSOLE;
		});

		it("should call flushDebugLogs in development mode", () => {
			const badResponse = new BadResponse();
			badResponse.onDebug();

			expect(consoleLogSpy).toHaveBeenCalled();
		});

		it("should include statusText in debug logs", () => {
			const badResponse = new BadResponse();
			badResponse.statusText = "Test error message";
			badResponse.onDebug();

			const loggedMessage = consoleLogSpy.mock.calls[0][0];
			expect(loggedMessage).toContain("Test error message");
		});

		it("should include cause in debug logs when set", () => {
			const badResponse = new BadResponse();
			const cause = { error: "Test cause" };
			badResponse.cause = cause;
			badResponse.onDebug();

			const loggedMessage = consoleLogSpy.mock.calls[0][0];
			expect(loggedMessage).toContain("Cause:");
			expect(loggedMessage).toContain("Test cause");
		});

		it("should include caller function information", () => {
			const badResponse = new BadResponse();
			badResponse.onDebug();

			const loggedMessage = consoleLogSpy.mock.calls[0][0];
			expect(loggedMessage).toContain("Caller Function:");
		});

		it("should include caller location information", () => {
			const badResponse = new BadResponse();
			badResponse.onDebug();

			const loggedMessage = consoleLogSpy.mock.calls[0][0];
			expect(loggedMessage).toContain("Caller Location:");
		});

		it("should use red color scheme", () => {
			const badResponse = new BadResponse();
			badResponse.onDebug();

			const loggedMessage = consoleLogSpy.mock.calls[0][0];
			expect(loggedMessage).toContain("\x1b[31m"); // Red color code
		});

		it("should show name in debug logs", () => {
			const badResponse = new BadResponse();
			badResponse.name = "CustomError";
			badResponse.onDebug();

			const loggedMessage = consoleLogSpy.mock.calls[0][0];
			expect(loggedMessage).toContain("[CustomError]");
		});

		it("should not log when not in debug mode", () => {
			process.env.NODE_ENV = "production";
			delete process.env.SHOW_ERRORS_IN_CONSOLE;

			const badResponse = new BadResponse();
			badResponse.onDebug();

			expect(consoleLogSpy).not.toHaveBeenCalled();
		});

		it("should log when DEBUG_MODE is true", () => {
			process.env.NODE_ENV = "production";
			process.env.DEBUG_MODE = "true";

			const badResponse = new BadResponse();
			badResponse.onDebug();

			expect(consoleLogSpy).toHaveBeenCalled();
		});
	});

	describe("integration scenarios", () => {
		it("should handle complete error scenario", () => {
			const badResponse = new BadResponse();
			badResponse.name = "DatabaseError";
			badResponse.status = 503;
			badResponse.statusText = "Service unavailable";
			badResponse.cause = {
				error: "Connection timeout",
				retryAfter: 5000,
			};

			const body = badResponse.makeBody();

			expect(body).toEqual({
				name: "DatabaseError",
				message: "Service unavailable",
				cause: { error: "Connection timeout", retryAfter: 5000 },
			});
			expect(badResponse.status).toBe(503);
		});

		it("should maintain independent instances", () => {
			const error1 = new BadResponse();
			error1.name = "Error1";
			error1.status = 400;

			const error2 = new BadResponse();
			error2.name = "Error2";
			error2.status = 404;

			expect(error1.name).toBe("Error1");
			expect(error1.status).toBe(400);
			expect(error2.name).toBe("Error2");
			expect(error2.status).toBe(404);
		});
	});
});
