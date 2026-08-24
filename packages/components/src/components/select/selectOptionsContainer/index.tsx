import { Search } from "lucide-react";
import { type ChangeEvent, type ReactNode, useRef } from "react";

import { useFlipPosition } from "../../../hooks/useFlipPosition";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { Input } from "../../input";

import "./styles.css";

type SelectOptionsContainerProps = {
	id?: string;
	isFocused: boolean;
	isSearchable: boolean;
	children: ReactNode;
	search: string;
	onSearch: (value: string) => void;
};

function SelectOptionsContainer(props: SelectOptionsContainerProps) {
	const { children, id, isFocused, isSearchable, search, onSearch } = props;

	const containerRef = useRef<HTMLDivElement>(null);
	const position = useFlipPosition(containerRef, isFocused, 300);

	useScrollLock(isFocused);

	function handleSearch(e: ChangeEvent<HTMLInputElement>) {
		if (!isSearchable) return;
		onSearch(e.target.value);
	}

	if (!isFocused) return null;

	return (
		<div
			ref={containerRef}
			id={id}
			role="listbox"
			className={`arkynSelectOptionsContainer ${position}`}
		>
			{isSearchable && (
				<Input
					type="search"
					name="search-select"
					variant="underline"
					leftIcon={Search}
					value={search}
					onChange={handleSearch}
				/>
			)}

			{children}
		</div>
	);
}

export { SelectOptionsContainer };
