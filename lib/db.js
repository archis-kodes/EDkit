import { createClient } from "@libsql/client";

let client;

/** One shared Turso client per serverless instance. */
export function db() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

/** Checklist columns — must match schema.sql and public/shared.js */
export const CHECKLIST_KEYS = [
  "drafter",
  "scale",
  "roll_and_draw",
  "pencils",
  "compass",
  "protector",
  "set_squares",
  "french_curves",
  "clips",
  "drawing_notebook",
  "chart_paper_holder",
];

/** Columns that are safe to send to the browser (never secret_hash). */
export const PUBLIC_COLUMNS = [
  "id",
  "name",
  "college",
  "whatsapp",
  "price",
  "created_at",
  ...CHECKLIST_KEYS,
];

/** Turn a libsql Row into a plain JSON-friendly object. */
export function rowToObject(row, columns) {
  const out = {};
  for (const col of columns) out[col] = row[col];
  return out;
}
