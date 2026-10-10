import { db, CHECKLIST_KEYS } from "../lib/db.js";
import { hashSecret, readBody, isTenDigits } from "../lib/security.js";

/** POST /api/list — create a new listing (active by default). */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = readBody(req);
    const name = String(body.name || "").trim();
    const college = String(body.college || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const secret = String(body.secret || "").trim();
    const price = Number(body.price);

    if (!name || !college || !whatsapp || !secret || body.price === "" || body.price == null) {
      return res.status(400).json({ error: "Please fill in every field before listing your kit." });
    }
    if (name.length > 80 || college.length > 120) {
      return res.status(400).json({ error: "Name or college is too long." });
    }
    if (!isTenDigits(whatsapp)) {
      return res.status(400).json({ error: "Enter a valid 10-digit WhatsApp number." });
    }
    if (!Number.isFinite(price) || price < 0 || price > 1000000) {
      return res.status(400).json({ error: "Enter a sensible price." });
    }
    if (secret.length < 4 || secret.length > 64) {
      return res.status(400).json({ error: "Your secret code should be 4 to 64 characters." });
    }

    const checks = CHECKLIST_KEYS.map((key) => (body[key] ? 1 : 0));
    const secretHash = await hashSecret(secret);

    const columns = ["name", "college", "whatsapp", "price", "secret_hash", "active", ...CHECKLIST_KEYS];
    const values = [name, college, "91" + whatsapp, price, secretHash, 1, ...checks];

    const result = await db().execute({
      sql: `INSERT INTO kits (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      args: values,
    });

    return res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error("POST /api/list failed:", err);
    return res.status(500).json({ error: "Couldn't list your kit. Check your connection and try again." });
  }
}
