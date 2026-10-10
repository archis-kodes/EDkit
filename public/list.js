/* ===================================================================
   Engineering Drawing Sale & Resale — list.js
   Posts a new kit listing to /api/list (new listings start as active).
   =================================================================== */

// ---------- State: which items are currently checked ----------
const checkedState = {};
CHECKLIST_ITEMS.forEach((item) => (checkedState[item.key] = false));

// ---------- DOM refs ----------
const checklistEl = document.getElementById("checklist");
const form = document.getElementById("listForm");
const nameInput = document.getElementById("nameInput");
const whatsappInput = document.getElementById("whatsappInput");
const collegeInput = document.getElementById("collegeInput");
const priceInput = document.getElementById("priceInput");
const secretInput = document.getElementById("secretInput");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");

const SUBMIT_LABEL = `List my Kit ${icon("pencil")}`;

// ---------- Render checklist toggle rows ----------
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

    li.appendChild(label);
    li.insertAdjacentHTML("beforeend", icon("circle"));
    const iconEl = li.querySelector("svg");
    checklistEl.appendChild(li);

    const toggle = () => {
      checkedState[item.key] = !checkedState[item.key];
      const isChecked = checkedState[item.key];
      li.classList.toggle("checked", isChecked);
      li.setAttribute("aria-pressed", String(isChecked));
      setIcon(iconEl, isChecked ? "check-circle" : "circle");
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
bindDigitsOnly(whatsappInput);

function showError(message) {
  formError.textContent = message || "";
  formError.hidden = !message;
}

// ---------- Submit handler ----------
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

  submitBtn.disabled = true;
  submitBtn.textContent = "Listing…";

  try {
    await apiRequest("/api/list", {
      method: "POST",
      body: {
        name,
        college,
        whatsapp: whatsappDigits,
        price: Number(price),
        secret: secretCode,
        ...checkedState,
      },
    });
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    showError(err.message || "Couldn't list your kit. Check your connection and try again.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = SUBMIT_LABEL;
  }
});
