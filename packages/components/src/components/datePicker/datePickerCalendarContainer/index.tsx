import { type ReactNode, useRef } from "react";

import { useFlipPosition } from "../../../hooks/useFlipPosition";
import { useScrollLock } from "../../../hooks/useScrollLock";

import "./styles.css";

type DatePickerCalendarContainerProps = {
	id?: string;
	isFocused: boolean;
	children: ReactNode;
};

function DatePickerCalendarContainer(props: DatePickerCalendarContainerProps) {
	const { children, id, isFocused } = props;

	const containerRef = useRef<HTMLDivElement>(null);
	const position = useFlipPosition(containerRef, isFocused, 420);

	useScrollLock(isFocused);

	if (!isFocused) return null;

	return (
		<div
			ref={containerRef}
			id={id}
			role="dialog"
			aria-modal="false"
			className={`arkynDatePickerCalendarContainer ${position}`}
		>
			{children}
		</div>
	);
}

export { DatePickerCalendarContainer };
