// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClientOnly } from "../clientOnly";

describe("ClientOnly (SSR, node environment)", () => {
	it("should not throw when rendered on the server", () => {
		expect(() =>
			renderToString(
				<ClientOnly>{() => <div>client content</div>}</ClientOnly>,
			),
		).not.toThrow();
	});

	it("should render the fallback, not children(), during server rendering", () => {
		const html = renderToString(
			<ClientOnly fallback={<span>fallback content</span>}>
				{() => <div>client content</div>}
			</ClientOnly>,
		);

		expect(html).toBe("<span>fallback content</span>");
		expect(html).not.toContain("client content");
	});

	it("should render nothing when no fallback is provided during server rendering", () => {
		const html = renderToString(
			<ClientOnly>{() => <div>client content</div>}</ClientOnly>,
		);

		expect(html).toBe("");
	});

	it("should never invoke the children render function during server rendering", () => {
		const children = vi.fn(() => <div>client content</div>);

		renderToString(<ClientOnly fallback={null}>{children}</ClientOnly>);

		expect(children).not.toHaveBeenCalled();
	});

	it("should not access window or document while rendering on the server", () => {
		expect(typeof window).toBe("undefined");
		expect(typeof document).toBe("undefined");

		expect(() =>
			renderToString(
				<ClientOnly>{() => <div>client content</div>}</ClientOnly>,
			),
		).not.toThrow();
	});
});
