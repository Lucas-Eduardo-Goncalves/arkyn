import type { HTMLAttributes } from "react";

import "./styles.css";

type HeaderRootProps = HTMLAttributes<HTMLElement>;

/**
 * HeaderRoot, top bar of a page, typically holding `HeaderTitle` and `HeaderActions`.
 *
 * **...Other valid HTML `<header>` properties**
 *
 * @returns HeaderRoot JSX element.
 *
 * @example
 * ```tsx
 * <HeaderRoot>
 *   <HeaderTitle title="Consultas" breadcrumb={["Pacientes", "Francisco Dias"]} />
 *   <HeaderActions>
 *     <Button>Nova consulta</Button>
 *   </HeaderActions>
 * </HeaderRoot>
 * ```
 */
function HeaderRoot(props: HeaderRootProps) {
	const { className: baseClassName, children, ...rest } = props;
	const className = `arkynHeaderRoot ${baseClassName ?? ""}`.trim();

	return (
		<header className={className} {...rest}>
			{children}
		</header>
	);
}

export { HeaderRoot };
