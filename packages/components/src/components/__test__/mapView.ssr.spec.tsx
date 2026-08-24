// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MapView } from "../mapView";

// Mirrors the mock in mapView.spec.tsx: isolates the SSR-safety of the
// non-`.client` MapView wrapper from mapbox-gl internals, which are
// browser-only and would blow up merely by being imported under node.
const clientMapViewMock = vi.fn();

vi.mock("../mapView/mapView.client", () => ({
	ClientMapView: (props: Record<string, unknown>) => {
		clientMapViewMock(props);
		return <div data-testid="client-map-view" />;
	},
}));

describe("MapView (SSR, node environment)", () => {
	it("should not throw when rendered on the server without coordinates", () => {
		expect(() =>
			renderToString(<MapView accessToken="pk.token" />),
		).not.toThrow();
	});

	it("should not throw when rendered on the server with coordinates", () => {
		expect(() =>
			renderToString(
				<MapView
					accessToken="pk.token"
					coordinates={{ lat: -23.55, lng: -46.63 }}
				/>,
			),
		).not.toThrow();
	});

	it("should render the EmptyMap placeholder (ClientOnly fallback), not ClientMapView, when coordinates are provided", () => {
		const html = renderToString(
			<MapView
				accessToken="pk.token"
				coordinates={{ lat: -23.55, lng: -46.63 }}
			/>,
		);

		expect(html).toContain("arkynMapViewPinnedEmpty");
		expect(html).not.toContain("client-map-view");
		expect(clientMapViewMock).not.toHaveBeenCalled();
	});

	it("should render the EmptyMap placeholder when coordinates are omitted", () => {
		const html = renderToString(<MapView accessToken="pk.token" />);

		expect(html).toContain("arkynMapViewPinnedEmpty");
	});
});
