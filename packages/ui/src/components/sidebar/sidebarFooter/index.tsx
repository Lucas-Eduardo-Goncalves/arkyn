import type { HTMLAttributes } from "react";

import "./styles.css";

type SidebarFooterProps = HTMLAttributes<HTMLElement>;

/**
 * SidebarFooter, bottom slot of a `SidebarRoot`, typically a user menu or workspace switcher.
 *
 * **...Other valid HTML `<footer>` properties**
 *
 * @returns SidebarFooter JSX element.
 *
 * @example
 * ```tsx
 * <SidebarFooter>
 *   <img src={user.avatarUrl} alt="" />
 *   <span>{user.name}</span>
 * </SidebarFooter>
 * ```
 */
function SidebarFooter(props: SidebarFooterProps) {
	const { className: baseClassName, children, ...rest } = props;
	const className = `arkynSidebarFooter ${baseClassName ?? ""}`.trim();

	return (
		<footer className={className} {...rest}>
			{children}
		</footer>
	);
}

export { SidebarFooter };
