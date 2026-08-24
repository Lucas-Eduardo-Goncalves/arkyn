// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GoogleAnalytics } from "../googleAnalytics";

// Mirrors the mock in googleAnalytics.spec.tsx: isolates the SSR-safety of
// the non-`.client` wrapper (and its ClientOnly gating) from the actual
// gtag script-injection logic in GoogleAnalyticsClient.
const googleAnalyticsClientMock = vi.fn(
	(_props: { measurementId: string }) => null,
);

vi.mock("../googleAnalytics/googleAnalytics.client", () => ({
	GoogleAnalyticsClient: (props: { measurementId: string }) =>
		googleAnalyticsClientMock(props),
}));

describe("GoogleAnalytics (SSR, node environment)", () => {
	it("should not throw when rendered on the server in dev mode (early-return-null branch)", () => {
		expect(() =>
			renderToString(<GoogleAnalytics measurementId="G-XXXXXXXXXX" />),
		).not.toThrow();
	});

	it("should render nothing on the server in dev mode without showInDevMode", () => {
		const html = renderToString(
			<GoogleAnalytics measurementId="G-XXXXXXXXXX" />,
		);

		expect(html).toBe("");
		expect(googleAnalyticsClientMock).not.toHaveBeenCalled();
	});

	it("should not throw when rendered on the server with showInDevMode (exercises the ClientOnly branch)", () => {
		expect(() =>
			renderToString(
				<GoogleAnalytics measurementId="G-XXXXXXXXXX" showInDevMode />,
			),
		).not.toThrow();
	});

	it("should render the ClientOnly SSR fallback (nothing), never GoogleAnalyticsClient, when showInDevMode reaches ClientOnly", () => {
		const html = renderToString(
			<GoogleAnalytics measurementId="G-XXXXXXXXXX" showInDevMode />,
		);

		expect(html).toBe("");
		expect(googleAnalyticsClientMock).not.toHaveBeenCalled();
	});
});
