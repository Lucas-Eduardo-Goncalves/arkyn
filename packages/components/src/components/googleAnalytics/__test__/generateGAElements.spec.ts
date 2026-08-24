import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateGAElements } from "../snippets/generateGAElements";

describe("generateGAElements", () => {
	// biome-ignore lint/suspicious/noExplicitAny: intentional
	let warnSpy: any;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it("builds the async script src and inline config script for a normal measurementId", () => {
		const { src, script } = generateGAElements({
			measurementId: "G-XXXXXXXXXX",
		});

		expect(src).toBe(
			"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX",
		);
		expect(script).toContain("gtag('config', \"G-XXXXXXXXXX\");");
	});

	it("warns and still returns elements for an empty measurementId", () => {
		const { script } = generateGAElements({ measurementId: "" });

		expect(warnSpy).toHaveBeenCalled();
		expect(script).toContain("gtag('config', \"\");");
	});

	it("safely escapes a measurementId containing quotes so it can't break out of the literal", () => {
		const malicious = '"); alert(1); //';
		const { script } = generateGAElements({ measurementId: malicious });

		expect(script).not.toContain(`gtag('config', '${malicious}');`);
		expect(script).toContain(JSON.stringify(malicious));
	});

	it("neutralizes an injection attempt with a closing script tag", () => {
		const malicious = "</script><script>alert('xss')</script>";
		const { script } = generateGAElements({ measurementId: malicious });

		expect(script).not.toContain("</script>");
	});

	it("URL-encodes special characters in the script src query param", () => {
		const { src } = generateGAElements({ measurementId: "G-1&evil=1" });

		expect(src).toBe(
			"https://www.googletagmanager.com/gtag/js?id=G-1%26evil%3D1",
		);
	});
});
