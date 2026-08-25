import type { HTMLAttributes } from "react";

import "./styles.css";

type HeaderActionsProps = HTMLAttributes<HTMLDivElement>;

/**
 * HeaderActions, right-aligned slot for buttons inside a `HeaderRoot`.
 *
 * **...Other valid HTML `<div>` properties**
 *
 * @returns HeaderActions JSX element.
 *
 * @example
 * ```tsx
 * <HeaderActions>
 *   <Button variant="outline">Relatório</Button>
 *   <Button scheme="primary">+ Nova consulta</Button>
 * </HeaderActions>
 * ```
 */
function HeaderActions(props: HeaderActionsProps) {
	const { className: baseClassName, children, ...rest } = props;
	const className = `arkynHeaderActions ${baseClassName ?? ""}`.trim();

	return (
		<div className={className} {...rest}>
			{children}
		</div>
	);
}

export { HeaderActions };
