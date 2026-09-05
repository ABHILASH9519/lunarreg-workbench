import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  Boxes,
  Database,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  History,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Rocket,
  Satellite,
  ScanSearch,
  Settings2,
  Workflow,
} from "lucide-react";
import { Suspense, lazy } from "react";

// ---------------------------------------------------------------------------
// Lazy-loaded pages. Each page is resolved lazily so the build does not fail
// if a page file is momentarily missing; the Suspense fallback renders a
// mission-style loading state until the chunk arrives.
// ---------------------------------------------------------------------------

const MissionControlPage = lazy(() => import("@/pages/MissionControl"));
const RegistrationWorkflowPage = lazy(
  () => import("@/pages/RegistrationWorkflow"),
);
const CorrespondenceViewerPage = lazy(
  () => import("@/pages/CorrespondenceViewerPage"),
);
const RegistrationViewerPage = lazy(() => import("@/pages/RegistrationViewer"));
const JobDetailPage = lazy(() => import("@/pages/JobDetail"));
const JobHistoryPage = lazy(() => import("@/pages/JobHistory"));
const AnalysesPage = lazy(() => import("@/pages/Analyses"));
const ModelComparisonPage = lazy(() => import("@/pages/ModelComparison"));
const ExperimentLabPage = lazy(() => import("@/pages/ExperimentLab"));
const DatasetExplorerPage = lazy(() => import("@/pages/DatasetExplorer"));
const TechnologyPage = lazy(() => import("@/pages/Technology"));
const DemoModePage = lazy(() => import("@/pages/DemoMode"));

// ---------------------------------------------------------------------------
// Loading fallback shown while a lazy page chunk resolves.
// ---------------------------------------------------------------------------

function PageLoading() {
  return (
    <div
      data-ocid="page.loading_state"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
    >
      <div className="relative flex size-14 items-center justify-center rounded-full border bg-card shadow-subtle">
        <Loader2
          className="text-primary size-6 animate-spin"
          aria-hidden="true"
        />
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/10" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-display text-sm font-medium tracking-wide">
          Loading workbench module
        </p>
        <p className="text-muted-foreground font-mono text-xs">
          Establishing telemetry link…
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation model
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workbench",
    items: [
      { label: "Mission Control", to: "/", icon: LayoutDashboard },
      { label: "Registration Workflow", to: "/workflow", icon: Workflow },
      {
        label: "Correspondence Viewer",
        to: "/correspondence",
        icon: ScanSearch,
      },
      {
        label: "Registration Viewer",
        to: "/registration",
        icon: GitCompareArrows,
      },
      { label: "Job Detail", to: "/jobs/$jobId", icon: Rocket },
      { label: "Job History", to: "/history", icon: History },
    ],
  },
  {
    label: "Analysis",
    items: [
      { label: "Analyses", to: "/analyses", icon: Gauge },
      { label: "Model Comparison", to: "/models", icon: Boxes },
      { label: "Experiment Lab", to: "/lab", icon: FlaskConical },
      { label: "Dataset Explorer", to: "/datasets", icon: Database },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Technology & Methodology", to: "/technology", icon: BookOpen },
    ],
  },
  {
    label: "Demo",
    items: [{ label: "Demo Mode", to: "/demo", icon: Satellite }],
  },
];

// ---------------------------------------------------------------------------
// Layout shell
// ---------------------------------------------------------------------------

function MissionHeader() {
  const { isAuthenticated, login, clear, identity } = useInternetIdentity();

  const principal = identity?.getPrincipal?.().toString() ?? "";
  const shortPrincipal =
    principal.length > 12
      ? `${principal.slice(0, 6)}…${principal.slice(-4)}`
      : principal;

  return (
    <header className="bg-card sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 shadow-subtle">
      <div className="flex min-w-0 items-center gap-2.5 pl-12 md:pl-0">
        <span className="bg-gradient-primary flex size-8 items-center justify-center rounded-md text-primary-foreground">
          <Satellite className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="font-display text-sm font-semibold tracking-tight">
            LunarReg Workbench
          </span>
          <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
            Lunar Image Registration
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Badge
          data-ocid="header.demo_badge"
          className="border-warning/50 bg-warning/15 text-warning font-mono text-[10px] uppercase tracking-widest"
        >
          <Activity className="size-3" aria-hidden="true" />
          DEMO / SAMPLE DATA
        </Badge>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-ocid="header.identity"
                type="button"
                aria-label="Account menu"
                className="focus-visible:ring-ring inline-flex items-center gap-2 rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/15 text-primary font-mono text-xs">
                    {shortPrincipal.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">Authenticated</span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {shortPrincipal}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-ocid="header.logout"
                onSelect={() => clear()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            data-ocid="header.sign_in"
            size="sm"
            onClick={() => login()}
            className="gap-1.5"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}

function SidebarNav() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2 py-1 pr-2 pl-12">
          <span className="bg-gradient-primary flex size-8 shrink-0 items-center justify-center rounded-md text-primary-foreground">
            <Satellite className="size-4" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="font-display truncate text-sm font-semibold tracking-tight">
              LunarReg
            </span>
            <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
              Workbench
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <Link
                          to={item.to}
                          activeOptions={{ exact: item.to === "/" }}
                        >
                          <Icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1">
          <Settings2
            className="text-muted-foreground size-4"
            aria-hidden="true"
          />
          <span className="text-muted-foreground text-xs">
            v0.1 · Prototype
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function MissionLayout() {
  return (
    <SidebarProvider>
      <SidebarTrigger
        data-ocid="nav.toggle"
        className="bg-card/80 fixed top-2 left-2 z-30 border shadow-subtle backdrop-blur-sm"
      />
      <SidebarNav />
      <SidebarInset>
        <MissionHeader />
        <main className="bg-background flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 lg:px-8">
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const rootRoute = createRootRoute({
  component: MissionLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <MissionControlPage />
    </Suspense>
  ),
});

const workflowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workflow",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <RegistrationWorkflowPage />
    </Suspense>
  ),
});

const correspondenceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/correspondence",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <CorrespondenceViewerPage />
    </Suspense>
  ),
});

const registrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/registration",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <RegistrationViewerPage />
    </Suspense>
  ),
});

const jobDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs/$jobId",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <JobDetailPage />
    </Suspense>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <JobHistoryPage />
    </Suspense>
  ),
});

const analysesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analyses",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <AnalysesPage />
    </Suspense>
  ),
});

const modelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/models",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <ModelComparisonPage />
    </Suspense>
  ),
});

const labRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lab",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <ExperimentLabPage />
    </Suspense>
  ),
});

const datasetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/datasets",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <DatasetExplorerPage />
    </Suspense>
  ),
});

const technologyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/technology",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <TechnologyPage />
    </Suspense>
  ),
});

const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo",
  component: () => (
    <Suspense fallback={<PageLoading />}>
      <DemoModePage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  workflowRoute,
  correspondenceRoute,
  registrationRoute,
  jobDetailRoute,
  historyRoute,
  analysesRoute,
  modelsRoute,
  labRoute,
  datasetsRoute,
  technologyRoute,
  demoRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
