import type { HTMLAttributes, ReactNode } from "react";

import "./styles.css";

type AdminLayoutRootProps = HTMLAttributes<HTMLDivElement> & {
	/** The `SidebarRoot` tree rendered in the fixed left rail. Required. */
	sidebar: ReactNode;
};

/**
 * AdminLayoutRoot, page shell that positions a `SidebarRoot` beside the page content.
 *
 * Pairs with `AdminLayoutContent`, which should wrap a `HeaderRoot` plus the page's own markup.
 * This is a thin composition convenience, use `SidebarRoot`/`HeaderRoot` directly instead if you
 * need a different arrangement.
 *
 * @param props.sidebar - The `SidebarRoot` tree rendered in the fixed left rail. Required.
 *
 * **...Other valid HTML `<div>` properties**
 *
 * @returns AdminLayoutRoot JSX element.
 *
 * @example
 * ```tsx
 * <AdminLayoutRoot
 *   sidebar={
 *     <SidebarRoot collapsed={collapsed} onToggleCollapsed={toggle}>
 *       <SidebarHeader>Acme Admin</SidebarHeader>
 *       <SidebarGroup label="Cadastros">
 *         <SidebarLink href="/patients" icon={Users} label="Pacientes" active />
 *       </SidebarGroup>
 *     </SidebarRoot>
 *   }
 * >
 *   <AdminLayoutContent>
 *     <HeaderRoot>
 *       <HeaderTitle title="Pacientes" />
 *     </HeaderRoot>
 *     <PageContent />
 *   </AdminLayoutContent>
 * </AdminLayoutRoot>
 * ```
 */
function AdminLayoutRoot(props: AdminLayoutRootProps) {
	const { sidebar, className: baseClassName, children, ...rest } = props;
	const className = `arkynAdminLayoutRoot ${baseClassName ?? ""}`.trim();

	return (
		<div className={className} {...rest}>
			{sidebar}
			{children}
		</div>
	);
}

export { AdminLayoutRoot };
