import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { type CalendarMatrix, ViewService } from "./_viewService";

type CalendarContextProps = {
	valueDate: Date[];
	viewDate: Date;
	currentDate: string;
	currentDay: string;
	currentMonth: string;
	currentYear: string;
	listWeek: string[];
	listMonths: { label: string; value: string }[];
	listYears: { label: string; value: string }[];
	listMatrix: CalendarMatrix;
	changeDay: (day: number, month: number, year: number) => void;
	changeMonth: (month: number) => void;
	changeYear: (year: number) => void;
	nextMonth: () => void;
	previousMonth: () => void;
};

type SingleCalendarProviderProps = {
	children: ReactNode;
	calendarType: "single";
	language?: string;
	onChangeView?: (date: Date) => void;
	defaultValue?: Date;
	onChange?: (date: Date) => void;
	value?: Date;
	viewValue?: Date;
	defaultViewValue?: Date;
};

type RangeCalendarProviderProps = {
	children: ReactNode;
	calendarType: "range";
	language?: string;
	onChangeView?: (date: Date) => void;
	defaultValue?: [Date, Date];
	onChange?: (date: [Date, Date]) => void;
	value?: [Date, Date];
	viewValue?: Date;
	defaultViewValue?: Date;
};

type CalendarProviderProps =
	| SingleCalendarProviderProps
	| RangeCalendarProviderProps;

const CalendarContext = createContext({} as CalendarContextProps);

function useCalendar() {
	return useContext(CalendarContext);
}

// Stateless — safe to share a single instance instead of instantiating on every render.
const viewService = new ViewService();

function CalendarProvider(props: CalendarProviderProps) {
	const {
		calendarType,
		children,
		defaultValue: rawDefaultValue,
		defaultViewValue = new Date(),
		language = "pt-BR",
		onChange,
		onChangeView,
		value,
		viewValue,
	} = props;

	const defaultValue: [Date, Date] =
		calendarType === "single"
			? [rawDefaultValue || new Date(), rawDefaultValue || new Date()]
			: rawDefaultValue || [new Date(), new Date()];

	const [rawViewDate, rawSetViewDate] = useState(defaultViewValue);
	const [rawValueDate, rawSetValueDate] = useState<[Date, Date]>(defaultValue);

	const viewDate = viewValue || rawViewDate;
	const valueDate: [Date, Date] = value
		? calendarType === "single"
			? [value, value]
			: value
		: rawValueDate;

	const setValueDate = useCallback(
		(newValue: [Date, Date]) => {
			const normalizedValue: [Date, Date] = [
				new Date(newValue[0]),
				new Date(newValue[1]),
			];

			if (onChange && calendarType === "range") {
				onChange(normalizedValue);
			}

			if (onChange && calendarType === "single") {
				onChange(normalizedValue[0]);
			}

			rawSetValueDate(normalizedValue);
		},
		[calendarType, onChange],
	);

	const setViewDate = useCallback(
		(date: Date) => {
			if (onChangeView) onChangeView(date);
			rawSetViewDate(date);
		},
		[onChangeView],
	);

	const changeDay = useCallback(
		(day: number, month: number, year: number) =>
			viewService.changeDay(
				day,
				month,
				year,
				calendarType,
				valueDate,
				setValueDate,
				setViewDate,
			),
		[calendarType, valueDate, setValueDate, setViewDate],
	);

	const changeMonth = useCallback(
		(month: number) => viewService.changeMonth(month, viewDate, setViewDate),
		[viewDate, setViewDate],
	);

	const changeYear = useCallback(
		(year: number) => viewService.changeYear(year, viewDate, setViewDate),
		[viewDate, setViewDate],
	);

	const nextMonth = useCallback(
		() => viewService.nextMonth(viewDate, setViewDate),
		[viewDate, setViewDate],
	);

	const previousMonth = useCallback(
		() => viewService.previousMonth(viewDate, setViewDate),
		[viewDate, setViewDate],
	);

	const contextValue = useMemo<CalendarContextProps>(
		() => ({
			valueDate,
			viewDate,
			currentDate: viewDate.toLocaleDateString(language).slice(3),
			currentDay: viewService.currentDay(viewDate),
			currentMonth: viewService.currentMonth(viewDate),
			currentYear: viewService.currentYear(viewDate),
			listWeek: viewService.listWeek(language),
			listMonths: viewService.listMonths(viewDate, language),
			listYears: viewService.listYears(100),
			listMatrix: viewService.listMatrix(viewDate, valueDate),
			changeDay,
			changeMonth,
			changeYear,
			nextMonth,
			previousMonth,
		}),
		[
			valueDate,
			viewDate,
			language,
			changeDay,
			changeMonth,
			changeYear,
			nextMonth,
			previousMonth,
		],
	);

	return (
		<CalendarContext.Provider value={contextValue}>
			{children}
		</CalendarContext.Provider>
	);
}

export { CalendarProvider, useCalendar };
