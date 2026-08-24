// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FacebookPixel } from "../facebookPixel";

// Mirrors the mock in facebookPixel.spec.tsx: isolates the SSR-safety of
// the non-`.client` wrapper (and its ClientOnly gating) from the actual
// fbq script-injection logic in FacebookPixelClient.
const facebookPixelClientMock = vi.fn();

vi.mock("../facebookPixel/facebookPixel.client", () => ({
	FacebookPixelClient: (props: Record<string, unknown>) => {
		facebookPixelClientMock(props);
		return <div data-testid="facebook-pixel-client" />;
	},
}));

describe("FacebookPixel (SSR, node environment)", () => {
	it("should not throw when rendered on the server in dev mode (early-return-null branch)", () => {
		expect(() =>
			renderToString(<FacebookPixel pixelId="123456789012345" />),
		).not.toThrow();
	});

	it("should render nothing on the server in dev mode without showInDevMode", () => {
		const html = renderToString(<FacebookPixel pixelId="123456789012345" />);

		expect(html).toBe("");
		expect(facebookPixelClientMock).not.toHaveBeenCalled();
	});

	it("should not throw when rendered on the server with showInDevMode (exercises the ClientOnly branch)", () => {
		expect(() =>
			renderToString(<FacebookPixel pixelId="123456789012345" showInDevMode />),
		).not.toThrow();
	});

	it("should render the ClientOnly SSR fallback (nothing), never FacebookPixelClient, when showInDevMode reaches ClientOnly", () => {
		const html = renderToString(
			<FacebookPixel pixelId="123456789012345" showInDevMode />,
		);

		expect(html).toBe("");
		expect(facebookPixelClientMock).not.toHaveBeenCalled();
	});
});
