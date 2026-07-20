import { describe, expect, it } from "vitest";
import { reportSchema } from "@/lib/schemas";

const valid = {
  reportType: "lost",
  title: "Black Lenovo backpack",
  category: "Backpack",
  subcategory: "Laptop backpack",
  brand: "Lenovo",
  model: "",
  primaryColour: "Black",
  secondaryColour: "Blue",
  description: "A black laptop backpack with a blue zipper tag and two front pockets.",
  uniqueFeatures: "Private mark inside the front pocket.",
  incidentDate: "2026-07-12",
  approximateTime: "12:30",
  location: "Main Library",
  specificArea: "Second floor",
  contactPreference: "in_app",
  containsSensitiveInformation: false,
  verificationQuestion: "What is written inside the bag?",
  verificationAnswer: "Private answer",
  consent: true
};

describe("report validation", () => {
  it("accepts a complete report", () => {
    expect(reportSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects descriptions that are too short", () => {
    expect(reportSchema.safeParse({ ...valid, description: "Too short" }).success).toBe(false);
  });

  it("requires privacy consent", () => {
    expect(reportSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("enables the public cover image by default while allowing opt-out", () => {
    const defaultResult = reportSchema.safeParse(valid);
    const privateResult = reportSchema.safeParse({ ...valid, publicImageConsent: false });
    expect(defaultResult.success).toBe(true);
    expect(privateResult.success).toBe(true);
    if (defaultResult.success && privateResult.success) {
      expect(defaultResult.data.publicImageConsent).toBe(true);
      expect(privateResult.data.publicImageConsent).toBe(false);
    }
  });
});

it("does not coerce blank coordinates to zero", () => {
  const result = reportSchema.safeParse({ ...valid, latitude: "", longitude: "" });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.latitude).toBeUndefined();
    expect(result.data.longitude).toBeUndefined();
  }
});

it("rejects incident dates in the future", () => {
  expect(reportSchema.safeParse({ ...valid, incidentDate: "2099-01-01" }).success).toBe(false);
});
