import {
  Document,
  type DocumentProps,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type {
  ClassifiedCorrespondence,
  JobMetrics,
  Matrix3x3,
  ReproConfig,
  TransformationModel,
} from "../types";

/**
 * Client-side PDF report generation for registration results.
 * Renders all important scientific and experimental results.
 */

export interface PdfReportData {
  title: string;
  subtitle: string;
  sourceName: string;
  referenceName: string;
  sensor: string;
  model: TransformationModel;
  matrix: Matrix3x3;
  metrics: JobMetrics;
  correspondences: ClassifiedCorrespondence[];
  registeredImageDataUrl: string | null;
  overlayImageDataUrl: string | null;
  differenceImageDataUrl: string | null;
  config: ReproConfig;
  issues: Array<{ level: string; message: string }>;
  generatedAt: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a2e",
  },
  header: {
    borderBottom: 2,
    borderBottomColor: "#0f766e",
    paddingBottom: 10,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  subtitle: { fontSize: 10, color: "#475569", marginTop: 4 },
  section: { marginTop: 14, marginBottom: 6 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f766e",
    marginBottom: 6,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 160, color: "#64748b" },
  value: { flex: 1, fontWeight: "bold", color: "#0f172a" },
  table: { marginTop: 4 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    fontWeight: "bold",
  },
  cell: { flex: 1, padding: 3 },
  image: { width: "100%", marginBottom: 8 },
  note: { fontSize: 8, color: "#94a3b8", marginTop: 8 },
  warning: { fontSize: 8, color: "#b45309", marginTop: 2 },
});

function fmt(v: number | null | undefined, digits = 4): string {
  return v === null || v === undefined ? "N/A" : v.toFixed(digits);
}

function fmtInt(v: bigint | number | null | undefined): string {
  if (v === null || v === undefined) return "N/A";
  return typeof v === "bigint" ? v.toString() : String(v);
}

/** Build the PDF report document. */
export function buildReportDocument(
  data: PdfReportData,
): ReactElement<DocumentProps> {
  const { metrics } = data;
  return (
    <Document title={data.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>
          <Text style={styles.subtitle}>
            Generated {data.generatedAt} — {data.sensor}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiment</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Source / Moving Image</Text>
            <Text style={styles.value}>{data.sourceName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference / Fixed Image</Text>
            <Text style={styles.value}>{data.referenceName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transformation Model</Text>
            <Text style={styles.value}>{data.model}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metrics</Text>
          <View style={styles.row}>
            <Text style={styles.label}>RMSE (px)</Text>
            <Text style={styles.value}>{fmt(metrics.rmse)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reprojection Error (px)</Text>
            <Text style={styles.value}>{fmt(metrics.reprojectionError)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Inliers / Outliers</Text>
            <Text style={styles.value}>
              {fmtInt(metrics.inlierCount)} / {fmtInt(metrics.outlierCount)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Spatial Coverage</Text>
            <Text style={styles.value}>{fmt(metrics.spatialCoverage, 3)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Scale</Text>
            <Text style={styles.value}>{fmt(metrics.scale, 4)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rotation (deg)</Text>
            <Text style={styles.value}>{fmt(metrics.rotationDegrees, 3)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transformation Matrix</Text>
          <Text style={styles.value}>
            {data.matrix.map((v) => v.toFixed(6)).join("  ")}
          </Text>
        </View>
        {data.registeredImageDataUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registered Output</Text>
            <Image src={data.registeredImageDataUrl} style={styles.image} />
          </View>
        )}
        {data.overlayImageDataUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overlay Composite</Text>
            <Image src={data.overlayImageDataUrl} style={styles.image} />
          </View>
        )}
        {data.differenceImageDataUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difference Image</Text>
            <Image src={data.differenceImageDataUrl} style={styles.image} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Correspondence Points</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.cell}>#</Text>
              <Text style={styles.cell}>Source X</Text>
              <Text style={styles.cell}>Source Y</Text>
              <Text style={styles.cell}>Ref X</Text>
              <Text style={styles.cell}>Ref Y</Text>
              <Text style={styles.cell}>Inlier</Text>
              <Text style={styles.cell}>Error (px)</Text>
            </View>
            {data.correspondences.slice(0, 50).map((c, i) => (
              <View
                key={`${c.source.x}-${c.source.y}-${c.reference.x}-${c.reference.y}`}
                style={styles.tableRow}
              >
                <Text style={styles.cell}>{i + 1}</Text>
                <Text style={styles.cell}>{c.source.x.toFixed(2)}</Text>
                <Text style={styles.cell}>{c.source.y.toFixed(2)}</Text>
                <Text style={styles.cell}>{c.reference.x.toFixed(2)}</Text>
                <Text style={styles.cell}>{c.reference.y.toFixed(2)}</Text>
                <Text style={styles.cell}>{c.inlier ? "Yes" : "No"}</Text>
                <Text style={styles.cell}>
                  {c.reprojectionError.toFixed(3)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.value}>
            Detector: {data.config.detector.detector} (max{" "}
            {fmtInt(data.config.detector.maxFeatures)} features,{" "}
            {fmtInt(data.config.detector.nLevels)} levels)
          </Text>
          <Text style={styles.value}>
            Matching: ratio {data.config.matching.ratioThreshold.toFixed(2)},{" "}
            cross-check {data.config.matching.crossCheck ? "on" : "off"}
          </Text>
          <Text style={styles.value}>
            RANSAC: reproj threshold{" "}
            {data.config.thresholds.ransacReprojThreshold.toFixed(1)} px, min
            inlier ratio {data.config.thresholds.minInlierRatio.toFixed(2)}
          </Text>
        </View>
        {data.issues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {data.issues.map((issue) => (
              <Text
                key={`${issue.level}-${issue.message}`}
                style={styles.warning}
              >
                [{issue.level.toUpperCase()}] {issue.message}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.note}>
          DEMO/SAMPLE DATA — results are computed in-browser on synthetic or
          user-uploaded imagery and are not official Chandrayaan-2/ISRO
          products.
        </Text>
      </Page>
    </Document>
  );
}

/** Render the report to a Blob for download. */
export async function generatePdfBlob(data: PdfReportData): Promise<Blob> {
  const doc = buildReportDocument(data);
  return pdf(doc).toBlob();
}

/** Download the PDF report. */
export async function downloadPdfReport(
  data: PdfReportData,
  filename: string,
): Promise<void> {
  const blob = await generatePdfBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
