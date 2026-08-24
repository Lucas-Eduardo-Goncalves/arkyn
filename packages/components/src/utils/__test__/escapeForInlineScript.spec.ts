import { describe, expect, it } from "vitest";
import {
	isValidJsIdentifier,
	toSafeScriptJson,
	toSafeScriptString,
} from "../escapeForInlineScript";

describe("toSafeScriptString", () => {
	it("wraps a normal value in a quoted JS string literal", () => {
		expect(toSafeScriptString("G-XXXXXXXXXX")).toBe('"G-XXXXXXXXXX"');
	});

	it("handles an empty string", () => {
		expect(toSafeScriptString("")).toBe('""');
	});

	it("escapes double quotes so the value can't break out of the literal", () => {
		const result = toSafeScriptString('"); alert(1); //');
		expect(result).toBe('"\\"); alert(1); //"');
	});

	it("escapes backslashes", () => {
		expect(toSafeScriptString("a\\b")).toBe('"a\\\\b"');
	});

	it("neutralizes a closing script tag so it can't terminate the surrounding <script>", () => {
		const result = toSafeScriptString("</script><script>alert(1)</script>");
		expect(result).not.toContain("</script>");
		expect(result).toContain("\\u003C/script>");
	});

	it("evaluates back to the original value when executed as JS", () => {
		const original = "some \"quoted\" 'value' with </script> and \\backslash\\";
		// biome-ignore lint/security/noGlobalEval: verifying round-trip safety of the escaping
		const evaluated = eval(toSafeScriptString(original));
		expect(evaluated).toBe(original);
	});

	it("defaults nullish values to an empty string literal", () => {
		expect(toSafeScriptString(undefined)).toBe('""');
		expect(toSafeScriptString(null)).toBe('""');
	});
});

describe("toSafeScriptJson", () => {
	it("serializes a plain object normally", () => {
		expect(toSafeScriptJson({ page: "home" })).toBe('{"page":"home"}');
	});

	it("neutralizes a closing script tag inside a value", () => {
		const result = toSafeScriptJson({
			page: "</script><script>alert(1)</script>",
		});
		expect(result).not.toContain("</script>");
	});

	it("round-trips back to the original object when parsed", () => {
		const original = { a: 1, b: "two", c: ["</script>", "d"] };
		expect(JSON.parse(toSafeScriptJson(original))).toEqual(original);
	});
});

describe("isValidJsIdentifier", () => {
	it("accepts a typical identifier", () => {
		expect(isValidJsIdentifier("dataLayer")).toBe(true);
	});

	it("accepts identifiers with underscores, dollar signs and digits", () => {
		expect(isValidJsIdentifier("_my$Layer2")).toBe(true);
	});

	it("rejects an empty string", () => {
		expect(isValidJsIdentifier("")).toBe(false);
	});

	it("rejects an identifier starting with a digit", () => {
		expect(isValidJsIdentifier("2dataLayer")).toBe(false);
	});

	it("rejects a value containing a semicolon (injection attempt)", () => {
		expect(isValidJsIdentifier("dataLayer;alert(1)")).toBe(false);
	});

	it("rejects a value containing spaces or dots", () => {
		expect(isValidJsIdentifier("data layer")).toBe(false);
		expect(isValidJsIdentifier("data.layer")).toBe(false);
	});
});
