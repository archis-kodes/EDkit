/* ===================================================================
   Engineering Drawing Sale & Resale — shared.js
   Constants + tiny helpers used by every page. Load BEFORE the page script.
   =================================================================== */

// Checklist definition (must match lib/db.js and schema.sql)
const CHECKLIST_ITEMS = [
  { key: "drafter", label: "Drafter" },
  { key: "scale", label: "Scale" },
  { key: "roll_and_draw", label: "Roll and Draw" },
  { key: "pencils", label: "Pencils" },
  { key: "compass", label: "Compass" },
  { key: "protector", label: "Protector" },
  { key: "set_squares", label: "Set Squares" },
  { key: "french_curves", label: "French Curves" },
  { key: "clips", label: "Clips" },
  { key: "drawing_notebook", label: "Drawing Notebook" },
  { key: "chart_paper_holder", label: "Chart Paper Holder" },
];

/** Markup for a doodle icon from icons.svg */
function icon(name) {
  return `<svg class="icon" aria-hidden="true" focusable="false"><use href="icons.svg#i-${name}"></use></svg>`;
}

/** Swap the icon inside an existing <svg class="icon"> element */
function setIcon(svgEl, name) {
  svgEl.querySelector("use").setAttribute("href", `icons.svg#i-${name}`);
}

/** Keep only digits, max 10 — for the WhatsApp inputs */
function bindDigitsOnly(input) {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 10);
  });
}

/** JSON request helper. Throws Error(message) using the server's friendly message. */
async function apiRequest(url, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON response */ }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Something went wrong (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}
