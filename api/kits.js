import { db, PUBLIC_COLUMNS, rowToObject } from "../lib/db.js";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");

/**
 * GET /api/kits?q=college&sort=asc|desc&limit=10&offset=0
 * Returns only ACTIVE listings, newest first (or by price).
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const sort = req.query.sort === "asc" || req.query.sort === "desc" ? req.query.sort : "new";
    const limit = clamp(parseInt(req.query.limit, 10) || 10, 1, 50);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const where = ["active = 1"];
    const args = [];
    if (q) {
      where.push("college LIKE ? ESCAPE '\\'");
      args.push(`%${escapeLike(q)}%`);
    }
    const whereSql = where.join(" AND ");

    const orderSql =
      sort === "asc" ? "price ASC, id DESC" :
      sort === "desc" ? "price DESC, id DESC" :
      "created_at DESC, id DESC";

    const [listResult, countResult] = await db().batch(
      [
        {
          sql: `SELECT ${PUBLIC_COLUMNS.join(", ")} FROM kits WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
          args: [...args, limit, offset],
        },
        { sql: `SELECT COUNT(*) AS total FROM kits WHERE ${whereSql}`, args },
      ],
      "read"
    );

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      kits: listResult.rows.map((r) => rowToObject(r, PUBLIC_COLUMNS)),
      total: Number(countResult.rows[0].total) || 0,
    });
  } catch (err) {
    console.error("GET /api/kits failed:", err);
    return res.status(500).json({ error: "Couldn't load listings. Please try again." });
  }
}
