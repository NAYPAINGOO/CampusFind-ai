import { describe, expect, it } from "vitest";
import { categories, locations } from "@/lib/demo-data";
import { parseTelegramLostFoundPost } from "@/lib/telegram-import";

describe("Telegram post importer", () => {
  it("extracts common structured fields from an English post", () => {
    const result = parseTelegramLostFoundPost(`LOST ITEM\nItem: Black Lenovo laptop bag\nColour: Black\nLocation: Main Library\nDate: 17/07/2026\nTime: 14:30`, categories, locations);
    expect(result.values.reportType).toBe("lost");
    expect(result.values.category).toBe("Backpack");
    expect(result.values.primaryColour).toBe("Black");
    expect(result.values.location).toBe("Main Library");
    expect(result.values.incidentDate).toBe("2026-07-17");
    expect(result.values.approximateTime).toBe("14:30");
  });

  it("recognises common Malay lost-and-found wording", () => {
    const result = parseTelegramLostFoundPost("Barang dijumpai: dompet warna biru di Cafeteria hari ini", categories, locations);
    expect(result.values.reportType).toBe("found");
    expect(result.values.category).toBe("Wallet");
    expect(result.values.primaryColour).toBe("Blue");
    expect(result.values.location).toBe("Cafeteria");
  });
});

it("removes contact details from imported public text", () => {
  const result = parseTelegramLostFoundPost("Lost black wallet at Main Library. Contact 012-3456789 or user@example.edu", categories, locations);
  expect(result.values.description).not.toContain("012-3456789");
  expect(result.values.description).not.toContain("user@example.edu");
});
