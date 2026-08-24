import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `validateEmail` performs real DNS lookups (MX/A/AAAA). Mocking `node:dns` keeps these
// tests deterministic and offline instead of depending on live internet/DNS (TEST-01).
const { resolveMock } = vi.hoisted(() => ({ resolveMock: vi.fn() }));

vi.mock("node:dns", () => ({
	default: { promises: { resolve: resolveMock } },
	promises: { resolve: resolveMock },
}));

import { validateEmail } from "../validateEmail";

function enotfound() {
	return Object.assign(new Error("queryMx ENOTFOUND"), { code: "ENOTFOUND" });
}

function enodata() {
	return Object.assign(new Error("queryMx ENODATA"), { code: "ENODATA" });
}

describe("validateEmail", () => {
	beforeEach(() => {
		resolveMock.mockReset();
		// Default: every DNS lookup succeeds, so format/syntax-focused tests below don't
		// need to care about DNS at all.
		resolveMock.mockResolvedValue([
			{ exchange: "mx.example.com", priority: 10 },
		]);
	});

	describe("valid email formats", () => {
		it("should validate standard email format", async () => {
			const result = await validateEmail("user@gmail.com");
			expect(result).toBe(true);
		});

		it("should validate email with subdomain", async () => {
			const result = await validateEmail("user@mail.google.com");
			expect(result).toBe(true);
		});

		it("should validate email with numbers", async () => {
			const result = await validateEmail("user123@gmail.com");
			expect(result).toBe(true);
		});

		it("should validate email with dots in local part", async () => {
			const result = await validateEmail("first.last@gmail.com");
			expect(result).toBe(true);
		});

		it("should validate email with hyphen in domain", async () => {
			const result = await validateEmail("user@my-domain.com");
			expect(result).toBe(true);
		});

		it("should validate email with plus sign", async () => {
			const result = await validateEmail("user+tag@gmail.com");
			expect(result).toBe(true);
		});

		it("should validate email with underscore", async () => {
			const result = await validateEmail("user_name@gmail.com");
			expect(result).toBe(true);
		});
	});

	describe("valid email with special characters", () => {
		it("should validate email with allowed special chars", async () => {
			const result = await validateEmail("user.name+tag@gmail.com");
			expect(result).toBe(true);
		});

		it("should validate email with percent sign", async () => {
			const result = await validateEmail("user%test@gmail.com");
			expect(result).toBe(true);
		});

		it("should validate email with apostrophe", async () => {
			const result = await validateEmail("o'neil@gmail.com");
			expect(result).toBe(true);
		});
	});

	describe("invalid email formats", () => {
		it("should reject email without @", async () => {
			const result = await validateEmail("usergmail.com");
			expect(result).toBe(false);
		});

		it("should reject email with multiple @", async () => {
			const result = await validateEmail("user@@gmail.com");
			expect(result).toBe(false);
		});

		it("should reject email without domain", async () => {
			const result = await validateEmail("user@");
			expect(result).toBe(false);
		});

		it("should reject email without local part", async () => {
			const result = await validateEmail("@gmail.com");
			expect(result).toBe(false);
		});

		it("should reject email with spaces", async () => {
			const result = await validateEmail("user name@gmail.com");
			expect(result).toBe(false);
		});

		it("should reject email with invalid characters", async () => {
			const result = await validateEmail("user#name@gmail.com");
			expect(result).toBe(false);
		});
	});

	describe("local part validation", () => {
		it("should reject email starting with dot", async () => {
			const result = await validateEmail(".user@gmail.com");
			expect(result).toBe(false);
		});

		it("should reject email ending with dot before @", async () => {
			const result = await validateEmail("user.@gmail.com");
			expect(result).toBe(false);
		});

		it("should reject email with consecutive dots", async () => {
			const result = await validateEmail("user..name@gmail.com");
			expect(result).toBe(false);
		});

		it("should reject local part longer than 64 characters", async () => {
			const longLocal = "a".repeat(65);
			const result = await validateEmail(`${longLocal}@gmail.com`);
			expect(result).toBe(false);
		});

		it("should validate local part with 64 characters", async () => {
			const longLocal = "a".repeat(64);
			const result = await validateEmail(`${longLocal}@gmail.com`);
			expect(result).toBe(true);
		});

		it("should reject empty local part", async () => {
			const result = await validateEmail("@gmail.com");
			expect(result).toBe(false);
		});
	});

	describe("domain part validation", () => {
		it("should reject domain starting with dot", async () => {
			const result = await validateEmail("user@.gmail.com");
			expect(result).toBe(false);
		});

		it("should reject domain ending with dot", async () => {
			const result = await validateEmail("user@gmail.com.");
			expect(result).toBe(false);
		});

		it("should reject domain starting with hyphen", async () => {
			const result = await validateEmail("user@-gmail.com");
			expect(result).toBe(false);
		});

		it("should reject domain ending with hyphen", async () => {
			const result = await validateEmail("user@gmail-.com");
			expect(result).toBe(false);
		});

		it("should reject domain without TLD", async () => {
			const result = await validateEmail("user@gmail");
			expect(result).toBe(false);
		});

		it("should reject domain with single character TLD", async () => {
			const result = await validateEmail("user@gmail.c");
			expect(result).toBe(false);
		});

		it("should reject domain longer than 253 characters", async () => {
			const longDomain = `${"a".repeat(250)}.com`;
			const result = await validateEmail(`user@${longDomain}`);
			expect(result).toBe(false);
		});

		it("should reject domain label longer than 63 characters", async () => {
			const longLabel = "a".repeat(64);
			const result = await validateEmail(`user@${longLabel}.com`);
			expect(result).toBe(false);
		});

		it("should reject TLD with numbers", async () => {
			const result = await validateEmail("user@gmail.c0m");
			expect(result).toBe(false);
		});

		it("should reject domain with special characters", async () => {
			const result = await validateEmail("user@gm@il.com");
			expect(result).toBe(false);
		});
	});

	describe("DNS validation", () => {
		it("should validate email when the domain has an MX record", async () => {
			resolveMock.mockImplementation((_domain, type) =>
				type === "MX"
					? Promise.resolve([{ exchange: "mx.example.com", priority: 10 }])
					: Promise.reject(enotfound()),
			);

			const result = await validateEmail("user@example.com");

			expect(result).toBe(true);
			expect(resolveMock).toHaveBeenCalledWith("example.com", "MX");
		});

		it("should fall back to the A record when MX is absent", async () => {
			resolveMock.mockImplementation((_domain, type) => {
				if (type === "MX") return Promise.reject(enotfound());
				if (type === "A") return Promise.resolve(["93.184.216.34"]);
				return Promise.reject(enotfound());
			});

			const result = await validateEmail("user@example.com");

			expect(result).toBe(true);
		});

		it("should fall back to the AAAA record when MX and A are absent", async () => {
			resolveMock.mockImplementation((_domain, type) => {
				if (type === "AAAA") return Promise.resolve(["2606:2800:220:1::"]);
				return Promise.reject(enotfound());
			});

			const result = await validateEmail("user@example.com");

			expect(result).toBe(true);
		});

		it("should reject when the domain has no MX/A/AAAA records (ENOTFOUND)", async () => {
			resolveMock.mockRejectedValue(enotfound());

			const result = await validateEmail(
				"user@thisisnotarealdomain123456789.com",
			);

			expect(result).toBe(false);
			expect(resolveMock).toHaveBeenCalledTimes(3);
		});

		it("should reject when DNS resolves with ENODATA for every record type", async () => {
			resolveMock.mockRejectedValue(enodata());

			const result = await validateEmail("user@example.com");

			expect(result).toBe(false);
		});

		it("should treat an unexpected DNS error as no record found, without throwing", async () => {
			resolveMock.mockRejectedValue(new Error("EBADRESP: malformed response"));

			await expect(validateEmail("user@example.com")).resolves.toBe(false);
		});
	});

	describe("DNS timeout (SEC-09)", () => {
		afterEach(() => {
			vi.useRealTimers();
		});

		it("resolves to false instead of hanging when DNS never responds", async () => {
			resolveMock.mockImplementation(() => new Promise(() => {}));

			const start = Date.now();
			const result = await validateEmail("user@example.com", {
				dnsTimeoutMs: 30,
			});

			expect(result).toBe(false);
			// 3 record types * 30ms timeout, plus generous scheduling slack.
			expect(Date.now() - start).toBeLessThan(1000);
		});

		it("uses the default timeout when none is provided", async () => {
			vi.useFakeTimers();
			resolveMock.mockImplementation(() => new Promise(() => {}));

			const promise = validateEmail("user@example.com");
			await vi.advanceTimersByTimeAsync(5000);
			await vi.advanceTimersByTimeAsync(5000);
			await vi.advanceTimersByTimeAsync(5000);

			await expect(promise).resolves.toBe(false);
		});

		it("does not wait for the timeout when DNS responds quickly", async () => {
			resolveMock.mockResolvedValue([
				{ exchange: "mx.example.com", priority: 10 },
			]);

			const start = Date.now();
			const result = await validateEmail("user@example.com", {
				dnsTimeoutMs: 5000,
			});

			expect(result).toBe(true);
			expect(Date.now() - start).toBeLessThan(1000);
		});

		it("applies the configured timeout independently to each record type", async () => {
			resolveMock.mockImplementation(() => new Promise(() => {}));

			const result = await validateEmail("user@example.com", {
				dnsTimeoutMs: 20,
			});

			expect(result).toBe(false);
			expect(resolveMock).toHaveBeenCalledTimes(3);
		});
	});

	describe("edge cases", () => {
		it("should reject empty string", async () => {
			const result = await validateEmail("");
			expect(result).toBe(false);
		});

		it("should reject whitespace only", async () => {
			const result = await validateEmail("   ");
			expect(result).toBe(false);
		});

		it("should handle email with leading whitespace", async () => {
			const result = await validateEmail("  user@gmail.com");
			expect(result).toBe(true);
		});

		it("should handle email with trailing whitespace", async () => {
			const result = await validateEmail("user@gmail.com  ");
			expect(result).toBe(true);
		});

		it("should reject email with only @", async () => {
			const result = await validateEmail("@");
			expect(result).toBe(false);
		});

		it("should reject email with only domain", async () => {
			const result = await validateEmail("gmail.com");
			expect(result).toBe(false);
		});
	});

	describe("case sensitivity", () => {
		it("should handle uppercase domain", async () => {
			const result = await validateEmail("user@GMAIL.COM");
			expect(result).toBe(true);
		});

		it("should handle mixed case domain", async () => {
			const result = await validateEmail("user@GmAiL.CoM");
			expect(result).toBe(true);
		});

		it("should handle uppercase local part", async () => {
			const result = await validateEmail("USER@gmail.com");
			expect(result).toBe(true);
		});
	});

	describe("international domains", () => {
		it("should validate email with country TLD", async () => {
			const result = await validateEmail("user@example.co.uk");
			expect(result).toBe(true);
		});

		it("should validate email with multiple subdomains", async () => {
			const result = await validateEmail("user@mail.company.co.uk");
			expect(result).toBe(true);
		});
	});

	describe("boundary testing", () => {
		it("should validate minimum valid email", async () => {
			const result = await validateEmail("a@bc.de");
			expect(result).toBe(true);
		});

		it("should validate email at local part max length", async () => {
			const localPart = "a".repeat(64);
			const result = await validateEmail(`${localPart}@gmail.com`);
			expect(result).toBe(true);
		});
	});
});
