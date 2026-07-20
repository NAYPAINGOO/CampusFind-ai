import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAXIMUM_IMAGE_BYTES = 5 * 1024 * 1024;

function notFound() {
  return NextResponse.json({ error: "Public report image not found." }, {
    status: 404,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id) || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return notFound();
  }

  const publicClient = await createClient();
  const { data: report, error: reportError } = await publicClient
    .from("public_item_reports")
    .select("id,public_image_enabled")
    .eq("id", id)
    .eq("public_image_enabled", true)
    .maybeSingle();

  if (reportError || !report?.public_image_enabled) return notFound();

  const admin = createAdminClient();
  const { data: image, error: imageError } = await admin
    .from("report_images")
    .select("storage_path,mime_type,size_bytes")
    .eq("report_id", id)
    .order("image_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (imageError || !image?.storage_path) return notFound();
  if (image.size_bytes && image.size_bytes > MAXIMUM_IMAGE_BYTES) return notFound();

  const { data: file, error: downloadError } = await admin.storage.from("report-images").download(image.storage_path);
  if (downloadError || !file || file.size > MAXIMUM_IMAGE_BYTES) return notFound();

  const contentType = image.mime_type || file.type;
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) return notFound();

  return new NextResponse(await file.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.size),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
