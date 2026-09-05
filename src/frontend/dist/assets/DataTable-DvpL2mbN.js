import { j as jsxRuntimeExports, a as cn } from "./index-CLvvNGC5.js";
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function DataTable({
  columns,
  data,
  rowKey,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("overflow-hidden rounded-lg border", className), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { className: "bg-muted/40 hover:bg-muted/40", children: columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      TableHead,
      {
        className: cn("px-3", col.headerClassName),
        children: col.header
      },
      col.header
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: data.map((row, index) => {
      const key = rowKey ? rowKey(row, index) : index;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: columns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        TableCell,
        {
          className: cn("px-3", col.cellClassName),
          children: col.cell(row)
        },
        col.header
      )) }, key);
    }) })
  ] }) });
}
export {
  DataTable as D
};
