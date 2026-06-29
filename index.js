/* ===================================================================
   Engineering Drawing Sale & Resale — index.js
   Reads kit listings from Supabase, most recent first.
   =================================================================== */

// ---------- 1. SUPABASE CONFIG — fill these in ----------

const SUPABASE_URL = "https://sjjmkjnnzccidsutgxhl.supabase.co"; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqam1ram5uemNjaWRzdXRneGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTAzMzgsImV4cCI6MjA5ODMyNjMzOH0.NOLVNflOx2LTTfI7kCTH84PWWCI1NdVOiQPt3IEVo10";
const TABLE_NAME = "kits";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- 2. Checklist definition (must match list.js / DB columns) ----------
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

const PAGE_SIZE = 10;
const WHATSAPP_INTRO_MESSAGE =
  "Hi, I got your number from Engineering Drawing Sale Resale. I want to buy the kit.";

// ---------- 3. State ----------
let offset = 0;
let totalCount = 0;
let searchTerm = "";
let priceSort = "none"; // "none" -> "asc" -> "desc" -> "none"
let isLoading = false;

// ---------- 4. DOM refs ----------
const kitGrid = document.getElementById("kitGrid");
const emptyState = document.getElementById("emptyState");
const loaderState = document.getElementById("loaderState");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const countLabel = document.getElementById("countLabel");
const statusMessage = document.getElementById("statusMessage");
const searchInput = document.getElementById("searchInput");
const priceSortBtn = document.getElementById("priceSortBtn");
const priceSortLabel = document.getElementById("priceSortLabel");

// ---------- 5. Helpers ----------
function showStatus(message) {
  if (!message) {
    statusMessage.hidden = true;
    return;
  }
  statusMessage.textContent = message;
  statusMessage.hidden = false;
}

function formatRupees(value) {
  const num = Number(value) || 0;
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function buildWhatsAppLink(whatsapp) {
  const digits = String(whatsapp || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_INTRO_MESSAGE)}`;
}

function renderCard(kit) {
  const card = document.createElement("article");
  card.className = "kit-card";

  const checklistHtml = CHECKLIST_ITEMS.map((item) => {
    const included = !!kit[item.key];
    const icon = included ? "check_circle" : "cancel";
    return `<li class="${included ? "included" : "excluded"}">
        <span class="material-symbols-outlined">${icon}</span>${item.label}
      </li>`;
  }).join("");

  card.innerHTML = `
    <div class="kit-card-header">
      <span class="avatar material-symbols-outlined">person</span>
      <div>
        <h3></h3>
        <p></p>
      </div>
    </div>
    <hr />
    <ul class="checklist">${checklistHtml}</ul>
    <hr />
    <div class="kit-card-footer">
      <div class="price-block">
        <span class="price-label">Price</span>
        <span class="price-value"></span>
      </div>
      <a class="btn btn-primary" target="_blank" rel="noopener">Contact</a>
    </div>
  `;

  // Set text content via DOM (not innerHTML) for user-supplied strings to avoid HTML injection
  card.querySelector("h3").textContent = kit.name || "Unnamed seller";
  card.querySelector(".kit-card-header p").textContent = kit.college || "";
  card.querySelector(".price-value").textContent = formatRupees(kit.price);

  const contactBtn = card.querySelector(".kit-card-footer a");
  contactBtn.href = buildWhatsAppLink(kit.whatsapp);

  return card;
}

function setLoading(loading) {
  isLoading = loading;
  loaderState.hidden = !loading;
  loadMoreBtn.disabled = loading;
}

// ---------- 6. Core fetch ----------
async function fetchKits(reset) {
  if (isLoading) return;

  if (reset) {
    offset = 0;
    kitGrid.innerHTML = "";
  }

  setLoading(true);
  showStatus("");

  try {
    let query = supabaseClient
      .from(TABLE_NAME)
      .select("*", { count: "exact" });

    if (searchTerm.trim()) {
      query = query.ilike("college", `%${searchTerm.trim()}%`);
    }

    if (priceSort === "asc") {
      query = query.order("price", { ascending: true });
    } else if (priceSort === "desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    totalCount = count || 0;
    offset += data.length;

    data.forEach((kit) => kitGrid.appendChild(renderCard(kit)));

    const shown = kitGrid.children.length;
    emptyState.hidden = shown > 0;
    loadMoreBtn.hidden = shown >= totalCount || totalCount === 0;
    countLabel.textContent =
      totalCount > 0 ? `Showing ${shown} of ${totalCount} recent listings` : "";
  } catch (err) {
    console.error(err);
    showStatus(
      "Couldn't load listings. Check your Supabase connection and try again."
    );
  } finally {
    setLoading(false);
  }
}

// ---------- 7. Event listeners ----------
let searchDebounce;
searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => fetchKits(true), 350);
});

priceSortBtn.addEventListener("click", () => {
  if (priceSort === "none") {
    priceSort = "asc";
    priceSortLabel.textContent = "Price ↑";
  } else if (priceSort === "asc") {
    priceSort = "desc";
    priceSortLabel.textContent = "Price ↓";
  } else {
    priceSort = "none";
    priceSortLabel.textContent = "Price";
  }
  fetchKits(true);
});

loadMoreBtn.addEventListener("click", () => fetchKits(false));

// ---------- 8. Init ----------
fetchKits(true);
