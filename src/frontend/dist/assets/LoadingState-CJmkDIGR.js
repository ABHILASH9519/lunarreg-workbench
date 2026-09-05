import { c as createLucideIcon, j as jsxRuntimeExports, a as cn, e as Badge, D as Database, B as Button, aq as LoaderCircle } from "./index-CLvvNGC5.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ],
  ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
  ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }]
];
const HardDrive = createLucideIcon("hard-drive", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const TriangleAlert = createLucideIcon("triangle-alert", __iconNode);
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "skeleton",
      className: cn("bg-accent animate-pulse rounded-md", className),
      ...props
    }
  );
}
function DataOriginBadge({ origin, className }) {
  if (origin === "demo") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Badge,
      {
        className: cn(
          "border-warning/40 bg-warning/15 text-warning",
          className
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { "aria-hidden": "true" }),
          "DEMO/SAMPLE DATA"
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Badge,
    {
      className: cn("border-primary/40 bg-primary/15 text-primary", className),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { "aria-hidden": "true" }),
        "USER DATA"
      ]
    }
  );
}
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "empty_state",
      className: cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary/70 flex size-12 items-center justify-center rounded-full border bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-6", "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-base font-semibold", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-sm text-sm", children: description })
        ] }),
        actionLabel && onAction ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            "data-ocid": "empty_state_button",
            onClick: onAction,
            className: "mt-1",
            children: actionLabel
          }
        ) : null
      ]
    }
  );
}
function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "error_state",
      className: cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-12 text-center",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive flex size-12 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-6", "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-base font-semibold", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-sm text-sm", children: message })
        ] }),
        onRetry ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            "data-ocid": "error_state_retry_button",
            variant: "outline",
            onClick: onRetry,
            className: "mt-1",
            children: retryLabel
          }
        ) : null
      ]
    }
  );
}
function LoadingState({
  label = "Loading…",
  rows = 3,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "output",
    {
      "data-ocid": "loading_state",
      className: cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-6",
        className
      ),
      "aria-live": "polite",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            LoaderCircle,
            {
              className: "text-primary size-4 animate-spin",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3", children: Array.from({ length: rows }, (_, i) => i).map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, `skeleton-${i}`)) })
      ]
    }
  );
}
export {
  DataOriginBadge as D,
  ErrorState as E,
  HardDrive as H,
  LoadingState as L,
  TriangleAlert as T,
  EmptyState as a
};
