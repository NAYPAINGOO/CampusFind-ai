import { createClient } from "@/lib/supabase/server";
import type { ReportFormValues } from "@/lib/schemas";
import { hashSecret } from "@/lib/security";
import { recentReports } from "@/lib/demo-data";
import type { ItemReport, ReportStatus, ReportType } from "@/types/domain";

export class DuplicateReportError extends Error {
  constructor(public readonly reportId: string) {
    super("A very similar active report already exists in your account.");
    this.name = "DuplicateReportError";
  }
}

export interface PublicReportFilters {
  q?: string;
  type?: ReportType | "";
  category?: string;
  location?: string;
  from?: string;
  to?: string;
}

type PublicReportRow = {
  id: string;
  report_type: ReportType;
  title: string;
  category_name: string;
  brand: string | null;
  model: string | null;
  primary_colour: string;
  public_description: string;
  incident_date: string;
  location_name: string;
  status: ReportStatus;
  created_at: string;
  public_image_enabled: boolean;
};

function mapPublicReport(row: PublicReportRow): ItemReport {
  return {
    id: row.id,
    reportType: row.report_type,
    title: row.title,
    category: row.category_name,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    primaryColour: row.primary_colour,
    description: row.public_description,
    incidentDate: row.incident_date,
    location: row.location_name,
    status: row.status,
    imageUrl: row.public_image_enabled ? `/api/reports/${row.id}/image` : undefined,
    createdAt: row.created_at
  };
}

function cleanSearch(value: string): string {
  return value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function listPublicReports(filters: PublicReportFilters = {}): Promise<ItemReport[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const q = filters.q?.trim().toLowerCase() ?? "";
    return recentReports.filter((report) => {
      const searchable = `${report.title} ${report.category} ${report.brand ?? ""} ${report.model ?? ""} ${report.primaryColour} ${report.location} ${report.description}`.toLowerCase();
      return (!q || searchable.includes(q))
        && (!filters.type || report.reportType === filters.type)
        && (!filters.category || report.category === filters.category)
        && (!filters.location || report.location === filters.location)
        && (!filters.from || report.incidentDate >= filters.from)
        && (!filters.to || report.incidentDate <= filters.to);
    });
  }

  const supabase = await createClient();
  let query = supabase
    .from("public_item_reports")
    .select("id,report_type,title,category_name,brand,model,primary_colour,public_description,incident_date,location_name,status,created_at,public_image_enabled")
    .order("created_at", { ascending: false })
    .limit(100);

  const search = filters.q ? cleanSearch(filters.q) : "";
  if (search) {
    query = query.or(`title.ilike.%${search}%,category_name.ilike.%${search}%,brand.ilike.%${search}%,primary_colour.ilike.%${search}%,location_name.ilike.%${search}%`);
  }
  if (filters.type) query = query.eq("report_type", filters.type);
  if (filters.category) query = query.eq("category_name", filters.category);
  if (filters.location) query = query.eq("location_name", filters.location);
  if (filters.from) query = query.gte("incident_date", filters.from);
  if (filters.to) query = query.lte("incident_date", filters.to);

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load public reports: ${error.message}`);
  return ((data ?? []) as PublicReportRow[]).map(mapPublicReport);
}

export async function getPublicReport(id: string): Promise<ItemReport | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return recentReports.find((report) => report.id === id) ?? null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_item_reports")
    .select("id,report_type,title,category_name,brand,model,primary_colour,public_description,incident_date,location_name,status,created_at,public_image_enabled")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load the report: ${error.message}`);
  return data ? mapPublicReport(data as PublicReportRow) : null;
}

export async function createReport(userId: string, values: ReportFormValues) {
  const supabase = await createClient();

  const [{ data: category }, { data: location }] = await Promise.all([
    supabase.from("item_categories").select("id").eq("name", values.category).eq("is_active", true).single(),
    supabase.from("campus_locations").select("id").eq("name", values.location).eq("is_active", true).single()
  ]);

  if (!category?.id || !location?.id) {
    throw new Error("The selected category or location is unavailable.");
  }

  const { data: duplicate } = await supabase
    .from("item_reports")
    .select("id")
    .eq("user_id", userId)
    .eq("report_type", values.reportType)
    .eq("category_id", category.id)
    .eq("location_id", location.id)
    .eq("incident_date", values.incidentDate)
    .ilike("title", values.title)
    .in("status", ["active", "possible_match_found", "claim_submitted", "under_review", "awaiting_collection"])
    .limit(1)
    .maybeSingle();

  if (duplicate?.id) throw new DuplicateReportError(duplicate.id);

  const { data, error } = await supabase
    .from("item_reports")
    .insert({
      user_id: userId,
      report_type: values.reportType,
      title: values.title,
      category_id: category.id,
      subcategory: values.subcategory || null,
      brand: values.brand || null,
      model: values.model || null,
      primary_colour: values.primaryColour,
      secondary_colour: values.secondaryColour || null,
      description: values.description,
      unique_features: values.uniqueFeatures,
      incident_date: values.incidentDate,
      approximate_time: values.approximateTime || null,
      location_id: location.id,
      specific_area: values.specificArea,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
      status: "active",
      contact_preference: values.contactPreference,
      contains_sensitive_information: values.containsSensitiveInformation,
      public_image_consent: values.publicImageConsent,
      verification_question: values.verificationQuestion,
      verification_answer_hash: hashSecret(values.verificationAnswer),
      privacy_consent_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
