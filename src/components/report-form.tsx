/* eslint-disable @next/next/no-img-element */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, MessageCircleMore, RotateCcw, Save, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { categories, locations } from "@/lib/demo-data";
import { reportSchema, type ReportFormInput, type ReportFormValues } from "@/lib/schemas";
import { parseTelegramLostFoundPost } from "@/lib/telegram-import";
import { createClient } from "@/lib/supabase/client";

type Props = { defaultType: "lost" | "found" };
const steps = ["Item details", "When and where", "Evidence", "Privacy and verification"];
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumImageBytes = 5 * 1024 * 1024;

function initialValues(defaultType: "lost" | "found"): ReportFormInput {
  return {
    reportType: defaultType,
    title: "",
    category: "",
    subcategory: "",
    brand: "",
    model: "",
    primaryColour: "",
    secondaryColour: "",
    description: "",
    uniqueFeatures: "",
    incidentDate: new Date().toISOString().slice(0, 10),
    approximateTime: "",
    location: "",
    specificArea: "",
    contactPreference: "in_app",
    containsSensitiveInformation: false,
    publicImageConsent: true,
    verificationQuestion: "What private detail proves ownership?",
    verificationAnswer: "",
    consent: false
  };
}

function safeFileName(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(-100) || "image";
}

export function ReportForm({ defaultType }: Props) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [telegramText, setTelegramText] = useState("");
  const [importNotes, setImportNotes] = useState<string[]>([]);

  const form = useForm<ReportFormInput, undefined, ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: initialValues(defaultType)
  });
  const watchedValues = useWatch({ control: form.control });
  const draftKey = `campusfind-draft-${defaultType}`;

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    setDraftAvailable(Boolean(localStorage.getItem(draftKey)));
  }, [draftKey]);

  useEffect(() => {
    if (!form.formState.isDirty || submitted) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(form.getValues()));
      setDraftAvailable(true);
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [watchedValues, draftKey, form, submitted]);

  const previewNames = useMemo(() => files.map((file) => `${file.name} (${Math.ceil(file.size / 1024)} KB)`), [files]);
  const qualityScore = useMemo(() => {
    const checks = [
      Boolean(watchedValues.title && watchedValues.title.length >= 3),
      Boolean(watchedValues.category),
      Boolean(watchedValues.primaryColour),
      Boolean(watchedValues.description && watchedValues.description.length >= 40),
      Boolean(watchedValues.uniqueFeatures && watchedValues.uniqueFeatures.length >= 10),
      Boolean(watchedValues.incidentDate),
      Boolean(watchedValues.location),
      Boolean(watchedValues.specificArea),
      files.length > 0
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [watchedValues, files.length]);

  function restoreDraft() {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<ReportFormInput>;
      form.reset({ ...initialValues(defaultType), ...parsed, reportType: parsed.reportType ?? defaultType });
      setDraftAvailable(false);
      setStatusMessage("Draft restored. Please review the date and privacy details before submitting.");
    } catch {
      localStorage.removeItem(draftKey);
      setDraftAvailable(false);
      setStatusMessage("The saved draft was damaged and has been removed.");
    }
  }

  function discardDraft() {
    localStorage.removeItem(draftKey);
    setDraftAvailable(false);
    setStatusMessage("Saved draft removed.");
  }

  function saveDraft() {
    localStorage.setItem(draftKey, JSON.stringify(form.getValues()));
    setDraftAvailable(true);
    setStatusMessage("Draft saved securely on this device.");
  }

  function importTelegramPost() {
    if (telegramText.trim().length < 10) {
      setImportNotes(["Paste the original Telegram post before importing."]);
      return;
    }
    const result = parseTelegramLostFoundPost(telegramText, categories, locations);
    form.reset({ ...form.getValues(), ...result.values, reportType: result.values.reportType ?? defaultType });
    setImportNotes(result.warnings);
    setStatusMessage("Telegram text imported. Review every field before continuing.");
  }

  function selectFiles(selected: File[]) {
    const limited = selected.slice(0, 5);
    const invalid = limited.find((file) => !acceptedImageTypes.has(file.type) || file.size > maximumImageBytes);
    if (selected.length > 5) {
      setFileError("Only the first five images were selected.");
    } else if (invalid) {
      setFileError(`${invalid.name} must be JPEG, PNG or WebP and no larger than 5 MB.`);
      return;
    } else {
      setFileError("");
    }
    setFiles(limited);
  }

  async function continueStep() {
    const fields: Array<Array<keyof ReportFormInput>> = [
      ["reportType", "title", "category", "primaryColour", "description", "uniqueFeatures"],
      ["incidentDate", "approximateTime", "location", "specificArea", "latitude", "longitude"],
      [],
      ["contactPreference", "containsSensitiveInformation", "publicImageConsent", "verificationQuestion", "verificationAnswer", "consent"]
    ];
    const valid = fields[step].length === 0 || await form.trigger(fields[step]);
    if (valid) setStep((value) => Math.min(value + 1, steps.length - 1));
    else setStatusMessage("Complete the highlighted fields before continuing.");
  }

  async function uploadImages(reportId: string): Promise<string[]> {
    if (files.length === 0 || !process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
    const warnings: string[] = [];
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return ["The report was created, but images could not be uploaded because the session expired."];

    for (const [index, file] of files.entries()) {
      const storagePath = `${authData.user.id}/${reportId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("report-images").upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) {
        warnings.push(`${file.name}: ${uploadError.message}`);
        continue;
      }
      const { error: metadataError } = await supabase.from("report_images").insert({
        report_id: reportId,
        image_url: storagePath,
        storage_path: storagePath,
        image_order: index,
        mime_type: file.type,
        size_bytes: file.size
      });
      if (metadataError) {
        await supabase.storage.from("report-images").remove([storagePath]);
        warnings.push(`${file.name}: image metadata could not be saved, so the incomplete upload was removed.`);
      }
    }
    return warnings;
  }

  async function submit(values: ReportFormValues) {
    setServerError("");
    setStatusMessage("");
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values)
    });
    const payload = await response.json() as { error?: string; report?: { id: string }; id?: string; mode?: string };
    if (!response.ok) {
      setServerError(payload.error ?? "Unable to submit the report.");
      return;
    }

    const reportId = payload.report?.id ?? payload.id;
    const warnings = reportId && payload.mode !== "demo" ? await uploadImages(reportId) : [];
    localStorage.removeItem(draftKey);
    setDraftAvailable(false);
    setSubmissionNote(warnings.length > 0 ? `The report was created, but some image uploads need attention: ${warnings.join(" ")}` : payload.mode === "demo" ? "This demonstration validates the workflow but does not save data to the university database." : "Automatic matching and saved-alert checks now run against eligible reports.");
    setSubmitted(true);
  }

  if (submitted) {
    return <div className="card mx-auto max-w-2xl p-8 text-center"><CheckCircle2 className="mx-auto text-green-600" size={52} /><h2 className="mt-4 text-2xl font-black">Report submitted</h2><p className="mt-3 muted">Your structured report is active. CampusFind will compare it with opposite-type reports and notify relevant users without exposing private ownership evidence.</p>{submissionNote && <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800">{submissionNote}</p>}<a className="btn-primary mt-6" href="/dashboard">Open dashboard</a></div>;
  }

  const input = (name: keyof ReportFormInput, label: string, type = "text", placeholder = "") => (
    <label><span className="label">{label}</span><input className="input" type={type} step={type === "number" ? "any" : undefined} placeholder={placeholder} {...form.register(name as never)} /><span className="mt-1 block text-xs text-red-600">{form.formState.errors[name]?.message as string | undefined}</span></label>
  );

  return (
    <form className="card mx-auto max-w-4xl overflow-hidden" onSubmit={form.handleSubmit(submit)}>
      <div className="border-b border-slate-200 p-5 dark:border-slate-700">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><strong>Report quality: {qualityScore}%</strong><p className="text-xs muted">More structured details produce faster, more accurate matches.</p></div><div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-blue-600 transition-all" style={{ width: `${qualityScore}%` }} /></div></div>
        <ol className="grid gap-2 sm:grid-cols-4" aria-label="Form progress">
          {steps.map((label, index) => <li key={label} className={`rounded-lg px-3 py-2 text-xs font-bold ${index === step ? "bg-blue-600 text-white" : index < step ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{index + 1}. {label}</li>)}
        </ol>
      </div>

      <div className="p-5 md:p-8">
        {draftAvailable && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-950 dark:bg-blue-950 dark:text-blue-100"><span><strong>Saved draft found.</strong> Restore it instead of retyping the details.</span><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={restoreDraft}><RotateCcw size={16} />Restore</button><button type="button" className="rounded-lg p-2" onClick={discardDraft} aria-label="Discard saved draft"><X size={18} /></button></div></div>}

        {step === 0 && <div className="space-y-5">
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setShowImporter((value) => !value)}><span className="flex items-center gap-3"><MessageCircleMore className="text-blue-600" /><span><strong className="block">Import an old Telegram post</strong><small className="muted">Convert an unstructured group message into searchable fields.</small></span></span><span className="font-bold text-blue-600">{showImporter ? "Hide" : "Open"}</span></button>
            {showImporter && <div className="mt-4"><label><span className="label">Paste Telegram message</span><textarea className="input min-h-36" value={telegramText} onChange={(event) => setTelegramText(event.target.value)} placeholder="Paste the lost-and-found message here. CampusFind will extract item, colour, location and date where possible." /></label><button type="button" className="btn-primary mt-3" onClick={importTelegramPost}><MessageCircleMore size={17} />Import fields</button>{importNotes.length > 0 && <ul className="mt-3 grid gap-1 text-sm text-amber-800 dark:text-amber-200">{importNotes.map((note) => <li key={note}>• {note}</li>)}</ul>}</div>}
          </section>
          <div className="grid gap-5 md:grid-cols-2">
            <label><span className="label">Report type</span><select className="input" {...form.register("reportType")}><option value="lost">Lost item</option><option value="found">Found item</option></select></label>
            {input("title", "Item title", "text", "e.g. Black Lenovo backpack")}
            <label><span className="label">Category</span><select className="input" {...form.register("category")}><option value="">Choose category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><span className="mt-1 block text-xs text-red-600">{form.formState.errors.category?.message}</span></label>
            {input("subcategory", "Subcategory")}
            {input("brand", "Brand")}
            {input("model", "Model")}
            {input("primaryColour", "Main colour")}
            {input("secondaryColour", "Secondary colour")}
            <label className="md:col-span-2"><span className="label">Detailed description</span><textarea className="input min-h-32" {...form.register("description")} /><span className="mt-1 block text-xs text-red-600">{form.formState.errors.description?.message}</span></label>
            <label className="md:col-span-2"><span className="label">Unique visible features</span><textarea className="input min-h-24" {...form.register("uniqueFeatures")} /><span className="mt-1 block text-xs text-red-600">{form.formState.errors.uniqueFeatures?.message}</span><small className="mt-1 block muted">Do not publish the private answer that only the owner should know.</small></label>
          </div>
        </div>}

        {step === 1 && <div className="grid gap-5 md:grid-cols-2">
          {input("incidentDate", watchedValues.reportType === "found" ? "Date found" : "Date lost", "date")}
          {input("approximateTime", "Approximate time", "time")}
          <label><span className="label">Campus location</span><select className="input" {...form.register("location")}><option value="">Choose location</option>{locations.map((item) => <option key={item}>{item}</option>)}</select><span className="mt-1 block text-xs text-red-600">{form.formState.errors.location?.message}</span></label>
          {input("specificArea", "Approximate area", "text", "e.g. second-floor corridor")}
          {input("latitude", "Latitude (optional)", "number")}
          {input("longitude", "Longitude (optional)", "number")}
          {watchedValues.reportType === "found" && <p className="md:col-span-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Do not enter a public storage location here. Exact storage details are managed by authorised security staff after submission.</p>}
        </div>}

        {step === 2 && <div className="space-y-5">
          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700"><ImagePlus className="mx-auto text-blue-600" /><span className="mt-3 block font-bold">Add up to five images</span><span className="mt-1 block text-sm muted">JPEG, PNG or WebP, maximum 5 MB each. The first image becomes the report cover when public-image consent is enabled.</span><input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFiles(Array.from(event.target.files ?? []))} /></label>
          {fileError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{fileError}</p>}
          {previewNames.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{previewNames.map((name, index) => <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" key={`${name}-${index}`}><div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-900">{previewUrls[index] && <img src={previewUrls[index]} alt={`Preview ${index + 1}: ${files[index]?.name ?? "selected item"}`} className="h-full w-full object-cover" />}{index === 0 && <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">Cover image</span>}<button type="button" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white" aria-label={`Remove ${name}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={16} /></button></div><figcaption className="truncate px-3 py-2 text-xs" title={name}>{name}</figcaption></figure>)}</div>}
          <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800"><ShieldCheck className="mt-0.5 text-green-600" size={20} /><p>Use clear images, but cover visible student numbers, bank-card details, addresses and QR codes before uploading. Reports marked sensitive never expose an image publicly.</p></div>
        </div>}

        {step === 3 && <div className="grid gap-5 md:grid-cols-2">
          <label><span className="label">Contact preference</span><select className="input" {...form.register("contactPreference")}><option value="in_app">In-app notification</option><option value="email">Email and in-app</option></select></label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><input type="checkbox" {...form.register("containsSensitiveInformation")} /><span><strong>Contains sensitive information</strong><small className="block muted">Examples: identity documents or financial cards. Public images are automatically blocked.</small></span></label>
          <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><input className="mt-1" type="checkbox" {...form.register("publicImageConsent")} /><span><strong>Display my first uploaded image on the public report</strong><small className="mt-1 block muted">The original file remains in private storage and is served through a protected image endpoint. Uncheck this to show only the category icon.</small></span></label>
          {input("verificationQuestion", "Private verification question")}
          {input("verificationAnswer", "Private verification answer", "password")}
          <label className="md:col-span-2 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-950 dark:bg-blue-950 dark:text-blue-100"><input className="mt-1" type="checkbox" {...form.register("consent")} /><span>I confirm the information is accurate and consent to processing it for lost-and-found matching and secure item recovery.</span></label>
          <span className="md:col-span-2 text-xs text-red-600">{form.formState.errors.consent?.message}</span>
        </div>}

        {statusMessage && <p role="status" className="mt-5 rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-800">{statusMessage}</p>}
        {serverError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{serverError}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5 dark:border-slate-700">
        <button className="btn-secondary" type="button" onClick={saveDraft}><Save size={17} />Save draft</button>
        <div className="flex gap-2">
          {step > 0 && <button className="btn-secondary" type="button" onClick={() => setStep((value) => value - 1)}><ChevronLeft size={17} />Back</button>}
          {step < steps.length - 1 ? <button className="btn-primary" type="button" onClick={() => void continueStep()}>Continue<ChevronRight size={17} /></button> : <button className="btn-primary" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Submitting…" : "Submit report"}</button>}
        </div>
      </div>
    </form>
  );
}
