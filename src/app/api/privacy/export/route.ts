import { deflateRawSync } from "node:zlib";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CsvRecord = Record<string, unknown>;

function csv(records: CsvRecord[], columns: string[]) {
  const quote = (value: unknown) => {
    let text = value === null || value === undefined
      ? ""
      : typeof value === "object" ? JSON.stringify(value) : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return `\uFEFF${[columns.map(quote).join(","), ...records.map((record) => columns.map((column) => quote(record[column])).join(","))].join("\r\n")}\r\n`;
}

function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; content: string }[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const source = Buffer.from(file.content, "utf8");
    const compressed = deflateRawSync(source);
    const checksum = crc32(source);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x0021, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(source.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    localParts.push(local, compressed);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x0021, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(source.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centralParts.push(central);
    offset += local.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "The data export is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });

  const [profile, models, rackets, strings, reels, stringers, stringings] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("racket_models").select("*").order("id"),
    supabase.from("rackets").select("*").order("id"),
    supabase.from("strings").select("*").order("id"),
    supabase.from("string_reels").select("*").order("id"),
    supabase.from("stringers").select("*").order("id"),
    supabase.from("stringings").select("*").order("id"),
  ]);
  const error = [profile, models, rackets, strings, reels, stringers, stringings].find((result) => result.error)?.error;
  if (error) return NextResponse.json({ error: "We could not prepare the export. Please try again." }, { status: 500 });

  const files = [
    { name: "profile.csv", rows: [{ account_id: user.id, email: user.email ?? "", ...(profile.data ?? {}) }], columns: ["account_id", "email", "id", "display_name", "locale", "currency_code", "timezone", "preferred_tension_unit", "theme", "created_at", "updated_at"] },
    { name: "racket_models.csv", rows: models.data ?? [], columns: ["id", "user_id", "created_at", "brand", "model_name", "head_size", "string_pattern", "weight_grams", "notes"] },
    { name: "rackets.csv", rows: rackets.data ?? [], columns: ["id", "user_id", "created_at", "identifier", "model_id", "purchase_date", "price", "is_active", "notes"] },
    { name: "strings.csv", rows: strings.data ?? [], columns: ["id", "user_id", "created_at", "brand", "name", "type", "gauge"] },
    { name: "string_reels.csv", rows: reels.data ?? [], columns: ["id", "user_id", "created_at", "string_id", "purchase_date", "price", "total_stringings", "notes"] },
    { name: "stringers.csv", rows: stringers.data ?? [], columns: ["id", "user_id", "created_at", "name", "notes"] },
    { name: "stringings.csv", rows: stringings.data ?? [], columns: ["id", "user_id", "created_at", "racket_id", "main_reel_id", "main_tension_kg", "cross_reel_id", "cross_tension_kg", "stringing_date", "notes", "main_tension_unit", "cross_tension_unit", "service_cost", "stringer_id", "hours_played", "replacement_reason"] },
  ].map(({ name, rows, columns }) => ({ name, content: csv(rows as CsvRecord[], columns) }));

  return new NextResponse(new Uint8Array(zip(files)), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="tennis-tracker-export.zip"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
