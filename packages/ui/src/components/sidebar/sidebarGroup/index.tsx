import type { HTMLAttributes } from "react";

import { useSidebar } from "../sidebarContext";
import "./styles.css";

type SidebarGroupProps = HTMLAttributes<HTMLElement> & {
	/** Section heading rendered above the group's links. Hidden while the sidebar is collapsed. */
	label?: string;
};

/**
 * SidebarGroup, labeled section of navigation links inside a `SidebarRoot`.
 *
 * @param props.label - Section heading, e.g. "Cadastros". Hidden when the sidebar is collapsed.
 *
 * **...Other valid HTML `<nav>` properties**
 *
 * @returns SidebarGroup JSX element.
 *
 * @example
 * ```tsx
 * <SidebarGroup label="Cadastros">
 *   <SidebarLink href="/patients" icon={Users} label="Pacientes" />
 *   <SidebarLink href="/professionals" icon={Stethoscope} label="Profissionais" />
 * </SidebarGroup>
 * ```
 */
function SidebarGroup(props: SidebarGroupProps) {
	const { label, className: baseClassName, children, ...rest } = props;
	const { collapsed } = useSidebar();

	const className = `arkynSidebarGroup ${baseClassName ?? ""}`.trim();

	return (
		<nav className={className} {...rest}>
			{label && !collapsed && (
				<span className="arkynSidebarGroupLabel">{label}</span>
			)}
			{children}
		</nav>
	);
}

export { SidebarGroup };
