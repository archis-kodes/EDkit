import { db, CHECKLIST_KEYS } from "../lib/db.js";
import { verifySecret, readBody, isTenDigits } from "../lib/security.js";

const NOT_FOUND = "No matching listing found. Check your WhatsApp number and secret code.";

const SUMMARY_COLUMNS = ["id", "name", "college", "price", "active", "created_at", "secret_hash", ...CHECKLIST_KEYS];

function toSummary(row) {
  return {
    id: Number(row.id),
    name: row.name,
    college: row.college,
    price: row.price,
    active: Number(row.active) === 1,
    created_at: row.created_at,
    items: CHECKLIST_KEYS.filter((k) => Number(row[k]) === 1).length,
    total_items: CHECKLIST_KEYS.length,
  };
}

/** All listings under this number whose secret code matches. */
async function findOwned(whatsappDigits, secret) {
  const result = await db().execute({
    sql: `SELECT ${SUMMARY_COLUMNS.join(", ")} FROM kits WHERE whatsapp = ? ORDER BY created_at DESC, id DESC`,
    args: ["91" + whatsappDigits],
  });
  const owned = [];
  for (const row of result.rows) {
    if (await verifySecret(secret, row.secret_hash)) owned.push(row);
  }
  return owned;
}

/**
 * POST /api/manage
 *  { action: "lookup", whatsapp, secret }                -> { kits: [...] }
 *  { action: "set", whatsapp, secret, id, active: bool } -> { kit }
 * Listings are hidden/shown (active = 0/1), never deleted.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = readBody(req);
    const whatsapp = String(body.whatsapp || "").trim();
    const secret = String(body.secret || "").trim();

    if (!isTenDigits(whatsapp)) {
      return res.status(400).json({ error: "Enter a valid 10-digit WhatsApp number." });
    }
    if (!secret) {
      return res.status(400).json({ error: "Enter the secret code you used when listing." });
    }

    const owned = await findOwned(whatsapp, secret);
    if (owned.length === 0) return res.status(404).json({ error: NOT_FOUND });

    if (body.action === "set") {
      const id = Number(body.id);
      const target = owned.find((row) => Number(row.id) === id);
      if (!target || typeof body.active !== "boolean") {
        return res.status(404).json({ error: NOT_FOUND });
      }
      await db().execute({
        sql: "UPDATE kits SET active = ? WHERE id = ?",
        args: [body.active ? 1 : 0, id],
      });
      return res.status(200).json({ kit: { ...toSummary(target), active: body.active } });
    }

    // default: lookup
    return res.status(200).json({ kits: owned.map(toSummary) });
  } catch (err) {
    console.error("POST /api/manage failed:", err);
    return res.status(500).json({ error: "Something went wrong. Check your connection and try again." });
  }
}
