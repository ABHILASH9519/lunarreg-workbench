# Design Brief

## Direction
LunarReg Workbench — a dark lunar space-mission scientific platform for image registration & correspondence analysis, styled like a mission-control telemetry console.

## Tone
Deep-space mission control: precise, restrained, technical — lunar grays on near-black with cyan data accents and sparing lunar-gold highlights; everything instrumented, nothing decorative.

## Differentiation
Monospace telemetry readouts (RMSE, inliers/outliers) with a live scanline sweeping image pairs make every analysis read as an active mission instrument, not a web app.

## Color Palette
| Token      | OKLCH          | Role                                        |
| ---------- | -------------- | ------------------------------------------- |
| background | 0.13 0.012 260 | deep space black                            |
| foreground | 0.95 0.012 260 | lunar white text                            |
| card       | 0.165 0.014 260| elevated surface panel                      |
| primary    | 0.72 0.13 190  | scientific cyan — data & primary actions    |
| accent     | 0.78 0.14 75   | lunar gold — highlights, active states      |
| muted      | 0.21 0.015 260 | secondary surface                           |
| success    | 0.65 0.16 150  | inlier / valid metrics                      |
| warning    | 0.78 0.14 75   | caution / demo-data badges                  |
| destructive| 0.6 0.2 22     | outlier / error / abort                     |
| border     | 0.26 0.02 260  | hairline panel borders                      |

## Typography
- Display: Space Grotesk — headings, hero, wordmark
- Body: DM Sans — UI labels, paragraphs, table text
- Mono: Geist Mono — data values, telemetry, coordinates
- Scale: hero text-4xl md:text-6xl font-bold tracking-tight, h2 text-2xl md:text-3xl font-semibold tracking-tight, label text-xs font-semibold tracking-widest uppercase, body text-sm md:text-base

## Elevation & Depth
Layered surfaces on near-black: cards at bg-card with hairline border + shadow-subtle, floating panels shadow-elevated; depth via subtle grid texture and gradient-subtle, never glow.

## Structural Zones
| Zone     | Background        | Border        | Notes                                            |
| -------- | ----------------- | ------------- | ------------------------------------------------ |
| Header   | bg-card/80 blur   | border-b      | mission bar: wordmark, DEMO badge, LIVE status   |
| Sidebar  | bg-sidebar        | border-r      | nav rail, active item in cyan/gold               |
| Content  | bg-background     | —             | alternate bg-muted/30 sections, bg-grid overlays |
| Footer   | bg-muted/40       | border-t      | data-source & integrity note                     |

## Spacing & Rhythm
Section gaps p-6 md:p-8, card padding p-4 md:p-6, dense micro-spacing gap-2 in telemetry readouts; generous whitespace for projector legibility.

## Component Patterns
- Buttons: rounded-md, primary uses gradient-primary, hover brightness + shadow-subtle
- Cards: rounded-lg bg-card border-border shadow-subtle, elevated on hover
- Badges: rounded-full pill, mono text; cyan data, gold demo/sample, red outlier

## Motion
- Entrance: animate-fade-in-up 0.5s ease-out both on panels
- Hover: transition-smooth, subtle lift shadow-elevated
- Decorative: pulse-soft on LIVE/status dots; scan sweep over image panels

## Constraints
- Dark-only theme; AA+ contrast, no raw hex or arbitrary colors in components
- Scientific integrity: N/A or Prototype/Integration Pending where uncomputed
- DEMO/SAMPLE DATA and USER DATA labels always visible on demo/user content

## Signature Detail
The telemetry readout — tabular mono numerals with unit labels and a live scanline sweeping image pairs — turns every metric into a mission instrument readout.
