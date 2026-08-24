// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GoogleTagManager } from "../googleTagManager";

// Mirrors the mock in googleTagManager.spec.tsx: isolates the SSR-safety of
// the non-`.client` wrapper (and its ClientOnly gating) from the actual
// script/noscript injection logic in GoogleTagManagerClient.
const googleTagManagerClientMock = vi.fn();

vi.mock("../googleTagManager/googleTagManager.client", () => ({
	GoogleTagManagerClient: (props: Record<string, unknown>) => {
		googleTagManagerClientMock(props);
		return <div data-testid="google-tag-manager-client" />;
	},
}));

describe("GoogleTagManager (SSR, node environment)", () => {
	it("should not throw when rendered on the server in dev mode (early-return-null branch)", () => {
		expect(() =>
			renderToString(<GoogleTagManager gtmId="GTM-XXXXXXX" />),
		).not.toThrow();
	});

	it("should render nothing on the server in dev mode without showInDevMode", () => {
		const html = renderToString(<GoogleTagManager gtmId="GTM-XXXXXXX" />);

		expect(html).toBe("");
		expect(googleTagManagerClientMock).not.toHaveBeenCalled();
	});

	it("should not throw when rendered on the server with showInDevMode (exercises the ClientOnly branch)", () => {
		expect(() =>
			renderToString(<GoogleTagManager gtmId="GTM-XXXXXXX" showInDevMode />),
		).not.toThrow();
	});

	it("should render the ClientOnly SSR fallback (nothing), never GoogleTagManagerClient, when showInDevMode reaches ClientOnly", () => {
		const html = renderToString(
			<GoogleTagManager gtmId="GTM-XXXXXXX" showInDevMode />,
		);

		expect(html).toBe("");
		expect(googleTagManagerClientMock).not.toHaveBeenCalled();
	});
});
