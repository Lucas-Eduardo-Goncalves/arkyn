import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlipPosition } from "../useFlipPosition";

function createContainerRef(
	rect: Partial<DOMRect>,
): RefObject<HTMLDivElement | null> {
	const element = document.createElement("div");
	const parent = document.createElement("div");
	parent.appendChild(element);

	parent.getBoundingClientRect = vi.fn(
		() =>
			({
				bottom: 0,
				top: 0,
				left: 0,
				right: 0,
				width: 0,
				height: 0,
				x: 0,
				y: 0,
				toJSON: () => {},
				...rect,
			}) as DOMRect,
	);

	return { current: element };
}

function setViewportHeight(height: number) {
	Object.defineProperty(window, "innerHeight", {
		configurable: true,
		writable: true,
		value: height,
	});
}

describe("useFlipPosition", () => {
	beforeEach(() => {
		setViewportHeight(768);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("stays 'bottom' by default when inactive", () => {
		const containerRef = createContainerRef({ top: 100, bottom: 150 });
		const { result } = renderHook(() =>
			useFlipPosition(containerRef, false, 300),
		);

		expect(result.current).toBe("bottom");
	});

	it("keeps 'bottom' when there is enough space below", () => {
		setViewportHeight(768);
		const containerRef = createContainerRef({ top: 100, bottom: 150 });

		const { result } = renderHook(() =>
			useFlipPosition(containerRef, true, 300),
		);

		expect(result.current).toBe("bottom");
	});

	it("flips to 'top' when space below is insufficient and space above is enough", () => {
		setViewportHeight(500);
		const containerRef = createContainerRef({ top: 400, bottom: 450 });

		const { result } = renderHook(() =>
			useFlipPosition(containerRef, true, 300),
		);

		expect(result.current).toBe("top");
	});

	it("stays 'bottom' when neither above nor below has enough room", () => {
		setViewportHeight(500);
		const containerRef = createContainerRef({ top: 200, bottom: 250 });

		const { result } = renderHook(() =>
			useFlipPosition(containerRef, true, 300),
		);

		expect(result.current).toBe("bottom");
	});

	it("recomputes when isActive transitions from false to true", () => {
		setViewportHeight(500);
		const containerRef = createContainerRef({ top: 400, bottom: 450 });

		const { result, rerender } = renderHook(
			({ isActive }) => useFlipPosition(containerRef, isActive, 300),
			{ initialProps: { isActive: false } },
		);

		expect(result.current).toBe("bottom");

		rerender({ isActive: true });

		expect(result.current).toBe("top");
	});

	it("re-flips in response to a resize event while active", () => {
		setViewportHeight(768);
		const containerRef = createContainerRef({ top: 400, bottom: 450 });

		const { result } = renderHook(() =>
			useFlipPosition(containerRef, true, 300),
		);

		expect(result.current).toBe("bottom");

		setViewportHeight(500);

		act(() => {
			window.dispatchEvent(new Event("resize"));
		});

		expect(result.current).toBe("top");
	});

	it("stops listening for resize once isActive becomes false", () => {
		setViewportHeight(768);
		const containerRef = createContainerRef({ top: 400, bottom: 450 });

		const { result, rerender } = renderHook(
			({ isActive }) => useFlipPosition(containerRef, isActive, 300),
			{ initialProps: { isActive: true } },
		);

		expect(result.current).toBe("bottom");

		rerender({ isActive: false });

		setViewportHeight(500);
		act(() => {
			window.dispatchEvent(new Event("resize"));
		});

		expect(result.current).toBe("bottom");
	});
});
