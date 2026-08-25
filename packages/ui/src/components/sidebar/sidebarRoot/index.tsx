import type { HTMLAttributes } from "react";

import { SidebarProvider } from "../sidebarContext";
import "./styles.css";

type SidebarRootProps = HTMLAttributes<HTMLElement> & {
	/** Renders the icon-only, narrow state. @default false */
	collapsed?: boolean;
	/** Called when a nested control (e.g. `SidebarHeader`'s toggle button) requests a collapse/expand. */
	onToggleCollapsed?: () => void;
};

/**
 * SidebarRoot, fixed navigation rail for admin/CRUD layouts.
 *
 * Renders an `<aside>` and provides the collapsed state to `SidebarHeader`, `SidebarGroup`,
 * and `SidebarLink` through context, so nested components can react to it without prop drilling.
 * Controlled from the outside, same pattern as `DrawerContainer`'s `isVisible`/`makeInvisible`.
 *
 * @param props.collapsed - Renders the icon-only, narrow state. Default: false
 * @param props.onToggleCollapsed - Called when a nested toggle control is activated.
 *
 * **...Other valid HTML `<aside>` properties**
 *
 * @returns SidebarRoot JSX element.
 *
 * @example
 * ```tsx
 * const [collapsed, setCollapsed] = useState(false);
 *
 * <SidebarRoot collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)}>
 *   <SidebarHeader>Acme Admin</SidebarHeader>
 *   <SidebarGroup label="Cadastros">
 *     <SidebarLink href="/patients" icon={Users} label="Pacientes" active />
 *   </SidebarGroup>
 *   <SidebarFooter>Francisco Dias</SidebarFooter>
 * </SidebarRoot>
 * ```
 */
function SidebarRoot(props: SidebarRootProps) {
	const {
		collapsed = false,
		onToggleCollapsed = () => {},
		className: baseClassName,
		children,
		...rest
	} = props;

	const className = [
		"arkynSidebarRoot",
		collapsed ? "collapsed" : "",
		baseClassName,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<SidebarProvider collapsed={collapsed} toggleCollapsed={onToggleCollapsed}>
			<aside className={className} {...rest}>
				{children}
			</aside>
		</SidebarProvider>
	);
}

export { SidebarRoot };
