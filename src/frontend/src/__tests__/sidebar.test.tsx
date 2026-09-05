import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * Characterization of the navigation panel behavior that must remain intact:
 * toggling the sidebar trigger opens/closes the panel, and on mobile the panel
 * is a Sheet that slides in/out from the left edge of the interface.
 */

const MOBILE_VIEWPORT = 375;
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
          <span>Navigation content</span>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>,
  );
}

describe("sidebar navigation panel", () => {
  beforeEach(() => {
    setViewport(DESKTOP_VIEWPORT);
    // Clear any cookie written by a previous test in this file.
    document.cookie = "sidebar_state=; path=/; max-age=0";
  });

  it("renders a toggle trigger and the navigation panel", () => {
    renderSidebar();
    expect(
      screen.getByRole("button", { name: "Toggle Sidebar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Navigation content")).toBeInTheDocument();
  });

  it("toggles the desktop panel between expanded and collapsed", async () => {
    const user = userEvent.setup();
    renderSidebar();

    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    expect(panel).toHaveAttribute("data-state", "expanded");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(panel).toHaveAttribute("data-state", "collapsed");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(panel).toHaveAttribute("data-state", "expanded");
  });

  it("renders the panel on the left side on desktop", () => {
    renderSidebar();
    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    expect(panel).toHaveAttribute("data-side", "left");
  });

  it("toggles the panel with the Ctrl+B keyboard shortcut", async () => {
    const user = userEvent.setup();
    renderSidebar();

    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    expect(panel).toHaveAttribute("data-state", "expanded");

    await user.keyboard("{Control>}b{/Control}");
    expect(panel).toHaveAttribute("data-state", "collapsed");

    await user.keyboard("{Control>}b{/Control}");
    expect(panel).toHaveAttribute("data-state", "expanded");
  });

  it("persists the open/closed state to the sidebar_state cookie", async () => {
    const user = userEvent.setup();
    renderSidebar();

    // No cookie is written until the user toggles the sidebar.
    expect(document.cookie).not.toContain("sidebar_state");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(document.cookie).toContain("sidebar_state=false");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(document.cookie).toContain("sidebar_state=true");
  });
});

describe("sidebar navigation panel on mobile", () => {
  beforeEach(() => {
    setViewport(MOBILE_VIEWPORT);
  });

  it("slides the panel in from the left edge when opened", async () => {
    const user = userEvent.setup();
    renderSidebar();

    // On mobile the panel is hidden until the trigger is pressed.
    expect(screen.queryByText("Navigation content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

    // The mobile panel is a Sheet content sliding in from the left.
    const content = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar'][data-mobile='true']");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("data-state", "open");
    // The left-side sheet slides in from the left edge.
    expect(content?.className).toContain("slide-in-from-left");
    expect(content?.className).toContain("left-0");
  });

  it("slides the panel out to the left edge when closed", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const content = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar'][data-mobile='true']");
    expect(content).toHaveAttribute("data-state", "open");

    // Dismiss the sheet (Escape closes the dialog).
    await user.keyboard("{Escape}");
    expect(content).toHaveAttribute("data-state", "closed");
    expect(content?.className).toContain("slide-out-to-left");
  });

  it("closes the panel with its Close button", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const content = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar'][data-mobile='true']");
    expect(content).toHaveAttribute("data-state", "open");

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("closes the panel when the overlay is clicked", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const content = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar'][data-mobile='true']");
    expect(content).toHaveAttribute("data-state", "open");

    await user.click(document.querySelector("[data-slot='sheet-overlay']")!);
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("is hidden until opened and is marked as the mobile panel", async () => {
    const user = userEvent.setup();
    renderSidebar();

    expect(screen.queryByText("Navigation content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const content = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar'][data-mobile='true']");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("data-mobile", "true");
  });
});

describe("sidebar rail", () => {
  beforeEach(() => {
    setViewport(DESKTOP_VIEWPORT);
  });

  it("renders a rail toggle alongside the trigger button", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger data-ocid="nav.toggle" />
        <Sidebar side="left">
          <SidebarContent>
            <span>Navigation content</span>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    );
    const toggles = screen.getAllByRole("button", { name: "Toggle Sidebar" });
    // The trigger button and the rail are both toggle controls.
    expect(toggles.length).toBeGreaterThanOrEqual(2);
    expect(
      document.querySelector("[data-slot='sidebar-rail']"),
    ).toBeInTheDocument();
  });

  it("toggles the panel when the rail is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarTrigger data-ocid="nav.toggle" />
        <Sidebar side="left">
          <SidebarContent>
            <span>Navigation content</span>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    );

    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    expect(panel).toHaveAttribute("data-state", "expanded");

    await user.click(document.querySelector("[data-slot='sidebar-rail']")!);
    expect(panel).toHaveAttribute("data-state", "collapsed");
  });
});

describe("mobile sidebar accessibility", () => {
  beforeEach(() => {
    setViewport(MOBILE_VIEWPORT);
  });

  it("exposes the panel as an accessible dialog", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const dialog = screen.getByRole("dialog", { name: "Sidebar" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-mobile", "true");
  });
});

describe("desktop sidebar collapsible state", () => {
  beforeEach(() => {
    setViewport(DESKTOP_VIEWPORT);
  });

  it("sets data-collapsible when collapsed and clears it when expanded", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <SidebarTrigger data-ocid="nav.toggle" />
        <Sidebar side="left" collapsible="icon">
          <SidebarContent>
            <span>Navigation content</span>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );

    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    expect(panel).toHaveAttribute("data-collapsible", "");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(panel).toHaveAttribute("data-collapsible", "icon");
  });
});

