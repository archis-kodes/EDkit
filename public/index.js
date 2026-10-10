/* ===================================================================
   Engineering Drawing Sale & Resale — index.js
   Reads ACTIVE kit listings from /api/kits (Turso behind a Vercel function).
   =================================================================== */

const PAGE_SIZE = 10;
const WHATSAPP_INTRO_MESSAGE =
  "Hi, I got your number from Engineering Drawing Sale Resale. I want to buy the kit.";

// ---------- State ----------
let offset = 0;
let totalCount = 0;
let searchTerm = "";
let priceSort = "none"; // "none" -> "asc" -> "desc" -> "none"
let isLoading = false;
let requestId = 0; // lets a newer search/sort supersede an in-flight request

// ---------- DOM refs ----------
const kitGrid = document.getElementById("kitGrid");
const emptyState = document.getElementById("emptyState");
const loaderState = document.getElementById("loaderState");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const countLabel = document.getElementById("countLabel");
const statusMessage = document.getElementById("statusMessage");
const searchInput = document.getElementById("searchInput");
const priceSortBtn = document.getElementById("priceSortBtn");
const priceSortLabel = document.getElementById("priceSortLabel");

// ---------- Helpers ----------
function showStatus(message) {
  statusMessage.textContent = message || "";
  statusMessage.hidden = !message;
}

function formatRupees(value) {
  const num = Number(value) || 0;
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function buildWhatsAppLink(whatsapp) {
  const digits = String(whatsapp || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_INTRO_MESSAGE)}`;
}

function renderCard(kit, indexInBatch) {
  const card = document.createElement("article");
  card.className = "kit-card rise";
  card.style.setProperty("--i", Math.min(indexInBatch, 9));

  const checklistHtml = CHECKLIST_ITEMS.map((item) => {
    const included = !!kit[item.key];
    return `<li class="${included ? "included" : "excluded"}">
        ${icon(included ? "check-circle" : "x-circle")}
        <span>${item.label}</span>
        <span class="sr-only">${included ? "included" : "not included"}</span>
      </li>`;
  }).join("");

  card.innerHTML = `
    <div class="kit-card-header">
      <span class="avatar">${icon("user")}</span>
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
      <a class="btn btn-primary" target="_blank" rel="noopener">${icon("chat")} Contact</a>
    </div>
  `;

  // Set user-supplied strings via textContent (never innerHTML) to avoid HTML injection
  card.querySelector("h3").textContent = kit.name || "Unnamed seller";
  card.querySelector(".kit-card-header p").textContent = kit.college || "";
  card.querySelector(".price-value").textContent = formatRupees(kit.price);
  card.querySelector(".kit-card-footer a").href = buildWhatsAppLink(kit.whatsapp);

  return card;
}

/** Shimmering placeholder notes shown while listings load */
function renderSkeletons(count = 3) {
  loaderState.innerHTML = Array.from({ length: count }, () => `
    <div class="kit-card is-skeleton">
      <div class="sk-row">
        <span class="skeleton-bar sk-avatar"></span>
        <div class="sk-lines">
          <span class="skeleton-bar" style="width:70%"></span>
          <span class="skeleton-bar" style="width:45%"></span>
        </div>
      </div>
      <hr />
      <div class="sk-list">
        <span class="skeleton-bar" style="width:60%"></span>
        <span class="skeleton-bar" style="width:75%"></span>
        <span class="skeleton-bar" style="width:50%"></span>
        <span class="skeleton-bar" style="width:68%"></span>
      </div>
      <hr />
      <span class="skeleton-bar" style="width:38%;height:1.6em"></span>
    </div>`).join("");
}

function setLoading(loading) {
  isLoading = loading;
  loaderState.hidden = !loading;
  loadMoreBtn.disabled = loading;
}

// ---------- Core fetch ----------
async function fetchKits(reset) {
  if (!reset && isLoading) return;

  const myRequest = ++requestId;

  if (reset) {
    offset = 0;
    kitGrid.innerHTML = "";
    emptyState.hidden = true;
    loadMoreBtn.hidden = true;
    countLabel.textContent = "";
  }

  setLoading(true);
  showStatus("");

  try {
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset });
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (priceSort !== "none") params.set("sort", priceSort);

    const { kits, total } = await apiRequest(`/api/kits?${params}`);
    if (myRequest !== requestId) return; // a newer request took over

    totalCount = total || 0;
    offset += kits.length;
    kits.forEach((kit, i) => kitGrid.appendChild(renderCard(kit, i)));

    const shown = kitGrid.children.length;
    emptyState.hidden = shown > 0;
    loadMoreBtn.hidden = shown >= totalCount || totalCount === 0;
    countLabel.textContent =
      totalCount > 0 ? `Showing ${shown} of ${totalCount} recent listings` : "";
  } catch (err) {
    if (myRequest !== requestId) return;
    console.error(err);
    showStatus("Couldn't load listings. Check your connection and try again.");
  } finally {
    if (myRequest === requestId) setLoading(false);
  }
}

// ---------- Event listeners ----------
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

// ---------- Init ----------
renderSkeletons();
fetchKits(true);
