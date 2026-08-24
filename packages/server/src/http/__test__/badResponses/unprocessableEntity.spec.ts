import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnprocessableEntity } from "../../badResponses/unprocessableEntity";

describe("UnprocessableEntity", () => {
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
			const error = new UnprocessableEntity({ message: "Validation failed" });

			expect(error.name).toBe("UnprocessableEntity");
			expect(error.status).toBe(422);
			expect(error.statusText).toBe("Validation failed");
		});

		it("should set default message when not provided", () => {
			const error = new UnprocessableEntity({});

			expect(error.statusText).toBe("Unprocessable entity");
		});

		it("should set fieldErrors when provided", () => {
			const fieldErrors = {
				email: "Invalid email format",
				password: "Password too short",
			};
			const error = new UnprocessableEntity({ fieldErrors });

			expect(error.cause).toEqual({
				data: undefined,
				fieldErrors,
				fields: undefined,
			});
		});

		it("should set fields when provided", () => {
			const fields = {
				email: "invalid-email",
				password: "123",
			};
			const error = new UnprocessableEntity({ fields });

			expect(error.cause).toEqual({
				data: undefined,
				fieldErrors: undefined,
				fields: { email: "invalid-email", password: "****" },
			});
		});

		it("should redact a sensitive field's value instead of echoing it back", () => {
			const error = new UnprocessableEntity({
				fields: { email: "user@example.com", password: "hunter2" },
			});

			expect(error.cause.fields).toEqual({
				email: "user@example.com",
				password: "****",
			});
		});

		it("should redact token/authorization-shaped fields", () => {
			const error = new UnprocessableEntity({
				fields: { token: "abc123", authorization: "Bearer xyz" },
			});

			expect(error.cause.fields).toEqual({
				token: "****",
				authorization: "****",
			});
		});

		it("should redact sensitive values nested inside data", () => {
			const error = new UnprocessableEntity({
				data: { user: { email: "user@example.com", secret: "top-secret" } },
			});

			expect(error.cause.data).toEqual({
				user: { email: "user@example.com", secret: "****" },
			});
		});

		it("should set data when provided", () => {
			const data = { additionalInfo: "Some extra data" };
			const error = new UnprocessableEntity({ data });

			expect(error.cause).toEqual({
				data,
				fieldErrors: undefined,
				fields: undefined,
			});
		});

		it("should set all properties when provided", () => {
			const props = {
				message: "Validation failed",
				fieldErrors: { email: "Invalid email" },
				fields: { email: "bad-email" },
				data: { timestamp: "2026-02-02" },
			};
			const error = new UnprocessableEntity(props);

			expect(error.statusText).toBe("Validation failed");
			expect(error.cause).toEqual({
				data: props.data,
				fieldErrors: props.fieldErrors,
				fields: props.fields,
			});
		});

		it("should call onDebug on instantiation", () => {
			const _error = new UnprocessableEntity({ message: "Validation failed" });

			expect(consoleLogSpy).toHaveBeenCalled();
		});
	});

	describe("makeBody method", () => {
		it("should return correct body structure", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const body = error.makeBody();

			expect(body).toEqual({
				name: "UnprocessableEntity",
				message: "Validation failed",
				cause: {
					data: undefined,
					fieldErrors: undefined,
					fields: undefined,
				},
			});
		});

		it("should include all cause properties in body", () => {
			const props = {
				message: "Validation failed",
				fieldErrors: { email: "Invalid email" },
				fields: { email: "bad-email" },
				data: { extra: "info" },
			};
			const error = new UnprocessableEntity(props);
			const body = error.makeBody();

			expect(body).toEqual({
				name: "UnprocessableEntity",
				message: "Validation failed",
				cause: {
					data: props.data,
					fieldErrors: props.fieldErrors,
					fields: props.fields,
				},
			});
		});
	});

	describe("toResponse method", () => {
		it("should return Response object", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toResponse();

			expect(response).toBeInstanceOf(Response);
		});

		it("should have correct status code", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toResponse();

			expect(response.status).toBe(422);
		});

		it("should have correct status text", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toResponse();

			expect(response.statusText).toBe("Validation failed");
		});

		it("should have correct Content-Type header", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toResponse();

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("should have correct JSON body", async () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toResponse();
			const body = await response.json();

			expect(body).toEqual({
				name: "UnprocessableEntity",
				message: "Validation failed",
				cause: {
					data: undefined,
					fieldErrors: undefined,
					fields: undefined,
				},
			});
		});

		it("should include fieldErrors in response body", async () => {
			const fieldErrors = { email: "Invalid format" };
			const error = new UnprocessableEntity({ fieldErrors });
			const response = error.toResponse();
			const body = await response.json();

			expect(body.cause.fieldErrors).toEqual(fieldErrors);
		});

		it("should return valid JSON string", async () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toResponse();
			const text = await response.text();

			expect(() => JSON.parse(text)).not.toThrow();
		});
	});

	describe("toJson method", () => {
		it("should return Response object", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toJson();

			expect(response).toBeInstanceOf(Response);
		});

		it("should have correct status code", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toJson();

			expect(response.status).toBe(422);
		});

		it("should have correct status text", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toJson();

			expect(response.statusText).toBe("Validation failed");
		});

		it("should have correct JSON body", async () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toJson();
			const body = await response.json();

			expect(body).toEqual({
				name: "UnprocessableEntity",
				message: "Validation failed",
				cause: {
					data: undefined,
					fieldErrors: undefined,
					fields: undefined,
				},
			});
		});

		it("should include all cause data in response body", async () => {
			const props = {
				message: "Form validation failed",
				fieldErrors: { username: "Already taken" },
				fields: { username: "john_doe" },
				data: { suggestions: ["john_doe_1", "john_doe_2"] },
			};
			const error = new UnprocessableEntity(props);
			const response = error.toJson();
			const body = await response.json();

			expect(body.cause).toEqual({
				data: props.data,
				fieldErrors: props.fieldErrors,
				fields: props.fields,
			});
		});

		it("should automatically set Content-Type to application/json", () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response = error.toJson();

			expect(response.headers.get("Content-Type")).toContain(
				"application/json",
			);
		});
	});

	describe("integration scenarios", () => {
		it("should handle form validation errors", async () => {
			const props = {
				message: "Form validation failed",
				fieldErrors: {
					email: "Invalid email format",
					password: "Must be at least 8 characters",
					confirmPassword: "Passwords do not match",
				},
				fields: {
					email: "invalid-email",
					password: "123",
					confirmPassword: "456",
				},
			};
			const error = new UnprocessableEntity(props);
			const response = error.toResponse();
			const body = await response.json();

			expect(response.status).toBe(422);
			expect(body.message).toBe("Form validation failed");
			expect(body.cause.fieldErrors).toEqual(props.fieldErrors);
			expect(body.cause.fields).toEqual({
				email: "invalid-email",
				password: "****",
				confirmPassword: "****",
			});
		});

		it("should handle single field validation error", async () => {
			const props = {
				message: "Email validation failed",
				fieldErrors: { email: "Email already exists" },
				fields: { email: "user@example.com" },
			};
			const error = new UnprocessableEntity(props);
			const response = error.toJson();
			const body = await response.json();

			expect(response.status).toBe(422);
			expect(body.name).toBe("UnprocessableEntity");
			expect(body.cause.fieldErrors.email).toBe("Email already exists");
		});

		it("should handle complex data validation", async () => {
			const props = {
				message: "Invalid request data",
				data: {
					receivedType: "string",
					expectedType: "number",
					field: "age",
				},
			};
			const error = new UnprocessableEntity(props);
			const response = error.toResponse();
			const body = await response.json();

			expect(response.status).toBe(422);
			expect(body.cause.data).toEqual(props.data);
		});

		it("should handle array validation errors", async () => {
			const props = {
				message: "Array validation failed",
				fieldErrors: {
					"items[0].name": "Name is required",
					"items[1].price": "Price must be positive",
				},
				data: {
					arrayField: "items",
					invalidIndices: [0, 1],
				},
			};
			const error = new UnprocessableEntity(props);
			const response = error.toJson();
			const body = await response.json();

			expect(response.status).toBe(422);
			expect(body.cause.fieldErrors["items[0].name"]).toBe("Name is required");
		});

		it("should handle nested object validation", async () => {
			const props = {
				message: "Nested validation failed",
				fieldErrors: {
					"address.street": "Street is required",
					"address.city": "City is required",
					"address.zipCode": "Invalid zip code format",
				},
				fields: {
					"address.street": "",
					"address.city": "",
					"address.zipCode": "invalid",
				},
			};
			const error = new UnprocessableEntity(props);
			const response = error.toResponse();
			const body = await response.json();

			expect(response.status).toBe(422);
			expect(Object.keys(body.cause.fieldErrors)).toHaveLength(3);
		});

		it("should handle file upload validation", async () => {
			const props = {
				message: "File validation failed",
				fieldErrors: {
					avatar: "File size exceeds 5MB limit",
				},
				data: {
					maxSize: "5MB",
					receivedSize: "10MB",
					allowedTypes: ["image/jpeg", "image/png"],
				},
			};
			const error = new UnprocessableEntity(props);
			const response = error.toResponse();

			expect(response.status).toBe(422);
		});
	});

	describe("comparison between toResponse and toJson", () => {
		it("should produce equivalent responses", async () => {
			const error = new UnprocessableEntity({ message: "Validation failed" });
			const response1 = error.toResponse();
			const response2 = error.toJson();

			const body1 = await response1.json();
			const body2 = await response2.json();

			expect(body1).toEqual(body2);
			expect(response1.status).toBe(response2.status);
			expect(response1.statusText).toBe(response2.statusText);
		});

		it("should produce equivalent responses with full props", async () => {
			const props = {
				message: "Validation failed",
				fieldErrors: { email: "Invalid" },
				fields: { email: "test" },
				data: { extra: "info" },
			};
			const error = new UnprocessableEntity(props);
			const response1 = error.toResponse();
			const response2 = error.toJson();

			const body1 = await response1.json();
			const body2 = await response2.json();

			expect(body1).toEqual(body2);
		});
	});

	describe("cause exposure in production (SEC-05)", () => {
		afterEach(() => {
			delete process.env.NODE_ENV;
		});

		it("still returns fieldErrors/fields in production so the client can repopulate the form", async () => {
			process.env.NODE_ENV = "production";

			const props = {
				message: "Validation failed",
				fieldErrors: { email: "Invalid email" },
				fields: { email: "bad-email" },
			};
			const error = new UnprocessableEntity(props);
			const body = await error.toResponse().json();

			expect(body.cause).toEqual({
				data: undefined,
				fieldErrors: props.fieldErrors,
				fields: props.fields,
			});
		});
	});

	describe("edge cases", () => {
		it("should handle empty props object", () => {
			const error = new UnprocessableEntity({});

			expect(error.statusText).toBe("Unprocessable entity");
			expect(error.status).toBe(422);
			expect(error.cause).toEqual({
				data: undefined,
				fieldErrors: undefined,
				fields: undefined,
			});
		});

		it("should handle empty message", () => {
			const error = new UnprocessableEntity({ message: "" });

			expect(error.statusText).toBe("Unprocessable entity");
			expect(error.status).toBe(422);
		});

		it("should handle very long message", () => {
			const longMessage = "A".repeat(1000);
			const error = new UnprocessableEntity({ message: longMessage });

			expect(error.statusText).toBe(longMessage);
		});

		it("should handle empty fieldErrors object", () => {
			const error = new UnprocessableEntity({ fieldErrors: {} });

			expect(error.cause.fieldErrors).toEqual({});
		});

		it("should handle empty fields object", () => {
			const error = new UnprocessableEntity({ fields: {} });

			expect(error.cause.fields).toEqual({});
		});

		it("should handle null data", () => {
			const error = new UnprocessableEntity({ data: null });

			expect(error.cause.data).toBeNull();
		});

		it("should handle array as data", () => {
			const data = ["error1", "error2", "error3"];
			const error = new UnprocessableEntity({ data });

			expect(error.cause.data).toEqual(data);
		});

		it("should handle nested object as data", () => {
			const data = {
				validation: {
					rules: {
						email: ["required", "email"],
						age: ["required", "min:18"],
					},
				},
			};
			const error = new UnprocessableEntity({ data });

			expect(error.cause.data).toEqual(data);
		});

		it("should handle special characters in message", () => {
			const message = 'Unprocessable: {"field": "value"}';
			const error = new UnprocessableEntity({ message });

			expect(error.statusText).toBe(message);
		});

		it("should handle unicode characters in message", () => {
			const message = "Entidade não processável: 无法处理的实体";
			const error = new UnprocessableEntity({ message });

			expect(error.statusText).toBe(message);
		});

		it("should handle special characters in fieldErrors", () => {
			const fieldErrors = {
				"field.with.dots": "Error message",
				"field[0]": "Array error",
				"field-with-dashes": "Dash error",
			};
			const error = new UnprocessableEntity({ fieldErrors });

			expect(error.cause.fieldErrors).toEqual(fieldErrors);
		});

		it("should handle unicode in fieldErrors values", () => {
			const fieldErrors = {
				email: "邮箱格式不正确",
				password: "密码太短",
			};
			const error = new UnprocessableEntity({ fieldErrors });

			expect(error.cause.fieldErrors).toEqual(fieldErrors);
		});

		it("should handle large number of field errors", () => {
			const fieldErrors: Record<string, string> = {};
			for (let i = 0; i < 100; i++) {
				fieldErrors[`field${i}`] = `Error for field ${i}`;
			}
			const error = new UnprocessableEntity({ fieldErrors });

			// biome-ignore lint/style/noNonNullAssertion: intentional
			expect(Object.keys(error.cause.fieldErrors!)).toHaveLength(100);
		});

		it("should handle boolean in data", () => {
			const error = new UnprocessableEntity({ data: { isValid: false } });

			expect(error.cause.data).toEqual({ isValid: false });
		});

		it("should handle number in fields", () => {
			const error = new UnprocessableEntity({
				fields: { age: "25", price: "99.99" },
			});

			expect(error.cause.fields).toEqual({ age: "25", price: "99.99" });
		});
	});
});
