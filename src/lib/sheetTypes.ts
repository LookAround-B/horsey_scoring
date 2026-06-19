// Client-safe sheet type definitions (no server/DB imports), shared by the
// scoring page, the builders, and the server data layer.

export type ShowJumpingConfig = {
  kind: "showjumping";
  label: string;
  subtitle: string;
  obstacleCount: number; // number of obstacle columns
  defaultRows: number; // rider rows shown initially
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
