import { c as createLucideIcon, j as jsxRuntimeExports, as as Tooltip, at as TooltipTrigger, au as TooltipContent, a as cn } from "./index-CLvvNGC5.js";
import { C as Card, a as CardContent } from "./SectionCard-j39JmNct.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
];
const Info = createLucideIcon("info", __iconNode);
function MetricCard({
  label,
  value,
  unit,
  explanation,
  tone = "default",
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: cn("gap-2 py-4 shadow-subtle", className), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-col gap-2 px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "aria-label": `About ${label}`,
            className: "text-muted-foreground hover:text-foreground inline-flex size-5 items-center justify-center rounded-full transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "size-3.5", "aria-hidden": "true" })
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "top", className: "max-w-xs", children: explanation })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: cn(
            "font-mono text-2xl font-semibold leading-none tracking-tight",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
            tone === "destructive" && "text-destructive"
          ),
          children: value
        }
      ),
      unit ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-sm", children: unit }) : null
    ] })
  ] }) });
}
export {
  Info as I,
  MetricCard as M
};
