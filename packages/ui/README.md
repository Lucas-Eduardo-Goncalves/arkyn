# @arkyn/ui

Pre-built sidebar, header, and admin-layout shell components for React admin panels and CRUD dashboards.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## What it solves

Every admin panel or CRUD dashboard needs the same shell, a collapsible navigation sidebar and a page header, rebuilt slightly differently each time. `@arkyn/ui` packages controlled, composable primitives for both, plus a thin `AdminLayout` wrapper for wiring them together quickly, so teams can focus on the pages instead of the scaffolding around them.

## Features

- 🧭 **Sidebar**, `SidebarRoot`/`SidebarHeader`/`SidebarGroup`/`SidebarLink`/`SidebarFooter`, a controlled, collapsible navigation rail, router-agnostic
- 🪧 **Header**, `HeaderRoot`/`HeaderTitle`/`HeaderActions`/`HeaderUser`, a page header with title, breadcrumb, and action slots
- 🧱 **AdminLayout**, `AdminLayoutRoot`/`AdminLayoutContent`, a convenience wrapper composing sidebar and content

## Prerequisites

- **Node.js** `>=18.0.0` or **Bun** `>=1.0.0`
- Peer dependencies: `react >=18.0.0`, `react-dom >=18.0.0`, `lucide-react >=1.14.0`

## Installation

```bash
npm install @arkyn/ui
```

## Import convention

Prefer importing each component from its own subpath:

```tsx
import { SidebarRoot } from "@arkyn/ui/sidebarRoot";
import "@arkyn/ui/sidebarRoot.css";
```

Or import the aggregate stylesheet once if you're using most of the package:

```tsx
import "@arkyn/ui/styles";
```

## Quick example

```tsx
import { useState } from "react";
import { SidebarRoot } from "@arkyn/ui/sidebarRoot";
import { SidebarHeader } from "@arkyn/ui/sidebarHeader";
import { SidebarGroup } from "@arkyn/ui/sidebarGroup";
import { SidebarLink } from "@arkyn/ui/sidebarLink";
import { AdminLayoutRoot } from "@arkyn/ui/adminLayoutRoot";
import { AdminLayoutContent } from "@arkyn/ui/adminLayoutContent";
import { HeaderRoot } from "@arkyn/ui/headerRoot";
import { HeaderTitle } from "@arkyn/ui/headerTitle";
import { Users } from "lucide-react";
import "@arkyn/ui/styles";

function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AdminLayoutRoot
      sidebar={
        <SidebarRoot collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)}>
          <SidebarHeader>Acme Admin</SidebarHeader>
          <SidebarGroup label="Cadastros">
            <SidebarLink href="/patients" icon={Users} label="Pacientes" active />
          </SidebarGroup>
        </SidebarRoot>
      }
    >
      <AdminLayoutContent>
        <HeaderRoot>
          <HeaderTitle title="Pacientes" />
        </HeaderRoot>
        {children}
      </AdminLayoutContent>
    </AdminLayoutRoot>
  );
}
```

## License

Apache-2.0
