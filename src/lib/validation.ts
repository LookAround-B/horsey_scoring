import { z } from "zod";
import { NextResponse } from "next/server";
import { ASSIGNABLE_ROLES, type UserRole } from "@/lib/roles";

// ── Primitives ────────────────────────────────────────────────────────────────

const SAFE_URL_PROTOCOLS = ["http:", "https:"];

/** Accepts only http/https URLs. Rejects javascript:, data:, vbscript:, etc. */
export const safeUrl = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true; // allow empty (use .min(1) to require)
      try {
        const u = new URL(val);
        return SAFE_URL_PROTOCOLS.includes(u.protocol);
      } catch {
        return false;
      }
    },
    { message: "Must be a valid http or https URL." }
  );

/** Sanitize at render: returns the URL string only if http/https, else undefined. */
export function sanitizeImageSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return SAFE_URL_PROTOCOLS.includes(u.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

export const roleSchema = z.enum(
  ASSIGNABLE_ROLES as [UserRole, ...UserRole[]]
);

export const disciplineSchema = z.enum(["dressage", "showjumping"]);

// ── Request body size guard ───────────────────────────────────────────────────

const DEFAULT_MAX_BYTES = 256 * 1024; // 256 KB

/**
 * Reads and parses a request body as JSON, rejecting with HTTP 413 if the
 * raw body exceeds maxBytes.
 */
export async function readJsonLimited(
  request: Request,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<{ data: unknown } | NextResponse> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  const buf = await request.arrayBuffer();
  if (buf.byteLength > maxBytes) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  try {
    const data = JSON.parse(new TextDecoder().decode(buf));
    return { data };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
}

// ── Parse helpers ─────────────────────────────────────────────────────────────

/** For API routes: returns a NextResponse(400) on failure, else the parsed data. */
export function parseOr400<T>(
  schema: z.ZodType<T>,
  data: unknown
): { parsed: T } | NextResponse {
  const result = schema.safeParse(data);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }
  return { parsed: result.data };
}

/** For server actions: returns `{ error }` on failure, else `{ parsed }`. */
export function parseAction<T>(
  schema: z.ZodType<T>,
  data: unknown
): { parsed: T; error?: never } | { error: string; parsed?: never } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("; ") };
  }
  return { parsed: result.data };
}

// ── Domain schemas ────────────────────────────────────────────────────────────

export const scoreGetSchema = z.object({
  event: z.string().min(1, "event is required"),
  slug: z.string().min(1, "slug is required"),
  rider: z.string().optional(),
});

export const scoreSubmitSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  slug: z.string().min(1, "slug is required"),
  riderId: z.string().nullable().optional(),
  data: z.record(z.unknown()).default({}),
  status: z.enum(["draft", "submitted", "verified"]).optional(),
  result: z.number().nullable().optional(),
  signature: z.string().max(500).nullable().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  phone: z.string().trim().max(30).optional().default(""),
  image_url: safeUrl.optional().default(""),
  signature: z.string().trim().max(500).optional().default(""),
});

export const createUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  name: z.string().trim().min(1, "Name is required."),
  role: roleSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const eventMetaSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(1, "Event name is required.").max(200),
  location: z.string().trim().max(300).optional().default(""),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  guidelines: z.string().max(10_000).optional().nullable(),
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
});

export const createEventSchema = z.object({
  name: z.string().trim().min(1, "Event name is required.").max(200),
  location: z.string().trim().max(300).optional().default(""),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  guidelines: z.string().max(10_000).optional().nullable(),
  secretaryId: z.string().optional().default(""),
});

export const addRiderSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(1, "Rider name is required.").max(200),
  nf: z.string().trim().max(10).optional().default(""),
  competitorNo: z.string().trim().max(20).optional().default(""),
  horse: z.string().trim().max(200).optional().default(""),
  horseNo: z.string().trim().max(20).optional().default(""),
  imageUrl: safeUrl.optional().default(""),
});

export const joinCodeSchema = z.object({
  code: z.string().trim().min(1, "Enter an event code.").max(50),
});

export const approveSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
});

export const rejectSchema = z.object({
  userId: z.string().min(1),
});

const movementSchema = z.object({
  no: z.string().max(20).optional().default(""),
  letters: z.string().max(20).optional().default(""),
  test: z.string().min(1).max(1000),
  directive: z.string().max(500).optional().default(""),
  coefficient: z.number().positive().optional().default(1),
});

const obstacleSchema = z.object({
  name: z.string().min(1).max(100),
  parts: z.number().int().min(1).max(20).optional(),
});

const criterionSchema = z.object({
  title: z.string().min(1).max(200),
  max: z.number().positive().optional(),
});

export const dressageSheetSchema = z.object({
  label: z.string().trim().min(1, "Sheet name is required.").max(200),
  appendix: z.string().max(500).optional().default(""),
  subtitle: z.string().max(200).optional().default(""),
  movements: z.array(movementSchema).min(1, "Add at least one movement row.").max(100),
});

export const showJumpingSheetSchema = z.object({
  label: z.string().trim().min(1, "Sheet name is required.").max(200),
  subtitle: z.string().max(200).optional().default(""),
  obstacles: z.array(obstacleSchema).min(1, "Add at least one obstacle column.").max(50),
  defaultRows: z.number().int().min(1).max(60).optional().default(5),
});

export const qualitySheetSchema = z.object({
  label: z.string().trim().min(1, "Sheet name is required.").max(200),
  criteria: z
    .array(criterionSchema)
    .min(1, "Add at least one assessment row.")
    .max(50),
});

export const guidelineTemplateSchema = z.object({
  title: z.string().trim().min(1, "Give the template a title.").max(200),
  body: z.string().trim().min(1, "Guidelines are empty.").max(10_000),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/, "Invalid slug format."),
});
