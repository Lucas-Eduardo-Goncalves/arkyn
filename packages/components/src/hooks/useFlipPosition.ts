import { type RefObject, useEffect, useState } from "react";

type FlipPosition = "bottom" | "top";

/**
 * useFlipPosition, computes whether a floating panel should render `"bottom"`
 * or `"top"` relative to its anchor, flipping to `"top"` when there isn't
 * enough viewport space below it.
 *
 * The anchor used for the calculation is `containerRef.current.parentElement`,
 * matching how `SelectOptionsContainer`, `MultiSelectOptionsContainer`, and
 * `DatePickerCalendarContainer` render their floating panel as a sibling
 * positioned relative to that parent.
 *
 * Recomputes when `isActive` becomes `true`, and again on every `resize`
 * event while `isActive` stays `true`, so the position stays correct if the
 * viewport is resized while the panel is open.
 *
 * Only positioning is handled here — no selection, focus, or keyboard logic.
 *
 * @param containerRef - Ref to the floating panel element (its `parentElement` is used as the anchor).
 * @param isActive - When `true`, the position is computed and kept up to date.
 * @param estimatedContainerHeight - Estimated height (px) of the floating panel, used to decide if it fits below the anchor.
 * @returns `"bottom"` or `"top"`.
 *
 * @example
 * ```tsx
 * function CustomFloatingPanel({ isOpen }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const position = useFlipPosition(containerRef, isOpen, 300);
 *   return isOpen ? (
 *     <div ref={containerRef} className={`panel ${position}`} />
 *   ) : null;
 * }
 * ```
 */

function useFlipPosition(
	containerRef: RefObject<HTMLElement | null>,
	isActive: boolean,
	estimatedContainerHeight: number,
): FlipPosition {
	const [position, setPosition] = useState<FlipPosition>("bottom");

	useEffect(() => {
		if (!isActive) return;

		function checkContainerPosition() {
			if (!containerRef.current) return;

			const parentElement = containerRef.current.parentElement;
			if (!parentElement) return;

			const parentRect = parentElement.getBoundingClientRect();
			const viewportHeight = window.innerHeight;

			const spaceBelow = viewportHeight - parentRect.bottom;

			if (
				spaceBelow < estimatedContainerHeight &&
				parentRect.top > estimatedContainerHeight
			) {
				setPosition("top");
			} else {
				setPosition("bottom");
			}
		}

		checkContainerPosition();

		window.addEventListener("resize", checkContainerPosition);

		return () => {
			window.removeEventListener("resize", checkContainerPosition);
		};
	}, [containerRef, isActive, estimatedContainerHeight]);

	return position;
}

export type { FlipPosition };
export { useFlipPosition };
