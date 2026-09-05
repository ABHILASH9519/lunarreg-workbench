import { r as reactExports, j as jsxRuntimeExports, D as Database } from "./index-CLvvNGC5.js";
import { D as DataOriginBadge, L as LoadingState, E as ErrorState, a as EmptyState } from "./LoadingState-CJmkDIGR.js";
import { D as DataTable } from "./DataTable-DvpL2mbN.js";
import { P as PrototypeStatusBadge, W as Wrench, C as Cpu } from "./PrototypeStatusBadge-DeOLmAG7.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { generateAllDemoPairs } from "./demo-pairs-DZbS-Ryj.js";
const SENSOR_PROFILES = [
  {
    sensor: "OHRC",
    mission: "Chandrayaan-2",
    agency: "ISRO",
    resolution: "0.25 m (nadir)",
    spectralBand: "Panchromatic · 0.45–0.8 µm",
    swath: "3 km",
    description: "Orbiter High Resolution Camera — very high-resolution panchromatic imaging for landing-site characterization and small-scale feature studies."
  },
  {
    sensor: "TMC-2",
    mission: "Chandrayaan-2",
    agency: "ISRO",
    resolution: "5 m",
    spectralBand: "Panchromatic · 0.5–0.8 µm",
    swath: "20 km",
    description: "Terrain Mapping Camera-2 — stereo (fore/nadir/aft) panchromatic mapping for lunar topography and DEM generation."
  },
  {
    sensor: "IIRS",
    mission: "Chandrayaan-2",
    agency: "ISRO",
    resolution: "~80 m",
    spectralBand: "IR · 0.8–5.0 µm · 256 bands",
    swath: "20 km",
    description: "Imaging IR Spectrometer — hyperspectral mineralogical and volatile mapping, including the 3 µm water/hydroxyl feature."
  },
  {
    sensor: "LRO NAC",
    mission: "Lunar Reconnaissance Orbiter",
    agency: "NASA",
    resolution: "0.5–1.0 m",
    spectralBand: "Panchromatic · visible",
    swath: "~2.5 km",
    description: "Narrow Angle Camera — high-resolution panchromatic imaging for meter-scale lunar surface studies."
  },
  {
    sensor: "SELENE",
    mission: "SELENE (Kaguya)",
    agency: "JAXA",
    resolution: "10 m",
    spectralBand: "Panchromatic · visible",
    swath: "35 km",
    description: "Terrain Camera — stereo panchromatic mapping for global lunar topography."
  }
];
const CAPABILITY_STATUS = [
  {
    name: "Bundled DEMO/SAMPLE Pairs",
    description: "Five synthetic lunar-like pairs (OHRC, TMC-2, IIRS, LRO NAC, SELENE) bundled in-browser for the registration pipeline.",
    status: "functional"
  },
  {
    name: "In-browser Registration Pipeline",
    description: "Feature detection, matching, geometric verification and RMSE evaluation run entirely in the browser on demo data.",
    status: "functional"
  },
  {
    name: "Official Dataset Connectivity",
    description: "Live Chandrayaan-2 OHRC/TMC-2/IIRS, LRO NAC and SELENE data access behind a modular integration layer — planned, not connected.",
    status: "pending"
  }
];
function PairThumb({ dataUrl, label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex flex-col items-center gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-12 items-center justify-center overflow-hidden rounded-md border bg-background", children: dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: dataUrl,
        alt: `${label} preview`,
        className: "size-full object-cover",
        loading: "lazy"
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[10px]", children: "—" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[10px]", children: label })
  ] });
}
function DatasetExplorerPage() {
  const [pairsState, setPairsState] = reactExports.useState({
    status: "loading"
  });
  const generatePairs = reactExports.useCallback(() => {
    setPairsState({ status: "loading" });
    try {
      const pairs = generateAllDemoPairs();
      setPairsState({ status: "ready", pairs });
    } catch (error) {
      setPairsState({
        status: "error",
        message: error instanceof Error ? error.message : "Demo pair generation failed in this browser."
      });
    }
  }, []);
  reactExports.useEffect(() => {
    generatePairs();
  }, [generatePairs]);
  const sensorColumns = [
    {
      header: "Sensor",
      cell: (sensor) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-semibold", children: sensor.sensor })
    },
    {
      header: "Source Mission",
      cell: (sensor) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: sensor.mission }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[11px] uppercase tracking-wider", children: sensor.agency })
      ] })
    },
    {
      header: "Resolution",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (sensor) => sensor.resolution
    },
    {
      header: "Spectral Band",
      cell: (sensor) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: sensor.spectralBand })
    },
    {
      header: "Swath",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (sensor) => sensor.swath
    },
    {
      header: "Integration",
      cell: () => /* @__PURE__ */ jsxRuntimeExports.jsx(PrototypeStatusBadge, { status: "pending" })
    }
  ];
  const pairColumns = [
    {
      header: "Pair",
      cell: (pair) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display truncate text-sm font-medium", children: pair.metadata.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[11px]", children: pair.metadata.id })
      ] })
    },
    {
      header: "Sensor",
      cell: (pair) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-semibold", children: pair.metadata.sensor })
    },
    {
      header: "Sun Azimuth",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (pair) => `${pair.metadata.sunAzimuthDeg}°`
    },
    {
      header: "Sun Elevation",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (pair) => `${pair.metadata.sunElevationDeg}°`
    },
    {
      header: "Scale Ratio",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (pair) => pair.metadata.scaleRatio.toFixed(2)
    },
    {
      header: "Source / Reference",
      cell: (pair) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PairThumb, { dataUrl: pair.sourceDataUrl, label: "Source" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PairThumb, { dataUrl: pair.referenceDataUrl, label: "Reference" })
      ] })
    },
    {
      header: "Origin",
      cell: () => /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        "data-ocid": "page.hero",
        className: "bg-grid scanline relative overflow-hidden rounded-2xl border bg-card p-6 shadow-subtle md:p-8",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-accent/10 blur-3xl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "size-5", "aria-hidden": "true" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground", children: "Data Catalog · Lunar Imagery" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl", children: [
              "Dataset ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-gold", children: "Explorer" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-muted-foreground text-sm leading-relaxed md:text-base", children: "Catalog of supported lunar sensors and the bundled DEMO/SAMPLE pairs available for in-browser registration. Official Chandrayaan-2, LRO NAC and SELENE dataset access is prepared behind a modular integration layer and is not yet connected." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(PrototypeStatusBadge, { status: "pending" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-[11px]", children: "Official dataset connectivity: Prototype/Integration Pending" })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Official Dataset Connectivity",
        description: "Planned future integration — not currently connected",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx(PrototypeStatusBadge, { status: "pending" }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-9 shrink-0 items-center justify-center rounded-md border border-warning/40 bg-warning/10 text-warning", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-4", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Official dataset access is a planned future integration" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm leading-relaxed", children: "Live connectivity to Chandrayaan-2 OHRC, TMC-2 and IIRS, LRO NAC and SELENE data is not currently connected. The catalog below lists reference instrument characteristics for the planned modular integration layer. Every image processed in this workbench today is bundled DEMO/SAMPLE DATA or a user upload — never official mission data." })
          ] })
        ] }) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      SectionCard,
      {
        title: "Supported Sensors",
        description: "Reference instrument characteristics for the planned modular integration layer — no live mission data is connected",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              "data-ocid": "sensors.table",
              columns: sensorColumns,
              data: SENSOR_PROFILES,
              rowKey: (sensor) => sensor.sensor
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-3 font-mono text-[11px]", children: "Characteristics compiled from public instrument documentation. Each sensor is Prototype/Integration Pending — official data access is not connected." })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Bundled DEMO/SAMPLE Pairs",
        description: "Synthetic lunar-like pairs bundled in-browser for the registration pipeline — never official mission imagery",
        children: pairsState.status === "loading" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Generating DEMO/SAMPLE pairs…", rows: 3 }) : pairsState.status === "error" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          ErrorState,
          {
            title: "Unable to generate demo pairs",
            message: pairsState.message,
            onRetry: () => generatePairs()
          }
        ) : pairsState.pairs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          EmptyState,
          {
            icon: Database,
            title: "No DEMO/SAMPLE pairs available",
            description: "The bundled demo pair catalog is empty. Rebuild the app or check the demo data module."
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DataTable,
          {
            "data-ocid": "demo_pairs.table",
            columns: pairColumns,
            data: pairsState.pairs,
            rowKey: (pair) => pair.metadata.id
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SectionCard,
      {
        title: "Prototype Status",
        description: "What is functional in-browser today vs. planned for future scientific/backend integration",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "prototype_status.list", className: "flex flex-col gap-3", children: CAPABILITY_STATUS.map((capability, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "li",
          {
            "data-ocid": `prototype_status.item.${index}`,
            className: "flex flex-col gap-1.5 rounded-lg border bg-background px-3 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                  capability.status === "functional" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Cpu,
                    {
                      className: "text-primary size-4 shrink-0",
                      "aria-hidden": "true"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Wrench,
                    {
                      className: "text-warning size-4 shrink-0",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display truncate text-sm font-medium", children: capability.name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(PrototypeStatusBadge, { status: capability.status })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: capability.description })
            ]
          },
          capability.name
        )) })
      }
    )
  ] });
}
export {
  DatasetExplorerPage as default
};
