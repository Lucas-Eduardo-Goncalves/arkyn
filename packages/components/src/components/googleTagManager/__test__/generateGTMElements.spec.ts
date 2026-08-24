import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateGTMElements } from "../snippets/generateGTMElements";

const baseProps = {
	id: "GTM-XXXXXXX",
	events: { event: "gtm.js" },
	dataLayer: { page: "home" },
	dataLayerName: "dataLayer",
	preview: "",
	auth: "",
};

describe("generateGTMElements", () => {
	// biome-ignore lint/suspicious/noExplicitAny: intentional
	let warnSpy: any;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it("builds the iframe, script and dataLayerVar for normal values", () => {
		const { iframe, script, dataLayerVar } = generateGTMElements(baseProps);

		expect(iframe).toContain(
			'src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX&gtm_auth=&gtm_preview=&gtm_cookies_win=x"',
		);
		expect(script).toContain('\'script\',"dataLayer","GTM-XXXXXXX"');
		expect(dataLayerVar).toContain("window.dataLayer");
	});

	it("warns when id is empty", () => {
		generateGTMElements({ ...baseProps, id: "" });

		expect(warnSpy).toHaveBeenCalled();
	});

	it("URL-encodes special characters in id/auth/preview used in the iframe src", () => {
		const { iframe } = generateGTMElements({
			...baseProps,
			id: 'GTM-"><script>alert(1)</script>',
			auth: "a&b",
			preview: "p'q",
		});

		expect(iframe).not.toContain("<script>alert(1)</script>");
		expect(iframe).toContain("gtm_auth=a%26b");
		expect(iframe).toContain("gtm_preview=p%27q");
	});

	it("safely escapes an id containing quotes so it can't break out of the script string literal", () => {
		const malicious = '","script","dataLayer",document.write("hacked")';
		const { script } = generateGTMElements({ ...baseProps, id: malicious });

		expect(script).not.toContain(`,'${malicious}');`);
	});

	it("falls back to the default dataLayer name for an invalid identifier", () => {
		const { script, dataLayerVar } = generateGTMElements({
			...baseProps,
			dataLayerName: "dl;alert(1)",
		});

		expect(script).toContain('"dataLayer"');
		expect(dataLayerVar).toContain("window.dataLayer");
		expect(dataLayerVar).not.toContain("dl;alert(1)");
	});

	it("neutralizes a closing script tag inside events", () => {
		const { script } = generateGTMElements({
			...baseProps,
			events: { evil: "</script><script>alert(1)</script>" },
		});

		expect(script).not.toContain("</script><script>alert(1)</script>");
	});
});
