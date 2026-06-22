// Client-safe sheet type definitions (no server/DB imports), shared by the
// scoring page, the builders, and the server data layer.

export type ObstacleColumn = {
  name: string;
  type: "" | "vertical" | "oxer" | "combination" | "water";
};

export type ShowJumpingConfig = {
  kind: "showjumping";
  label: string;
  subtitle: string;
  appendix: string;
  abbr: string;
  discipline: "showjumping";
  obstacles: ObstacleColumn[];
  riderRows: number;
  // Live dashboard fields (all optional — backward-compatible)
  firstRoundObstacles?: string[];  // obstacle labels for FR; defaults to obstacles[].name
  jumpoffObstacles?: string[];     // obstacle labels for JO; empty = no JO mode
  defaultSpeed?: number;           // m/min (editable in header)
  defaultCourseLength?: number;    // metres
  defaultTimeAllowed?: number;     // seconds (FR)
  defaultTimeLimit?: number;       // seconds (FR); defaults to TA × 2
  defaultJoTimeAllowed?: number;   // seconds (JO); defaults to FR TA
  timePenaltyRateFR?: number;      // seconds per 1 fault in FR (FEI Table A default = 4)
  timePenaltyRateJO?: number;      // seconds per 1 fault in JO (default = 1)
};

export function isShowJumping(config: unknown): config is ShowJumpingConfig {
  return (
    !!config &&
    typeof config === "object" &&
    (config as { kind?: unknown }).kind === "showjumping"
  );
}

export type QualityCriterion = { title: string; description: string };

export type QualityConfig = {
  kind: "quality";
  label: string;
  subtitle: string;
  criteria: QualityCriterion[];
};

export function isQuality(config: unknown): config is QualityConfig {
  return (
    !!config && typeof config === "object" && (config as { kind?: unknown }).kind === "quality"
  );
}
