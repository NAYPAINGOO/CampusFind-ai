import { z } from "zod";

const optionalText = z.string().trim().max(120).optional().or(z.literal(""));
const optionalCoordinate = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(minimum).max(maximum).optional()
  );

export const reportSchema = z.object({
  reportType: z.enum(["lost", "found"]),
  title: z.string().trim().min(3, "Enter a clear item title.").max(120),
  category: z.string().trim().min(1, "Choose a category."),
  subcategory: optionalText,
  brand: optionalText,
  model: optionalText,
  primaryColour: z.string().trim().min(2, "Enter the main colour.").max(50),
  secondaryColour: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().trim().min(20, "Provide at least 20 characters.").max(2000),
  uniqueFeatures: z.string().trim().min(5, "Add at least one identifying feature.").max(1000),
  incidentDate: z.string().date().refine((value) => value <= new Date().toISOString().slice(0, 10), {
    message: "The incident date cannot be in the future."
  }),
  approximateTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time.").optional().or(z.literal("")),
  location: z.string().trim().min(1, "Choose a location."),
  specificArea: z.string().trim().min(2, "Enter an approximate area.").max(150),
  latitude: optionalCoordinate(-90, 90),
  longitude: optionalCoordinate(-180, 180),
  contactPreference: z.enum(["in_app", "email"]),
  containsSensitiveInformation: z.boolean(),
  publicImageConsent: z.boolean().default(true),
  verificationQuestion: z.string().trim().min(8).max(250),
  verificationAnswer: z.string().trim().min(2).max(250),
  consent: z.boolean().refine((value) => value, { message: "Consent is required." })
});

export const claimSchema = z.object({
  matchId: z.string().uuid(),
  ownershipExplanation: z.string().trim().min(30).max(2000),
  identifyingFeatures: z.string().trim().min(10).max(1000),
  verificationAnswer: z.string().trim().min(2).max(250),
  evidenceUrl: z.string().url().optional().or(z.literal(""))
});

const score = z.coerce.number().finite().min(0).max(100);
export const matchInputSchema = z.object({
  imageSimilarity: score,
  textSimilarity: score,
  categoryMatch: score,
  colourSimilarity: score,
  brandSimilarity: score,
  locationSimilarity: score,
  dateSimilarity: score
});

export const searchAlertSchema = z.object({
  keywords: z.string().trim().max(100).optional().or(z.literal("")),
  reportType: z.enum(["lost", "found"]).optional().or(z.literal("")),
  category: z.string().trim().max(120).optional().or(z.literal("")),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  emailEnabled: z.boolean().default(false)
}).refine((value) => Boolean(value.keywords || value.reportType || value.category || value.location), {
  message: "Choose at least one alert condition."
});

export const handoverCreateSchema = z.object({
  claimId: z.string().uuid(),
  expiresAt: z.string().datetime().refine((value) => {
    const timestamp = new Date(value).getTime();
    const now = Date.now();
    return timestamp > now && timestamp <= now + 30 * 24 * 60 * 60 * 1000;
  }, "Expiry must be within the next 30 days.")
});

export const handoverVerifySchema = z.object({
  code: z.string().trim().min(6).max(5000)
});

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export type ReportFormInput = z.input<typeof reportSchema>;
export type ReportFormValues = z.output<typeof reportSchema>;
export type ClaimFormValues = z.infer<typeof claimSchema>;
export type SearchAlertValues = z.infer<typeof searchAlertSchema>;
