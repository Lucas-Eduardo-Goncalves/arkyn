import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendToDataLayer } from "../snippets/appendToDataLayer";

describe("appendToDataLayer", () => {
	// biome-ignore lint/suspicious/noExplicitAny: intentional
	let warnSpy: any;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it("builds the push script for a normal dataLayerName", () => {
		const script = appendToDataLayer({
			dataLayer: { page: "home" },
			dataLayerName: "dataLayer",
		});

		expect(script).toContain("window.dataLayer = window.dataLayer || [];");
		expect(script).toContain('window.dataLayer.push({"page":"home"})');
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("keeps a valid custom dataLayerName", () => {
		const script = appendToDataLayer({
			dataLayer: {},
			dataLayerName: "myCustomLayer",
		});

		expect(script).toContain("window.myCustomLayer");
	});

	it("falls back to the default dataLayer name for an injection attempt", () => {
		const malicious = "dataLayer;alert(1)//";
		const script = appendToDataLayer({
			dataLayer: {},
			dataLayerName: malicious,
		});

		expect(script).not.toContain(malicious);
		expect(script).toContain("window.dataLayer");
		expect(warnSpy).toHaveBeenCalled();
	});

	it("escapes a closing script tag inside the dataLayer values", () => {
		const script = appendToDataLayer({
			dataLayer: { page: "</script><script>alert(1)</script>" },
			dataLayerName: "dataLayer",
		});

		expect(script).not.toContain("</script>");
	});

	it("preserves normal nested data untouched", () => {
		const dataLayer = { user: { id: 1, plan: "pro" } };
		const script = appendToDataLayer({ dataLayer, dataLayerName: "dataLayer" });

		expect(script).toContain(JSON.stringify(dataLayer));
	});
});
