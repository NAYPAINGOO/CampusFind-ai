import type { ReportFormInput } from "@/lib/schemas";

export interface TelegramImportResult {
  values: Partial<ReportFormInput>;
  warnings: string[];
}

const colourAliases: Record<string, string[]> = {
  Black: ["black", "hitam"],
  White: ["white", "putih"],
  Blue: ["blue", "biru", "navy"],
  Red: ["red", "merah", "maroon"],
  Green: ["green", "hijau"],
  Yellow: ["yellow", "kuning"],
  Orange: ["orange", "oren"],
  Purple: ["purple", "ungu"],
  Pink: ["pink", "merah jambu"],
  Brown: ["brown", "coklat"],
  Grey: ["grey", "gray", "kelabu"],
  Silver: ["silver", "perak"],
  Gold: ["gold", "emas"],
  Beige: ["beige", "krim"]
};

const categoryAliases: Record<string, string[]> = {
  "Student ID card": ["student id", "matric card", "kad matrik", "id card", "access card"],
  Wallet: ["wallet", "purse", "dompet"],
  "Mobile phone": ["phone", "iphone", "android", "smartphone", "telefon", "handphone"],
  Laptop: ["laptop", "notebook", "macbook"],
  Tablet: ["tablet", "ipad"],
  Backpack: ["backpack", "school bag", "laptop bag", "beg", "bag"],
  Keys: ["keys", "keychain", "kunci"],
  Earphones: ["earphones", "earbuds", "airpods", "headphones"],
  Watch: ["watch", "smartwatch", "jam tangan"],
  "Water bottle": ["water bottle", "tumbler", "botol air"],
  Clothing: ["jacket", "shirt", "hoodie", "clothes", "baju"],
  Documents: ["document", "certificate", "file", "documents", "dokumen"]
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, phrase: string): boolean {
  return new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i").test(text);
}

function firstMatchingLine(lines: string[], keys: string[]): string | undefined {
  for (const line of lines) {
    const match = line.match(/^\s*([^:=-]+)\s*[:=-]\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    if (keys.some((candidate) => key.includes(candidate))) return match[2].trim();
  }
  return undefined;
}

function parseDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const direct = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (direct) return `${direct[1]}-${direct[2].padStart(2, "0")}-${direct[3].padStart(2, "0")}`;
  const local = value.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/);
  if (local) return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  const lowered = value.toLowerCase();
  const date = new Date();
  if (/\byesterday\b|\bsemalam\b/.test(lowered)) date.setDate(date.getDate() - 1);
  else if (!/\btoday\b|\bhari ini\b/.test(lowered)) return undefined;
  return date.toISOString().slice(0, 10);
}

function removePublicContactDetails(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, "[link removed]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?6?0)?1\d[-\s]?\d{3,4}[-\s]?\d{4}/g, "[phone removed]");
}

export function parseTelegramLostFoundPost(
  rawText: string,
  categories: readonly string[],
  locations: readonly string[]
): TelegramImportResult {
  const text = removePublicContactDetails(rawText).trim();
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).map((line) => line.replace(/^[-•*#\s]+/, "").trim()).filter(Boolean);
  const warnings: string[] = [];
  const values: Partial<ReportFormInput> = {};

  if (/\b(found|dijumpai|jumpa|terjumpa)\b/.test(lower)) values.reportType = "found";
  else if (/\b(lost|missing|hilang|tertinggal)\b/.test(lower)) values.reportType = "lost";

  const explicitItem = firstMatchingLine(lines, ["item", "barang", "object"]);
  const explicitBrand = firstMatchingLine(lines, ["brand", "jenama"]);
  const explicitColour = firstMatchingLine(lines, ["colour", "color", "warna"]);
  const explicitLocation = firstMatchingLine(lines, ["location", "lokasi", "place", "tempat"]);
  const explicitArea = firstMatchingLine(lines, ["area", "spot", "kawasan"]);
  const explicitDate = firstMatchingLine(lines, ["date", "tarikh"]);
  const explicitTime = firstMatchingLine(lines, ["time", "masa"]);

  const category = categories
    .flatMap((candidate) => (categoryAliases[candidate] ?? [candidate.toLowerCase()]).map((alias) => ({ candidate, alias })))
    .filter(({ alias }) => containsPhrase(lower, alias))
    .sort((left, right) => right.alias.length - left.alias.length)[0]?.candidate;
  if (category) values.category = category;

  const location = locations.find((candidate) => lower.includes(candidate.toLowerCase()));
  if (location) values.location = location;
  else if (explicitLocation) {
    const closeLocation = locations.find((candidate) => explicitLocation.toLowerCase().includes(candidate.toLowerCase()));
    if (closeLocation) values.location = closeLocation;
    else values.specificArea = explicitLocation.slice(0, 150);
  }

  const colourSource = explicitColour?.toLowerCase() ?? lower;
  const colour = Object.entries(colourAliases).find(([, aliases]) => aliases.some((alias) => containsPhrase(colourSource, alias)))?.[0];
  if (colour) values.primaryColour = colour;

  if (explicitBrand) values.brand = explicitBrand.slice(0, 120);
  if (explicitArea) values.specificArea = explicitArea.slice(0, 150);
  const date = parseDate(explicitDate ?? text);
  if (date) values.incidentDate = date;
  if (explicitTime) {
    const time = explicitTime.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time) values.approximateTime = `${time[1].padStart(2, "0")}:${time[2]}`;
  }

  const firstContentLine = lines.find((line) => !/^(lost|found|hilang|dijumpai)\b/i.test(line));
  const titleBase = explicitItem ?? firstContentLine ?? (category ? `${values.reportType === "found" ? "Found" : "Lost"} ${category}` : "Lost or found item");
  values.title = titleBase.replace(/^(item|barang)\s*[:=-]\s*/i, "").slice(0, 120);
  values.description = text.slice(0, 2000);

  if (!values.category) warnings.push("Category was not detected; please choose it manually.");
  if (!values.location) warnings.push("Campus location was not detected; please choose it manually.");
  if (!values.primaryColour) warnings.push("Main colour was not detected; please enter it manually.");
  if (!values.incidentDate) warnings.push("Date was not detected; please confirm the incident date.");
  warnings.push("Contact links, email addresses and Malaysian mobile numbers are removed automatically. Review the text for student IDs and private ownership clues.");

  return { values, warnings };
}
