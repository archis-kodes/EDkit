/* ===================================================================
   Engineering Drawing Sale & Resale — list.js
   Inserts a new kit listing into Supabase.
   =================================================================== */

// ---------- 1. SUPABASE CONFIG — fill these in ----------

const SUPABASE_URL = "https://sjjmkjnnzccidsutgxhl.supabase.co"; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqam1ram5uemNjaWRzdXRneGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTAzMzgsImV4cCI6MjA5ODMyNjMzOH0.NOLVNflOx2LTTfI7kCTH84PWWCI1NdVOiQPt3IEVo10";
const TABLE_NAME = "kits";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- 2. Checklist definition (must match index.js / DB columns) ----------
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

// ---------- 3. State: which items are currently checked ----------
const checkedState = {};
CHECKLIST_ITEMS.forEach((item) => (checkedState[item.key] = false));

// ---------- 4. DOM refs ----------
const checklistEl = document.getElementById("checklist");
const form = document.getElementById("listForm");
const nameInput = document.getElementById("nameInput");
const whatsappInput = document.getElementById("whatsappInput");
const collegeInput = document.getElementById("collegeInput");
const priceInput = document.getElementById("priceInput");
const secretInput = document.getElementById("secretInput");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");

// ---------- 5. Render checklist toggle rows ----------
function renderChecklist() {
  checklistEl.innerHTML = "";
  CHECKLIST_ITEMS.forEach((item) => {
    const li = document.createElement("li");
    li.dataset.key = item.key;
    li.setAttribute("role", "button");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-pressed", "false");

    const label = document.createElement("span");
    label.textContent = item.label;

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = "radio_button_unchecked";

    li.appendChild(label);
    li.appendChild(icon);
    checklistEl.appendChild(li);

    const toggle = () => {
      checkedState[item.key] = !checkedState[item.key];
      const isChecked = checkedState[item.key];
      li.classList.toggle("checked", isChecked);
      li.setAttribute("aria-pressed", String(isChecked));
      icon.textContent = isChecked ? "check_circle" : "radio_button_unchecked";
    };

    li.addEventListener("click", toggle);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
}

renderChecklist();

// Only allow digits in the WhatsApp field
whatsappInput.addEventListener("input", () => {
  whatsappInput.value = whatsappInput.value.replace(/\D/g, "").slice(0, 10);
});

function showError(message) {
  if (!message) {
    formError.hidden = true;
    return;
  }
  formError.textContent = message;
  formError.hidden = false;
}

// ---------- 6. Submit handler ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");

  const name = nameInput.value.trim();
  const whatsappDigits = whatsappInput.value.trim();
  const college = collegeInput.value.trim();
  const price = priceInput.value.trim();
  const secretCode = secretInput.value.trim();

  if (!name || !whatsappDigits || !college || price === "" || !secretCode) {
    showError("Please fill in every field before listing your kit.");
    return;
  }
  if (!/^\d{10}$/.test(whatsappDigits)) {
    showError("Enter a valid 10-digit WhatsApp number.");
    return;
  }
  if (Number(price) < 0) {
    showError("Price can't be negative.");
    return;
  }
  if (secretCode.length < 4) {
    showError("Your secret code should be at least 4 characters.");
    return;
  }

  const payload = {
    name,
    college,
    whatsapp: "91" + whatsappDigits,
    price: Number(price),
    secret_code: secretCode,
    ...checkedState,
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = "Listing…";

  try {
    const { error } = await supabaseClient.from(TABLE_NAME).insert(payload);
    if (error) throw error;

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    showError("Couldn't list your kit. Check your connection and try again.");
    submitBtn.disabled = false;
    submitBtn.innerHTML =
      'List my Kit <span class="material-symbols-outlined">rocket_launch</span>';
  }
});
