import { j as jsxRuntimeExports, a as cn } from "./index-CLvvNGC5.js";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: cn("gap-4 py-5 shadow-subtle", className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "px-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base", children: title }),
        description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: description }) : null
      ] }),
      action ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0", children: action }) : null
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: cn("px-5", contentClassName), children })
  ] });
}
export {
  Card as C,
  SectionCard as S,
  CardContent as a
};
