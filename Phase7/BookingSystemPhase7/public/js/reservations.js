// ===============================
// 0) Authorization
// ===============================
import { initAuthUI, getTokenPayload, requireAuthOrBlockPage, logout } from "./auth-ui.js";
initAuthUI();
if (!requireAuthOrBlockPage()) {
  throw new Error("Authentication required");
}
window.logout = logout;

// ===============================
// 1) DOM references
// ===============================
const form = document.getElementById("reservationForm");
const actions = document.getElementById("reservationActions");
const listEl = document.getElementById("reservationList");
const formMessageEl = document.getElementById("formMessage");
const resourceSelect = document.getElementById("resourceId");
const userDisplay = document.getElementById("userDisplay");

let formMode = "create";
let reservationsCache = [];
let selectedId = null;

// Get current user info from token
const tokenPayload = getTokenPayload();

// ===============================
// 2) Message helpers
// ===============================
function showMessage(type, message) {
  if (!formMessageEl) return;
  formMessageEl.className = "mt-6 rounded-2xl border px-4 py-3 text-sm whitespace-pre-line";
  formMessageEl.classList.remove("hidden");
  if (type === "success") {
    formMessageEl.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-900");
  } else if (type === "info") {
    formMessageEl.classList.add("border-amber-200", "bg-amber-50", "text-amber-900");
  } else {
    formMessageEl.classList.add("border-rose-200", "bg-rose-50", "text-rose-900");
  }
  formMessageEl.textContent = message;
  formMessageEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearMessage() {
  if (!formMessageEl) return;
  formMessageEl.textContent = "";
  formMessageEl.classList.add("hidden");
}

// ===============================
// 3) Button helpers
// ===============================
const BTN_BASE = "w-full rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out";
const BTN_PRIMARY = "bg-brand-primary text-white hover:bg-brand-dark/80 shadow-soft";
const BTN_SECONDARY = "bg-black/10 text-black/70 hover:bg-black/20";

function renderButtons() {
  actions.innerHTML = "";

  if (formMode === "create") {
    const createBtn = document.createElement("button");
    createBtn.type = "submit";
    createBtn.name = "action";
    createBtn.value = "create";
    createBtn.textContent = "Create";
    createBtn.className = `${BTN_BASE} ${BTN_PRIMARY}`;
    actions.appendChild(createBtn);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.textContent = "Clear";
    clearBtn.className = `${BTN_BASE} ${BTN_SECONDARY}`;
    clearBtn.addEventListener("click", () => { clearForm(); clearMessage(); });
    actions.appendChild(clearBtn);
  } else {
    const updateBtn = document.createElement("button");
    updateBtn.type = "submit";
    updateBtn.name = "action";
    updateBtn.value = "update";
    updateBtn.textContent = "Update";
    updateBtn.className = `${BTN_BASE} ${BTN_PRIMARY}`;
    actions.appendChild(updateBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "submit";
    deleteBtn.name = "action";
    deleteBtn.value = "delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.className = `${BTN_BASE} bg-brand-rose text-white hover:bg-brand-rose/80 shadow-soft`;
    actions.appendChild(deleteBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = `${BTN_BASE} ${BTN_SECONDARY}`;
    cancelBtn.addEventListener("click", () => { clearForm(); clearMessage(); formMode = "create"; renderButtons(); });
    actions.appendChild(cancelBtn);
  }
}

// ===============================
// 4) Form helpers
// ===============================
function getFormData() {
  return {
    resourceId: document.getElementById("resourceId").value,
    userId: document.getElementById("userId").value,
    startTime: toISO(document.getElementById("startTime").value),
    endTime: toISO(document.getElementById("endTime").value),
    note: document.getElementById("note").value,
    status: document.querySelector('input[name="status"]:checked')?.value || "active",
  };
}

function toISO(localDatetime) {
  if (!localDatetime) return "";
  return new Date(localDatetime).toISOString();
}

function toLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function clearForm() {
  document.getElementById("reservationId").value = "";
  resourceSelect.value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("note").value = "";
  document.querySelector('input[name="status"][value="active"]').checked = true;
  selectedId = null;
  formMode = "create";
  renderButtons();
  highlightSelected(null);
}

function populateForm(reservation) {
  document.getElementById("reservationId").value = reservation.id;
  resourceSelect.value = reservation.resource_id;
  document.getElementById("startTime").value = toLocal(reservation.start_time);
  document.getElementById("endTime").value = toLocal(reservation.end_time);
  document.getElementById("note").value = reservation.note || "";
  const statusRadio = document.querySelector(`input[name="status"][value="${reservation.status}"]`);
  if (statusRadio) statusRadio.checked = true;

  selectedId = reservation.id;
  formMode = "edit";
  renderButtons();
  highlightSelected(reservation.id);
}

// ===============================
// 5) List rendering
// ===============================
function renderList(reservations) {
  if (!listEl) return;

  if (reservations.length === 0) {
    listEl.innerHTML = '<p class="text-sm text-black/40">No reservations yet.</p>';
    return;
  }

  listEl.innerHTML = reservations.map((r) => {
    const start = new Date(r.start_time).toLocaleString();
    const resourceName = r.resource_name || `Resource #${r.resource_id}`;
    const statusColor = r.status === "active" ? "text-brand-green" : r.status === "cancelled" ? "text-brand-rose" : "text-black/50";
    return `
      <button
        type="button"
        data-id="${r.id}"
        class="w-full text-left rounded-2xl border border-black/10 bg-white px-4 py-3 transition hover:bg-black/5"
        title="Select reservation"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-semibold truncate">${resourceName}</div>
            <div class="text-xs text-black/50 mt-1">${start}</div>
          </div>
          <span class="text-xs font-semibold ${statusColor} whitespace-nowrap">${r.status}</span>
        </div>
      </button>
    `;
  }).join("");

  listEl.querySelectorAll("[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearMessage();
      const id = Number(btn.dataset.id);
      const reservation = reservationsCache.find((x) => Number(x.id) === id);
      if (reservation) populateForm(reservation);
    });
  });
}