describe("mobile sidebar width", () => {
  beforeEach(() => {
    setViewport(MOBILE_VIEWPORT);
  });

  it("sizes the panel with the mobile --sidebar-width variable", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const content = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar'][data-mobile='true']");
    expect(content).toHaveStyle({ "--sidebar-width": "18rem" });
  });
});

describe("desktop sidebar variant", () => {
  beforeEach(() => {
    setViewport(DESKTOP_VIEWPORT);
  });

  it("carries the default variant and left side as data attributes", () => {
    renderSidebar();
    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    expect(panel).toHaveAttribute("data-variant", "sidebar");
    expect(panel).toHaveAttribute("data-side", "left");
  });
});

describe("desktop offcanvas sidebar", () => {
  beforeEach(() => {
    setViewport(DESKTOP_VIEWPORT);
  });

  // The app's App.tsx renders the sidebar with collapsible="offcanvas", so the
  // panel slides off-canvas from the left edge instead of collapsing to an icon
  // rail. This characterizes that accepted behavior.
  function renderOffcanvas() {
    return render(
      <SidebarProvider>
        <SidebarTrigger data-ocid="nav.toggle" />
        <Sidebar side="left" collapsible="offcanvas">
          <SidebarContent>
            <span>Navigation content</span>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );
  }

  it("slides the panel off-canvas from the left edge when collapsed", async () => {
    const user = userEvent.setup();
    renderOffcanvas();

    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    expect(panel).toHaveAttribute("data-state", "expanded");
    expect(panel).toHaveAttribute("data-collapsible", "");

    // The panel container sits at the left edge while expanded.
    const container = document.querySelector("[data-slot='sidebar-container']");
    expect(container?.className).toContain("left-0");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(panel).toHaveAttribute("data-state", "collapsed");
    expect(panel).toHaveAttribute("data-collapsible", "offcanvas");

    // Collapsing slides the container off-canvas to the left (negative offset),
    // so the panel leaves the interface from the left edge.
    expect(container?.className).toContain(
      "group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]",
    );
  });

  it("slides the panel back in from the left edge when reopened", async () => {
    const user = userEvent.setup();
    renderOffcanvas();

    const panel = screen
      .getByText("Navigation content")
      .closest("[data-slot='sidebar']");
    const container = document.querySelector("[data-slot='sidebar-container']");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(panel).toHaveAttribute("data-state", "collapsed");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(panel).toHaveAttribute("data-state", "expanded");
    expect(panel).toHaveAttribute("data-collapsible", "");
    expect(container?.className).toContain("left-0");
  });
});

describe("sidebar toggle button placement", () => {
  beforeEach(() => {
    setViewport(DESKTOP_VIEWPORT);
  });

  it("keeps the toggle button fixed in the upper left corner", () => {
    // App.tsx renders the trigger with these classes so it stays fixed in the
    // upper-left corner of the interface regardless of the panel's state.
    render(
      <SidebarProvider>
        <SidebarTrigger
          data-ocid="nav.toggle"
          className="bg-card/80 fixed top-2 left-2 z-30 border shadow-subtle backdrop-blur-sm"
        />
        <Sidebar side="left" collapsible="offcanvas">
          <SidebarContent>
            <span>Navigation content</span>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Toggle Sidebar" });
    expect(trigger).toHaveAttribute("data-ocid", "nav.toggle");
    expect(trigger.className).toContain("fixed");
    expect(trigger.className).toContain("top-2");
    expect(trigger.className).toContain("left-2");
  });
});
