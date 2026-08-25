import type { LucideIcon } from "lucide-react";
import type { AnchorHTMLAttributes } from "react";

import { useSidebar } from "../sidebarContext";
import "./styles.css";

type SidebarLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	/** Lucide icon rendered before the label. Required. */
	icon: LucideIcon;
	/** Link text. Hidden (icon-only, exposed as a `title` tooltip) while the sidebar is collapsed. */
	label: string;
	/** Marks this link as the current page. @default false */
	active?: boolean;
};

/**
 * SidebarLink, a single navigation item inside a `SidebarGroup`.
 *
 * Renders as a plain `<a>` so it works with any router, pass your router's resolved `href` and
 * control `active` yourself (e.g. by comparing against the current pathname).
 *
 * @param props.icon - Lucide icon component rendered before the label. Required.
 * @param props.label - Link text. Required.
 * @param props.active - Highlights the link as the current page. Default: false
 *
 * **...Other valid HTML `<a>` properties**
 *
 * @returns SidebarLink JSX element.
 *
 * @example
 * ```tsx
 * <SidebarLink href="/patients" icon={Users} label="Pacientes" active={pathname === "/patients"} />
 * ```
 */
function SidebarLink(props: SidebarLinkProps) {
	const {
		icon: Icon,
		label,
		active = false,
		className: baseClassName,
		...rest
	} = props;

	const { collapsed } = useSidebar();

	const className = ["arkynSidebarLink", active ? "active" : "", baseClassName]
		.filter(Boolean)
		.join(" ");

	return (
		<a className={className} title={collapsed ? label : undefined} {...rest}>
			<Icon size={20} />
			{!collapsed && <span className="arkynSidebarLinkLabel">{label}</span>}
		</a>
	);
}

export { SidebarLink };
