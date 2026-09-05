import { c as createLucideIcon, j as jsxRuntimeExports, e as Badge, a as cn } from "./index-CLvvNGC5.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M12 20v2", key: "1lh1kg" }],
  ["path", { d: "M12 2v2", key: "tus03m" }],
  ["path", { d: "M17 20v2", key: "1rnc9c" }],
  ["path", { d: "M17 2v2", key: "11trls" }],
  ["path", { d: "M2 12h2", key: "1t8f8n" }],
  ["path", { d: "M2 17h2", key: "7oei6x" }],
  ["path", { d: "M2 7h2", key: "asdhe0" }],
  ["path", { d: "M20 12h2", key: "1q8mjw" }],
  ["path", { d: "M20 17h2", key: "1fpfkl" }],
  ["path", { d: "M20 7h2", key: "1o8tra" }],
  ["path", { d: "M7 20v2", key: "4gnj0m" }],
  ["path", { d: "M7 2v2", key: "1i4yhu" }],
  ["rect", { x: "4", y: "4", width: "16", height: "16", rx: "2", key: "1vbyd7" }],
  ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "1", key: "z9xiuo" }]
];
const Cpu = createLucideIcon("cpu", __iconNode$1);
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
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
      key: "cbrjhi"
    }
  ]
];
const Wrench = createLucideIcon("wrench", __iconNode);
function PrototypeStatusBadge({
  status,
  className
}) {
  if (status === "functional") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Badge,
      {
        className: cn(
          "border-primary/40 bg-primary/15 text-primary",
          className
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { "aria-hidden": "true" }),
          "Functional in-browser"
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Badge,
    {
      className: cn("border-warning/40 bg-warning/15 text-warning", className),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { "aria-hidden": "true" }),
        "Prototype/Integration Pending"
      ]
    }
  );
}
export {
  Cpu as C,
  PrototypeStatusBadge as P,
  Wrench as W
};
