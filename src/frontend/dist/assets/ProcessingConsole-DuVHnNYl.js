import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, P as Primitive, a as cn, aq as LoaderCircle, ar as createContextScope } from "./index-CLvvNGC5.js";
import { P as PIPELINE_STAGES, S as STAGE_LABELS } from "./cv-engine-jhIfoGkm.js";
import { C as Check } from "./check-gbVmm_Ow.js";
import { C as CircleX } from "./StatusBadge-BeOJaX2E.js";
import { C as CircleCheck } from "./circle-check-DcUF21bz.js";
import { T as TriangleAlert } from "./LoadingState-CJmkDIGR.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
];
const RotateCcw = createLucideIcon("rotate-ccw", __iconNode);
var NAME = "Separator";
var DEFAULT_ORIENTATION = "horizontal";
var ORIENTATIONS = ["horizontal", "vertical"];
var Separator$1 = reactExports.forwardRef((props, forwardedRef) => {
  const { decorative, orientation: orientationProp = DEFAULT_ORIENTATION, ...domProps } = props;
  const orientation = isValidOrientation(orientationProp) ? orientationProp : DEFAULT_ORIENTATION;
  const ariaOrientation = orientation === "vertical" ? orientation : void 0;
  const semanticProps = decorative ? { role: "none" } : { "aria-orientation": ariaOrientation, role: "separator" };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Primitive.div,
    {
      "data-orientation": orientation,
      ...semanticProps,
      ...domProps,
      ref: forwardedRef
    }
  );
});
Separator$1.displayName = NAME;
function isValidOrientation(orientation) {
  return ORIENTATIONS.includes(orientation);
}
var Root$1 = Separator$1;
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root$1,
    {
      "data-slot": "separator",
      decorative,
      orientation,
      className: cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      ),
      ...props
    }
  );
}
function PipelineStageIndicator({
  currentStage,
  isRunning = false,
  className
}) {
  const currentIndex = currentStage ? PIPELINE_STAGES.indexOf(currentStage) : -1;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "ol",
    {
      className: cn(
        "flex w-full items-start gap-1 overflow-x-auto pb-1",
        className
      ),
      "aria-label": "Registration pipeline stages",
      children: PIPELINE_STAGES.map((stage, index) => {
        const completed = currentIndex > index;
        const current = currentIndex === index;
        const pending = currentIndex < index;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "li",
          {
            className: "flex min-w-0 flex-1 flex-col items-center gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "h-px flex-1",
                      index === 0 ? "bg-transparent" : completed ? "bg-primary/60" : "bg-border"
                    ),
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                      completed && "border-primary bg-primary text-primary-foreground",
                      current && "border-primary bg-primary/15 text-primary ring-ring ring-2",
                      pending && "border-border bg-muted text-muted-foreground"
                    ),
                    "aria-current": current ? "step" : void 0,
                    children: completed ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5", "aria-hidden": "true" }) : current && isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      LoaderCircle,
                      {
                        className: "size-3.5 animate-spin",
                        "aria-hidden": "true"
                      }
                    ) : index + 1
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "h-px flex-1",
                      index === PIPELINE_STAGES.length - 1 ? "bg-transparent" : completed || current ? "bg-primary/60" : "bg-border"
                    ),
                    "aria-hidden": "true"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: cn(
                    "max-w-full truncate text-[10px] font-medium",
                    completed && "text-primary",
                    current && "text-foreground",
                    pending && "text-muted-foreground"
                  ),
                  children: STAGE_LABELS[stage]
                }
              )
            ]
          },
          stage
        );
      })
    }
  );
}
var PROGRESS_NAME = "Progress";
var DEFAULT_MAX = 100;
var [createProgressContext] = createContextScope(PROGRESS_NAME);
var [ProgressProvider, useProgressContext] = createProgressContext(PROGRESS_NAME);
var Progress$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeProgress,
      value: valueProp = null,
      max: maxProp,
      getValueLabel = defaultGetValueLabel,
      ...progressProps
    } = props;
    if ((maxProp || maxProp === 0) && !isValidMaxNumber(maxProp)) {
      console.error(getInvalidMaxError(`${maxProp}`, "Progress"));
    }
    const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
    if (valueProp !== null && !isValidValueNumber(valueProp, max)) {
      console.error(getInvalidValueError(`${valueProp}`, "Progress"));
    }
    const value = isValidValueNumber(valueProp, max) ? valueProp : null;
    const valueLabel = isNumber(value) ? getValueLabel(value, max) : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressProvider, { scope: __scopeProgress, value, max, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "aria-valuemax": max,
        "aria-valuemin": 0,
        "aria-valuenow": isNumber(value) ? value : void 0,
        "aria-valuetext": valueLabel,
        role: "progressbar",
        "data-state": getProgressState(value, max),
        "data-value": value ?? void 0,
        "data-max": max,
        ...progressProps,
        ref: forwardedRef
      }
    ) });
  }
);
Progress$1.displayName = PROGRESS_NAME;
var INDICATOR_NAME = "ProgressIndicator";
var ProgressIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeProgress, ...indicatorProps } = props;
    const context = useProgressContext(INDICATOR_NAME, __scopeProgress);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": getProgressState(context.value, context.max),
        "data-value": context.value ?? void 0,
        "data-max": context.max,
        ...indicatorProps,
        ref: forwardedRef
      }
    );
  }
);
ProgressIndicator.displayName = INDICATOR_NAME;
function defaultGetValueLabel(value, max) {
  return `${Math.round(value / max * 100)}%`;
}
function getProgressState(value, maxValue) {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}
function isNumber(value) {
  return typeof value === "number";
}
function isValidMaxNumber(max) {
  return isNumber(max) && !isNaN(max) && max > 0;
}
function isValidValueNumber(value, max) {
  return isNumber(value) && !isNaN(value) && value <= max && value >= 0;
}
function getInvalidMaxError(propValue, componentName) {
  return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`;
}
function getInvalidValueError(propValue, componentName) {
  return `Invalid prop \`value\` of value \`${propValue}\` supplied to \`${componentName}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
var Root = Progress$1;
var Indicator = ProgressIndicator;
function Progress({
  className,
  value,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      "data-slot": "progress",
      className: cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Indicator,
        {
          "data-slot": "progress-indicator",
          className: "bg-primary h-full w-full flex-1 transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  );
}
function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1e3);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
function ProcessingConsole({
  currentStage,
  progress,
  elapsedMs,
  log,
  issues,
  isRunning = false,
  className
}) {
  const percent = Math.round(progress * 100);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-subtle",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
            isRunning ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              LoaderCircle,
              {
                className: "text-primary size-4 animate-spin",
                "aria-hidden": "true"
              }
            ) : errors.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "text-destructive size-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "text-success size-4", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-sm font-medium", children: currentStage ? STAGE_LABELS[currentStage] : "Idle" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-xs tabular-nums", children: formatElapsed(elapsedMs) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: percent, className: "h-2 flex-1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-xs tabular-nums w-10 text-right", children: [
            percent,
            "%"
          ] })
        ] }),
        (errors.length > 0 || warnings.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          errors.map((issue) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CircleX,
                  {
                    className: "mt-0.5 size-3.5 shrink-0",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: issue.message })
              ]
            },
            `err-${issue.stage}-${issue.message}`
          )),
          warnings.map((issue) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1.5 text-xs text-warning",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "mt-0.5 size-3.5 shrink-0",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: issue.message })
              ]
            },
            `warn-${issue.stage}-${issue.message}`
          ))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex max-h-40 flex-col gap-1 overflow-y-auto pr-1", children: log.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: "Awaiting pipeline events…" }) : log.map((event) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-2 font-mono text-xs text-muted-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary/70 shrink-0 tabular-nums", children: [
                Math.round(event.progress * 100),
                "%"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: event.message })
            ]
          },
          `${event.stage}-${event.message}`
        )) })
      ]
    }
  );
}
export {
  Progress as P,
  RotateCcw as R,
  PipelineStageIndicator as a,
  ProcessingConsole as b
};
