/* ===================================================================
   Engineering Drawing Sale & Resale — delete.js
   Deletes a listing only if WhatsApp number + secret code both match.
   =================================================================== */

// ---------- 1. SUPABASE CONFIG — fill these in ----------
const SUPABASE_URL = "https://sjjmkjnnzccidsutgxhl.supabase.co"; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqam1ram5uemNjaWRzdXRneGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTAzMzgsImV4cCI6MjA5ODMyNjMzOH0.NOLVNflOx2LTTfI7kCTH84PWWCI1NdVOiQPt3IEVo10";
const TABLE_NAME = "kits";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- 2. DOM refs ----------
const form = document.getElementById("deleteForm");
const whatsappInput = document.getElementById("whatsappInput");
const secretInput = document.getElementById("secretInput");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

whatsappInput.addEventListener("input", () => {
  whatsappInput.value = whatsappInput.value.replace(/\D/g, "").slice(0, 10);
});

function showMessage(message, type) {
  if (!message) {
    formMessage.hidden = true;
    formMessage.className = "form-message";
    return;
  }
  formMessage.textContent = message;
  formMessage.className = "form-message " + type;
  formMessage.hidden = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("", "");

  const whatsappDigits = whatsappInput.value.trim();
  const secretCode = secretInput.value.trim();

  if (!/^\d{10}$/.test(whatsappDigits)) {
    showMessage("Enter a valid 10-digit WhatsApp number.", "error");
    return;
  }
  if (!secretCode) {
    showMessage("Enter the secret code you used when listing.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = "Checking…";

  try {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .delete()
      .eq("whatsapp", "91" + whatsappDigits)
      .eq("secret_code", secretCode)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      showMessage(
        "No matching listing found. Check your WhatsApp number and secret code.",
        "error"
      );
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        'Delete my Kit <span class="material-symbols-outlined">arrow_forward</span>';
      return;
    }

    showMessage(
      `Deleted ${data.length} listing${data.length > 1 ? "s" : ""} successfully. Redirecting…`,
      "success"
    );
    setTimeout(() => (window.location.href = "index.html"), 1500);
  } catch (err) {
    console.error(err);
    showMessage("Something went wrong. Check your connection and try again.", "error");
    submitBtn.disabled = false;
    submitBtn.innerHTML =
      'Delete my Kit <span class="material-symbols-outlined">arrow_forward</span>';
  }
});
