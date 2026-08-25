# @arkyn/ui — agent guide

Pre-built sidebar, header, and admin-layout shell components for React admin panels and CRUD dashboards. Use it instead of hand-rolling a navigation rail and page header for every new admin screen. Every prop, default, and behavior note below was read directly from source.

## Required setup

- ESM only: `import`, never `require()`.
- Always-required peer deps: `react`, `react-dom`, `lucide-react`.

## Import convention — always prefer subpath imports

```tsx
import { SidebarRoot } from "@arkyn/ui/sidebarRoot";
import "@arkyn/ui/sidebarRoot.css";
```

**Naming rule**: the subpath is the export name with only its first letter lowercased. `SidebarRoot` → `sidebarRoot`, `HeaderTitle` → `headerTitle`. Every component ships a matching `.css` subpath. Importing the aggregate stylesheet once (`import "@arkyn/ui/styles"`) instead of per-component CSS is simpler when using most of the package.

## Sidebar — `SidebarRoot` / `SidebarHeader` / `SidebarGroup` / `SidebarLink` / `SidebarFooter`

Controlled navigation rail. `SidebarRoot` owns no state itself, the caller tracks `collapsed` and passes `onToggleCollapsed` (same controlled pattern as `@arkyn/components`'s `DrawerContainer`). `SidebarHeader`, `SidebarGroup`, and `SidebarLink` read the collapsed state from `SidebarRoot`'s context internally, no prop drilling needed.

- `SidebarRoot` — `{ collapsed?: boolean; onToggleCollapsed?: () => void }`, renders `<aside>`.
- `SidebarHeader` — `{ showToggleButton?: boolean }` (default `true`), renders the brand slot (`children`) plus a collapse/expand button that calls `onToggleCollapsed`.
- `SidebarGroup` — `{ label?: string }`, labeled section wrapping `SidebarLink`s; label hides when collapsed.
- `SidebarLink` — `{ icon: LucideIcon; label: string; active?: boolean }` + all `<a>` props (pass `href`). Router-agnostic: renders a plain `<a>`, resolve `href` and `active` yourself.
- `SidebarFooter` — plain slot, typically a user menu or workspace switcher.

```tsx
const [collapsed, setCollapsed] = useState(false);

<SidebarRoot collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)}>
  <SidebarHeader>Acme Admin</SidebarHeader>
  <SidebarGroup label="Cadastros">
    <SidebarLink href="/patients" icon={Users} label="Pacientes" active={pathname === "/patients"} />
  </SidebarGroup>
  <SidebarFooter>Francisco Dias</SidebarFooter>
</SidebarRoot>
```

## Header — `HeaderRoot` / `HeaderTitle` / `HeaderActions` / `HeaderUser`

Stateless page header, no context, each component just renders its slot.

- `HeaderRoot` — flex container, holds `HeaderTitle` and `HeaderActions`.
- `HeaderTitle` — `{ title: string; breadcrumb?: string[] }`.
- `HeaderActions` — right-aligned slot for buttons.
- `HeaderUser` — `{ name: string; avatarUrl?: string }` + all `<button>` props, renders as a `<button>` so `onClick` can open a dropdown you build separately.

```tsx
<HeaderRoot>
  <HeaderTitle title="Consultas" breadcrumb={["Pacientes", "Francisco Dias"]} />
  <HeaderActions>
    <HeaderUser name="Francisco Dias" avatarUrl={user.avatarUrl} onClick={openUserMenu} />
  </HeaderActions>
</HeaderRoot>
```

## AdminLayout — `AdminLayoutRoot` / `AdminLayoutContent`

Thin composition convenience over `SidebarRoot` + the page's own markup, use `SidebarRoot`/`HeaderRoot` directly instead if a different arrangement is needed.

- `AdminLayoutRoot` — `{ sidebar: ReactNode }`, renders `sidebar` beside `children`.
- `AdminLayoutContent` — scrollable main column, meant to wrap a `HeaderRoot` plus the page content.

```tsx
<AdminLayoutRoot sidebar={<SidebarRoot collapsed={collapsed} onToggleCollapsed={toggle}>...</SidebarRoot>}>
  <AdminLayoutContent>
    <HeaderRoot>
      <HeaderTitle title="Pacientes" />
    </HeaderRoot>
    <PageContent />
  </AdminLayoutContent>
</AdminLayoutRoot>
```

## Related packages

- `@arkyn/components` — use its `Button`, `Badge`, `Input`, etc. inside `HeaderActions`/`SidebarFooter`/page content; `@arkyn/ui` only supplies the shell.
