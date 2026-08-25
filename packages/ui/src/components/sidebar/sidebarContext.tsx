import { createContext, type ReactNode, useContext, useMemo } from "react";

type SidebarContextProps = {
	collapsed: boolean;
	toggleCollapsed: () => void;
};

type SidebarProviderProps = {
	children: ReactNode;
	collapsed: boolean;
	toggleCollapsed: () => void;
};

const sidebarContext = createContext({} as SidebarContextProps);

function SidebarProvider(props: SidebarProviderProps) {
	const value = useMemo(
		() => ({
			collapsed: props.collapsed,
			toggleCollapsed: props.toggleCollapsed,
		}),
		[props.collapsed, props.toggleCollapsed],
	);

	return (
		<sidebarContext.Provider value={value}>
			{props.children}
		</sidebarContext.Provider>
	);
}

function useSidebar() {
	return useContext(sidebarContext);
}

export { SidebarProvider, useSidebar };
