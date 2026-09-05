import { DataOriginBadge } from "@/components/DataOriginBadge";
import { DataTable } from "@/components/DataTable";
import type { DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { PrototypeStatusBadge } from "@/components/PrototypeStatusBadge";
import type { PrototypeStatus } from "@/components/PrototypeStatusBadge";
import { SectionCard } from "@/components/SectionCard";
import { generateAllDemoPairs } from "@/lib/demo/demo-pairs";
import type { DemoPair, DemoPairMetadata } from "@/lib/types";
import { Cpu, Database, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Sensor catalog — reference instrument characteristics for the planned
// modular integration layer. These are public instrument specifications
// compiled for the future official-dataset connector; NO live mission data is
// connected. Every sensor is marked Prototype/Integration Pending.
// ---------------------------------------------------------------------------

interface SensorProfile {
  sensor: DemoPairMetadata["sensor"];
  mission: string;
  agency: string;
  resolution: string;
  spectralBand: string;
  swath: string;
  description: string;
}

const SENSOR_PROFILES: SensorProfile[] = [
  {
    sensor: "OHRC",
    mission: "Chandrayaan-2",
    agency: "ISRO",
    resolution: "0.25 m (nadir)",
    spectralBand: "Panchromatic · 0.45–0.8 µm",
    swath: "3 km",
    description:
      "Orbiter High Resolution Camera — very high-resolution panchromatic imaging for landing-site characterization and small-scale feature studies.",
  },
  {
    sensor: "TMC-2",
    mission: "Chandrayaan-2",
    agency: "ISRO",
    resolution: "5 m",
    spectralBand: "Panchromatic · 0.5–0.8 µm",
    swath: "20 km",
    description:
      "Terrain Mapping Camera-2 — stereo (fore/nadir/aft) panchromatic mapping for lunar topography and DEM generation.",
  },
  {
    sensor: "IIRS",
    mission: "Chandrayaan-2",
    agency: "ISRO",
    resolution: "~80 m",
    spectralBand: "IR · 0.8–5.0 µm · 256 bands",
    swath: "20 km",
    description:
      "Imaging IR Spectrometer — hyperspectral mineralogical and volatile mapping, including the 3 µm water/hydroxyl feature.",
  },
  {
    sensor: "LRO NAC",
    mission: "Lunar Reconnaissance Orbiter",
    agency: "NASA",
    resolution: "0.5–1.0 m",
    spectralBand: "Panchromatic · visible",
    swath: "~2.5 km",
    description:
      "Narrow Angle Camera — high-resolution panchromatic imaging for meter-scale lunar surface studies.",
  },
  {
    sensor: "SELENE",
    mission: "SELENE (Kaguya)",
    agency: "JAXA",
    resolution: "10 m",
    spectralBand: "Panchromatic · visible",
    swath: "35 km",
    description:
      "Terrain Camera — stereo panchromatic mapping for global lunar topography.",
  },
];

// ---------------------------------------------------------------------------
// Prototype status — what is functional in-browser today vs. planned for
// future scientific/backend integration.
// ---------------------------------------------------------------------------

interface CapabilityStatus {
  name: string;
  description: string;
  status: PrototypeStatus;
}

const CAPABILITY_STATUS: CapabilityStatus[] = [
  {
    name: "Bundled DEMO/SAMPLE Pairs",
    description:
      "Five synthetic lunar-like pairs (OHRC, TMC-2, IIRS, LRO NAC, SELENE) bundled in-browser for the registration pipeline.",
    status: "functional",
  },
  {
    name: "In-browser Registration Pipeline",
    description:
      "Feature detection, matching, geometric verification and RMSE evaluation run entirely in the browser on demo data.",
    status: "functional",
  },
  {
    name: "Official Dataset Connectivity",
    description:
      "Live Chandrayaan-2 OHRC/TMC-2/IIRS, LRO NAC and SELENE data access behind a modular integration layer — planned, not connected.",
    status: "pending",
  },
];

// ---------------------------------------------------------------------------
// Demo pair generation state (real in-browser canvas work that can fail).
// ---------------------------------------------------------------------------

type PairsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; pairs: DemoPair[] };

function PairThumb({ dataUrl, label }: { dataUrl: string; label: string }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="flex size-12 items-center justify-center overflow-hidden rounded-md border bg-background">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`${label} preview`}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-muted-foreground font-mono text-[10px]">—</span>
        )}
      </span>
      <span className="text-muted-foreground font-mono text-[10px]">
        {label}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DatasetExplorerPage() {
  const [pairsState, setPairsState] = useState<PairsState>({
    status: "loading",
  });

  const generatePairs = useCallback(() => {
    setPairsState({ status: "loading" });
    try {
      const pairs = generateAllDemoPairs();
      setPairsState({ status: "ready", pairs });
    } catch (error) {
      setPairsState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Demo pair generation failed in this browser.",
      });
    }
  }, []);

  useEffect(() => {
    generatePairs();
  }, [generatePairs]);

  const sensorColumns: DataTableColumn<SensorProfile>[] = [
    {
      header: "Sensor",
      cell: (sensor) => (
        <span className="font-mono text-xs font-semibold">{sensor.sensor}</span>
      ),
    },
    {
      header: "Source Mission",
      cell: (sensor) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{sensor.mission}</span>
          <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
            {sensor.agency}
          </span>
        </div>
      ),
    },
    {
      header: "Resolution",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (sensor) => sensor.resolution,
    },
    {
      header: "Spectral Band",
      cell: (sensor) => (
        <span className="font-mono text-xs">{sensor.spectralBand}</span>
      ),
    },
    {
      header: "Swath",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (sensor) => sensor.swath,
    },
    {
      header: "Integration",
      cell: () => <PrototypeStatusBadge status="pending" />,
    },
  ];

  const pairColumns: DataTableColumn<DemoPair>[] = [
    {
      header: "Pair",
      cell: (pair) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display truncate text-sm font-medium">
            {pair.metadata.name}
          </span>
          <span className="text-muted-foreground font-mono text-[11px]">
            {pair.metadata.id}
          </span>
        </div>
      ),
    },
    {
      header: "Sensor",
      cell: (pair) => (
        <span className="font-mono text-xs font-semibold">
          {pair.metadata.sensor}
        </span>
      ),
    },
    {
      header: "Sun Azimuth",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (pair) => `${pair.metadata.sunAzimuthDeg}°`,
    },
    {
      header: "Sun Elevation",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (pair) => `${pair.metadata.sunElevationDeg}°`,
    },
    {
      header: "Scale Ratio",
      cellClassName: "text-right font-mono text-xs tabular-nums",
      cell: (pair) => pair.metadata.scaleRatio.toFixed(2),
    },
    {
      header: "Source / Reference",
      cell: (pair) => (
        <div className="flex items-center gap-2">
          <PairThumb dataUrl={pair.sourceDataUrl} label="Source" />
          <PairThumb dataUrl={pair.referenceDataUrl} label="Reference" />
        </div>
      ),
    },
    {
      header: "Origin",
      cell: () => <DataOriginBadge origin="demo" />,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        data-ocid="page.hero"
        className="bg-grid scanline relative overflow-hidden rounded-2xl border bg-card p-6 shadow-subtle md:p-8"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-primary flex size-10 items-center justify-center rounded-lg text-primary-foreground">
              <Database className="size-5" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Data Catalog · Lunar Imagery
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Dataset <span className="text-gradient-gold">Explorer</span>
          </h1>

          <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed md:text-base">
            Catalog of supported lunar sensors and the bundled DEMO/SAMPLE pairs
            available for in-browser registration. Official Chandrayaan-2, LRO
            NAC and SELENE dataset access is prepared behind a modular
            integration layer and is not yet connected.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <DataOriginBadge origin="demo" />
            <PrototypeStatusBadge status="pending" />
            <span className="text-muted-foreground font-mono text-[11px]">
              Official dataset connectivity: Prototype/Integration Pending
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Official connectivity note                                          */}
      {/* ------------------------------------------------------------------ */}
      <SectionCard
        title="Official Dataset Connectivity"
        description="Planned future integration — not currently connected"
        action={<PrototypeStatusBadge status="pending" />}
      >
        <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-warning/40 bg-warning/10 text-warning">
              <Wrench className="size-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-medium">
                Official dataset access is a planned future integration
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Live connectivity to Chandrayaan-2 OHRC, TMC-2 and IIRS, LRO NAC
                and SELENE data is not currently connected. The catalog below
                lists reference instrument characteristics for the planned
                modular integration layer. Every image processed in this
                workbench today is bundled DEMO/SAMPLE DATA or a user upload —
                never official mission data.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ------------------------------------------------------------------ */}
      {/* Supported sensors                                                   */}
      {/* ------------------------------------------------------------------ */}
      <SectionCard
        title="Supported Sensors"
        description="Reference instrument characteristics for the planned modular integration layer — no live mission data is connected"
      >
        <DataTable
          data-ocid="sensors.table"
          columns={sensorColumns}
          data={SENSOR_PROFILES}
          rowKey={(sensor) => sensor.sensor}
        />
        <p className="text-muted-foreground mt-3 font-mono text-[11px]">
          Characteristics compiled from public instrument documentation. Each
          sensor is Prototype/Integration Pending — official data access is not
          connected.
        </p>
      </SectionCard>

      {/* ------------------------------------------------------------------ */}
      {/* Bundled DEMO pairs                                                  */}
      {/* ------------------------------------------------------------------ */}
      <SectionCard
        title="Bundled DEMO/SAMPLE Pairs"
        description="Synthetic lunar-like pairs bundled in-browser for the registration pipeline — never official mission imagery"
      >
        {pairsState.status === "loading" ? (
          <LoadingState label="Generating DEMO/SAMPLE pairs…" rows={3} />
        ) : pairsState.status === "error" ? (
          <ErrorState
            title="Unable to generate demo pairs"
            message={pairsState.message}
            onRetry={() => generatePairs()}
          />
        ) : pairsState.pairs.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No DEMO/SAMPLE pairs available"
            description="The bundled demo pair catalog is empty. Rebuild the app or check the demo data module."
          />
        ) : (
          <DataTable
            data-ocid="demo_pairs.table"
            columns={pairColumns}
            data={pairsState.pairs}
            rowKey={(pair) => pair.metadata.id}
          />
        )}
      </SectionCard>

      {/* ------------------------------------------------------------------ */}
      {/* Prototype status                                                    */}
      {/* ------------------------------------------------------------------ */}
      <SectionCard
        title="Prototype Status"
        description="What is functional in-browser today vs. planned for future scientific/backend integration"
      >
        <ul data-ocid="prototype_status.list" className="flex flex-col gap-3">
          {CAPABILITY_STATUS.map((capability, index) => (
            <li
              key={capability.name}
              data-ocid={`prototype_status.item.${index}`}
              className="flex flex-col gap-1.5 rounded-lg border bg-background px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  {capability.status === "functional" ? (
                    <Cpu
                      className="text-primary size-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Wrench
                      className="text-warning size-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="font-display truncate text-sm font-medium">
                    {capability.name}
                  </span>
                </span>
                <PrototypeStatusBadge status={capability.status} />
              </div>
              <p className="text-muted-foreground text-xs">
                {capability.description}
              </p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
