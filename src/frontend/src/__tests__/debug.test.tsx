import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * Characterization: the navigation menu renders each item as a button that can
 * be composed with a link (asChild), which is how the app's nav groups are
 * wired to routes.
 */

const DESKTOP_VIEWPORT = 1280;

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

function renderSidebar() {
  return render(
    <SidebarProvider>
      <SidebarTrigger data-ocid="nav.toggle" />
      <Sidebar side="left">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/workflow">Registration Workflow</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );
}

describe("sidebar navigation menu", () => {
  beforeEach(() => setViewport(DESKTOP_VIEWPORT));

  it("renders a menu item as a link when composed with asChild", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: "Registration Workflow" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/workflow");
  });
});
