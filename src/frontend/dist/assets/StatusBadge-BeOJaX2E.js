import { c as createLucideIcon, j as jsxRuntimeExports, e as Badge, a as cn } from "./index-CLvvNGC5.js";
import { T as TriangleAlert } from "./LoadingState-CJmkDIGR.js";
import { C as CircleCheck } from "./circle-check-DcUF21bz.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
];
const CircleX = createLucideIcon("circle-x", __iconNode);
const STATUS_META = {
  pass: {
    label: "PASS",
    icon: CircleCheck,
    className: "border-success/40 bg-success/15 text-success"
  },
  warning: {
    label: "WARNING",
    icon: TriangleAlert,
    className: "border-warning/40 bg-warning/15 text-warning"
  },
  failed: {
    label: "FAILED",
    icon: CircleX,
    className: "border-destructive/40 bg-destructive/15 text-destructive"
  }
};
function StatusBadge({ status, label, className }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: cn(meta.className, className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { "aria-hidden": "true" }),
    label ?? meta.label
  ] });
}
export {
  CircleX as C,
  StatusBadge as S
};
