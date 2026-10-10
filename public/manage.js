/* ===================================================================
   Engineering Drawing Sale & Resale — manage.js
   Hide / show listings (the `active` flag). Nothing is ever deleted.
   Step 1: verify WhatsApp number + secret code (/api/manage, action "lookup")
   Step 2: flip the switch on each listing  (/api/manage, action "set")
   =================================================================== */

// ---------- DOM refs ----------
const form = document.getElementById("manageForm");
const whatsappInput = document.getElementById("whatsappInput");
const secretInput = document.getElementById("secretInput");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");
const resultPanel = document.getElementById("resultPanel");
const resultList = document.getElementById("resultList");
const resultMessage = document.getElementById("resultMessage");
const backBtn = document.getElementById("backBtn");

const SUBMIT_LABEL = `Find my Kit ${icon("arrow-right")}`;

// Kept in memory only, so each switch can re-verify on the server
let credentials = null;

bindDigitsOnly(whatsappInput);

function showMessage(el, message, type) {
  el.textContent = message || "";
  el.className = "form-message" + (type ? " " + type : "");
  el.hidden = !message;
}

function formatRupees(value) {
  return "₹" + (Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// ---------- Render one listing row with its switch ----------
function applyState(li, kit, active) {
  const btn = li.querySelector(".switch");
  btn.setAttribute("aria-checked", String(active));
  btn.setAttribute("aria-label", `Show “${kit.name}” on the site`);
  li.querySelector(".switch-state").textContent = active ? "Visible" : "Hidden";
  li.classList.toggle("is-hidden", !active);
}

function renderItem(kit, index) {
  const li = document.createElement("li");
  li.className = "manage-item rise";
  li.style.setProperty("--i", Math.min(index, 6));
  li.innerHTML = `
    <div class="manage-info">
      <h3></h3>
      <p class="manage-college"></p>
      <p class="manage-meta"></p>
    </div>
    <div class="manage-toggle">
      <button type="button" class="switch" role="switch" aria-checked="false">
        <span class="switch-knob"></span>
      </button>
      <span class="switch-state"></span>
    </div>`;

  li.querySelector("h3").textContent = kit.name;
  li.querySelector(".manage-college").textContent = kit.college;
  li.querySelector(".manage-meta").textContent =
    `${formatRupees(kit.price)} · ${kit.items}/${kit.total_items} items`;

  let active = kit.active;
  applyState(li, kit, active);

  const btn = li.querySelector(".switch");
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    showMessage(resultMessage, "");
    try {
      const { kit: updated } = await apiRequest("/api/manage", {
        method: "POST",
        body: { action: "set", ...credentials, id: kit.id, active: !active },
      });
      active = updated.active;
      applyState(li, kit, active);
      showMessage(
        resultMessage,
        active
          ? "Your kit is visible on the site again."
          : "Your kit is hidden. Buyers can't see it until you switch it back on.",
        "success"
      );
    } catch (err) {
      console.error(err);
      showMessage(resultMessage, err.message || "Couldn't update the listing. Try again.", "error");
    } finally {
      btn.disabled = false;
    }
  });

  return li;
}

// ---------- Step 1: lookup ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage(formMessage, "");

  const whatsapp = whatsappInput.value.trim();
  const secret = secretInput.value.trim();

  if (!/^\d{10}$/.test(whatsapp)) {
    showMessage(formMessage, "Enter a valid 10-digit WhatsApp number.", "error");
    return;
  }
  if (!secret) {
    showMessage(formMessage, "Enter the secret code you used when listing.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Checking…";

  try {
    const { kits } = await apiRequest("/api/manage", {
      method: "POST",
      body: { action: "lookup", whatsapp, secret },
    });

    credentials = { whatsapp, secret };
    resultList.innerHTML = "";
    kits.forEach((kit, i) => resultList.appendChild(renderItem(kit, i)));
    showMessage(resultMessage, "");

    form.hidden = true;
    resultPanel.hidden = false;
  } catch (err) {
    console.error(err);
    showMessage(formMessage, err.message || "Something went wrong. Try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = SUBMIT_LABEL;
  }
});

// ---------- Back to step 1 ----------
backBtn.addEventListener("click", () => {
  credentials = null;
  secretInput.value = "";
  resultList.innerHTML = "";
  resultPanel.hidden = true;
  form.hidden = false;
  whatsappInput.focus();
});
