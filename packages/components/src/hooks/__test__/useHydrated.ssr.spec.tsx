// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useHydrated } from "../useHydrated";

function Probe() {
	return <>{useHydrated() ? "hydrated" : "server"}</>;
}

describe("useHydrated (SSR, node environment)", () => {
	it("should not throw when rendered on the server", () => {
		expect(() => renderToString(<Probe />)).not.toThrow();
	});

	it("should report false (not hydrated) when rendered via renderToString", () => {
		const html = renderToString(<Probe />);
		expect(html).toBe("server");
	});
});
