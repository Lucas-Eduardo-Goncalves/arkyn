import type { HTMLAttributes } from "react";

import "./styles.css";

type AdminLayoutContentProps = HTMLAttributes<HTMLDivElement>;

/**
 * AdminLayoutContent, scrollable main column of an `AdminLayoutRoot`.
 *
 * Typically wraps a `HeaderRoot` plus the page's own content.
 *
 * **...Other valid HTML `<div>` properties**
 *
 * @returns AdminLayoutContent JSX element.
 *
 * @example
 * ```tsx
 * <AdminLayoutContent>
 *   <HeaderRoot>
 *     <HeaderTitle title="Pacientes" />
 *   </HeaderRoot>
 *   <PageContent />
 * </AdminLayoutContent>
 * ```
 */
function AdminLayoutContent(props: AdminLayoutContentProps) {
	const { className: baseClassName, children, ...rest } = props;
	const className = `arkynAdminLayoutContent ${baseClassName ?? ""}`.trim();

	return (
		<div className={className} {...rest}>
			{children}
		</div>
	);
}

export { AdminLayoutContent };
