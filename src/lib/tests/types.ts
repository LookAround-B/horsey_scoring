export type Movement = {
  no: string;
  letters: string;
  test: string;
  coefficient: number;
  directive: string;
};

export type CollectiveCriteria = {
  no: string;
  label: string;
  coefficient: number;
};

export type CourseError = { label: string; value: number };

export type TestConfig = {
  label: string;
  appendix: string;
  abbr: string;
  subtitle: string;
  movements: Movement[];
  hasCollective?: boolean;
  nfLabel?: string;
  showHno?: boolean;
  collectives?: CollectiveCriteria[];
  /** When true the scoring page shows a Technical Score % input and
   *  computes the final as (technical + quality) / 2. */
  technicalCombined?: boolean;
  /** Percentage points deducted per "other error / technical fault". Defaults to 2. */
  otherErrorPenalty?: number;
  /** Artistic movements for freestyle tests. When present, page shows two sections
   *  and final % = (technical% + artistic%) / 2. */
  artisticMovements?: Movement[];
  /** Override the default course-error buttons. */
  courseErrors?: CourseError[];
};
