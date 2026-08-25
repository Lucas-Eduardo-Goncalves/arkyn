import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { HTMLAttributes } from "react";

import { useSidebar } from "../sidebarContext";
import "./styles.css";

type SidebarHeaderProps = HTMLAttributes<HTMLElement> & {
	/** Renders the collapse/expand toggle button. @default true */
	showToggleButton?: boolean;
};

/**
 * SidebarHeader, top slot of a `SidebarRoot` for branding and the collapse toggle.
 *
 * The toggle button calls `onToggleCollapsed` from the nearest `SidebarRoot`.
 * Must be rendered inside a `SidebarRoot`.
 *
 * @param props.showToggleButton - Renders the collapse/expand button. Default: true
 *
 * **...Other valid HTML `<header>` properties**
 *
 * @returns SidebarHeader JSX element.
 *
 * @example
 * ```tsx
 * <SidebarRoot collapsed={collapsed} onToggleCollapsed={toggle}>
 *   <SidebarHeader>
 *     <img src="/logo.svg" alt="Acme" />
 *   </SidebarHeader>
 * </SidebarRoot>
 * ```
 */
function SidebarHeader(props: SidebarHeaderProps) {
	const {
		showToggleButton = true,
		className: baseClassName,
		children,
		...rest
	} = props;

	const { collapsed, toggleCollapsed } = useSidebar();
	const className = `arkynSidebarHeader ${baseClassName ?? ""}`.trim();

	return (
		<header className={className} {...rest}>
			<div className="arkynSidebarHeaderBrand">{children}</div>

			{showToggleButton && (
				<button
					className="arkynSidebarHeaderToggleButton"
					type="button"
					onClick={toggleCollapsed}
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{collapsed ? (
						<PanelLeftOpen size={20} />
					) : (
						<PanelLeftClose size={20} />
					)}
				</button>
			)}
		</header>
	);
}

export { SidebarHeader };