function highlightSelected(id) {
  if (!listEl) return;
  listEl.querySelectorAll("[data-id]").forEach((el) => {
    const thisId = Number(el.dataset.id);
    const isSelected = id && thisId === Number(id);
    el.classList.toggle("ring-2", isSelected);
    el.classList.toggle("ring-brand-blue/40", isSelected);
    el.classList.toggle("bg-brand-blue/5", isSelected);
  });
}

// ===============================
// 6) API calls
// ===============================
async function loadResources() {
  try {
    const res = await fetch("/api/resources");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return;

    const resources = Array.isArray(body.data) ? body.data : [];
    resourceSelect.innerHTML = '<option value="">Select a resource...</option>';
    resources.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      resourceSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load resources:", err);
  }
}

async function loadReservations() {
  try {
    const res = await fetch("/api/reservations");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Failed to load reservations:", res.status, body);
      renderList([]);
      return;
    }
    reservationsCache = Array.isArray(body.data) ? body.data : [];
    renderList(reservationsCache);
  } catch (err) {
    console.error("Failed to load reservations:", err);
    renderList([]);
  }
}

// ===============================
// 7) Form submit
// ===============================
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const actionValue = event.submitter?.value || "create";
  const data = getFormData();
  const reservationId = document.getElementById("reservationId").value;

  clearMessage();

  // Basic validation
  if (actionValue !== "delete") {
    if (!data.resourceId || !data.userId || !data.startTime || !data.endTime) {
      showMessage("error", "Please select a resource and fill in start/end time.");
      return;
    }
    if (new Date(data.endTime) <= new Date(data.startTime)) {
      showMessage("error", "End time must be after start time.");
      return;
    }
  }

  try {
    let method, url, body;

    if (actionValue === "create") {
      method = "POST";
      url = "/api/reservations";
      body = JSON.stringify(data);
    } else if (actionValue === "update") {
      if (!reservationId) { showMessage("error", "No reservation selected."); return; }
      method = "PUT";
      url = `/api/reservations/${reservationId}`;
      body = JSON.stringify(data);
    } else if (actionValue === "delete") {
      if (!reservationId) { showMessage("error", "No reservation selected."); return; }
      method = "DELETE";
      url = `/api/reservations/${reservationId}`;
      body = null;
    }

    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body,
    });

    const responseBody = response.status === 204 ? null : await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = responseBody?.error || "Request failed";
      showMessage("error", `Error (${response.status}): ${errMsg}`);
      return;
    }

    // Success
    if (actionValue === "create") {
      showMessage("success", "Reservation created successfully!");
    } else if (actionValue === "update") {
      showMessage("success", "Reservation updated successfully!");
    } else if (actionValue === "delete") {
      showMessage("success", "Reservation deleted successfully!");
    }

    clearForm();
    await loadReservations();

  } catch (err) {
    console.error("Fetch error:", err);
    showMessage("error", "Network error: Could not reach the server.");
  }
});

// ===============================
// 8) Init
// ===============================
// Set user info from token
if (tokenPayload) {
  document.getElementById("userId").value = tokenPayload.sub;
  userDisplay.textContent = `${tokenPayload.firstName || ""} ${tokenPayload.lastName || ""} (${tokenPayload.email || ""})`.trim();
} else {
  userDisplay.textContent = "Not logged in";
}

renderButtons();
loadResources();
loadReservations();
