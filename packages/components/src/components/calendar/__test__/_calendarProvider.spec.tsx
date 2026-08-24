import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { memo, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CalendarProvider, useCalendar } from "../_calendarProvider";

// Wrapped in `memo` so a re-render only happens when its own props change or
// the consumed context value changes — exactly what proves (or disproves)
// that `CalendarProvider`'s context value stays referentially stable.
const Consumer = memo(function Consumer({
	renderCountRef,
}: {
	renderCountRef: { current: number };
}) {
	renderCountRef.current += 1;
	const calendar = useCalendar();

	return (
		<div>
			<span data-testid="month">{calendar.currentMonth}</span>
			<button type="button" onClick={() => calendar.nextMonth()}>
				next
			</button>
		</div>
	);
});

function Harness({ renderCountRef }: { renderCountRef: { current: number } }) {
	const [unrelated, setUnrelated] = useState(0);

	return (
		<div>
			<button type="button" onClick={() => setUnrelated((n) => n + 1)}>
				unrelated-{unrelated}
			</button>
			<CalendarProvider calendarType="single">
				<Consumer renderCountRef={renderCountRef} />
			</CalendarProvider>
		</div>
	);
}

describe("CalendarProvider (PERF-02)", () => {
	afterEach(() => {
		cleanup();
	});

	it("does not re-render context consumers when an unrelated ancestor state changes", async () => {
		const user = userEvent.setup();
		const renderCountRef = { current: 0 };

		render(<Harness renderCountRef={renderCountRef} />);
		expect(renderCountRef.current).toBe(1);

		await user.click(screen.getByText(/unrelated-/));
		await user.click(screen.getByText(/unrelated-/));

		// CalendarProvider re-renders (its parent did), but since none of the
		// values feeding its memoized context value changed, the consumer must
		// not re-render.
		expect(renderCountRef.current).toBe(1);
	});

	it("updates consumers when the calendar's own state actually changes", async () => {
		const user = userEvent.setup();
		const renderCountRef = { current: 0 };

		render(<Harness renderCountRef={renderCountRef} />);
		const monthBefore = screen.getByTestId("month").textContent;

		await user.click(screen.getByText("next"));

		expect(screen.getByTestId("month").textContent).not.toBe(monthBefore);
		expect(renderCountRef.current).toBe(2);
	});
});
