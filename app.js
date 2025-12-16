console.log("APP JS LOADED (MATCHING YOUR HTML)");

// ✅ CHANGE THIS to your Render backend base
const API_BASE = "https://crud-clinic.onrender.com/api";

// ------------------------------
// Helpers
// ------------------------------
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 10);
}

function toast(msg) {
  alert(msg);
}

// Make ISO datetime from date + time
function toISO(dateStr, timeStr) {
  // dateStr: "2025-12-18", timeStr: "23:16"
  if (!dateStr || !timeStr) return "";
  const d = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

// Add minutes to ISO datetime
function addMinutes(iso, minutes) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const msg = isJson ? JSON.stringify(data) : String(data);
    throw new Error(`${res.status} ${res.statusText} - ${msg}`);
  }
  return data;
}

// ------------------------------
// Tabs (works even if backend fails)
// ------------------------------
function setActiveTab(tabName) {
  qsa(".tabs .tab").forEach((b) => b.classList.remove("active"));
  const btn = qsa(".tabs .tab").find((b) => b.dataset.tab === tabName);
  if (btn) btn.classList.add("active");

  qsa(".panel").forEach((p) => p.classList.remove("show"));
  const panel = qs(`#${tabName}`);
  if (panel) panel.classList.add("show");
}

function wireTabs() {
  qsa(".tabs .tab").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveTab(btn.dataset.tab);
    });
  });
  setActiveTab("patients");
}

// ------------------------------
// DOM (your HTML ids)
// ------------------------------
// Patients
const patientForm = qs("#patientForm");
const pName = qs("#p_name");
const pPhone = qs("#p_phone");
const pEmail = qs("#p_email");
const pBirth = qs("#p_birthDate");
const patientsTbody = qs("#patientsTable tbody");

// Doctors
const doctorForm = qs("#doctorForm");
const dName = qs("#d_name");
const dSpec = qs("#d_specialty"); // UI label "Specialization", backend requires "specialty"
const dPhone = qs("#d_phone");
const doctorsTbody = qs("#doctorsTable tbody");

// Appointments
const apptForm = qs("#apptForm");
const aPatient = qs("#a_patient");
const aDoctor = qs("#a_doctor");
const aDate = qs("#a_date");
const aTime = qs("#a_time");
const apptsTbody = qs("#apptsTable tbody");

// ------------------------------
// State
// ------------------------------
let patients = [];
let doctors = [];
let appts = [];

// ------------------------------
// Render
// ------------------------------
function renderPatients() {
  if (!patientsTbody) return;
  patientsTbody.innerHTML = patients
    .map((p) => {
      const id = p._id || p.id;
      return `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.phone)}</td>
          <td>${escapeHtml(p.email || "")}</td>
          <td>${escapeHtml(fmtDate(p.birthDate))}</td>
          <td>
            <button class="btn-sm danger" data-del-patient="${escapeHtml(id)}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderDoctors() {
  if (!doctorsTbody) return;
  doctorsTbody.innerHTML = doctors
    .map((d) => {
      const id = d._id || d.id;
      const spec = d.specialty || d.specialization || "";
      return `
        <tr>
          <td>${escapeHtml(d.name)}</td>
          <td>${escapeHtml(spec)}</td>
          <td>${escapeHtml(d.phone || "")}</td>
          <td>
            <button class="btn-sm danger" data-del-doctor="${escapeHtml(id)}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function refreshApptSelects() {
  if (!aPatient || !aDoctor) return;

  aPatient.innerHTML =
    `<option value="">Select patient</option>` +
    patients
      .map((p) => {
        const id = p._id || p.id;
        return `<option value="${escapeHtml(id)}">${escapeHtml(p.name)}</option>`;
      })
      .join("");

  aDoctor.innerHTML =
    `<option value="">Select doctor</option>` +
    doctors
      .map((d) => {
        const id = d._id || d.id;
        return `<option value="${escapeHtml(id)}">${escapeHtml(d.name)}</option>`;
      })
      .join("");
}

function nameById(list, id) {
  if (!id) return "";
  const found = list.find((x) => (x._id || x.id) === id);
  return found?.name || "";
}

function renderAppts() {
  if (!apptsTbody) return;

  apptsTbody.innerHTML = appts
    .map((a) => {
      const id = a._id || a.id;

      // handle different shapes:
      const patientId = a.patientId || a.patient || a.patient?._id || a.patient?.id;
      const doctorId = a.doctorId || a.doctor || a.doctor?._id || a.doctor?.id;

      // backend requires startAt/endAt, but maybe returns other names
      const start = a.startAt || a.date || a.appointmentDate || a.scheduledAt;
      const end = a.endAt || "";

      const pNameStr = typeof a.patient === "object" ? a.patient?.name : nameById(patients, patientId) || patientId;
      const dNameStr = typeof a.doctor === "object" ? a.doctor?.name : nameById(doctors, doctorId) || doctorId;

      return `
        <tr>
          <td>${escapeHtml(pNameStr || "")}</td>
          <td>${escapeHtml(dNameStr || "")}</td>
          <td>${escapeHtml(fmtDate(start))}</td>
          <td>${escapeHtml(start ? new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "")}</td>
          <td>
            <button class="btn-sm danger" data-del-appt="${escapeHtml(id)}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ------------------------------
// Load
// ------------------------------
async function loadAll() {
  try {
    patients = await api("/patients");
    doctors = await api("/doctors");
    appts = await api("/appointments");

    renderPatients();
    renderDoctors();
    refreshApptSelects();
    renderAppts();
  } catch (e) {
    console.error(e);
    toast("Backend connection failed. Check Render API + CORS.");
  }
}

// ------------------------------
// Submit handlers
// ------------------------------
patientForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = {
      name: pName.value.trim(),
      phone: pPhone.value.trim(),
      email: pEmail.value.trim(),
      birthDate: pBirth.value,
    };
    if (!payload.name || !payload.phone || !payload.email || !payload.birthDate) {
      return toast("Fill out all patient fields.");
    }

    await api("/patients", { method: "POST", body: JSON.stringify(payload) });
    await loadAll();
    patientForm.reset();
  } catch (err) {
    console.error(err);
    toast(err.message || "Error creating patient");
  }
});

doctorForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    // ✅ backend expects "specialty"
    const payload = {
      name: dName.value.trim(),
      specialty: dSpec.value.trim(),
      phone: dPhone.value.trim(),
    };
    if (!payload.name || !payload.specialty || !payload.phone) {
      return toast("Fill out all doctor fields.");
    }

    await api("/doctors", { method: "POST", body: JSON.stringify(payload) });
    await loadAll();
    doctorForm.reset();
  } catch (err) {
    console.error(err);
    toast(err.message || "Error creating doctor");
  }
});

apptForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const patientId = aPatient.value;
    const doctorId = aDoctor.value;
    const date = aDate.value;
    const time = aTime.value;

    if (!patientId || !doctorId || !date || !time) {
      return toast("Fill out all appointment fields.");
    }

    // ✅ backend expects startAt and endAt
    const startAt = toISO(date, time);
    if (!startAt) return toast("Invalid date/time.");

    // Default duration: 30 mins
    const endAt = addMinutes(startAt, 30);

    const payload = { patientId, doctorId, startAt, endAt };

    await api("/appointments", { method: "POST", body: JSON.stringify(payload) });
    await loadAll();
    apptForm.reset();
  } catch (err) {
    console.error(err);
    toast(err.message || "Error creating appointment");
  }
});

// ------------------------------
// Delete handlers
// ------------------------------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  try {
    if (btn.dataset.delPatient) {
      if (!confirm("Delete patient?")) return;
      await api(`/patients/${btn.dataset.delPatient}`, { method: "DELETE" });
      await loadAll();
    }
    if (btn.dataset.delDoctor) {
      if (!confirm("Delete doctor?")) return;
      await api(`/doctors/${btn.dataset.delDoctor}`, { method: "DELETE" });
      await loadAll();
    }
    if (btn.dataset.delAppt) {
      if (!confirm("Delete appointment?")) return;
      await api(`/appointments/${btn.dataset.delAppt}`, { method: "DELETE" });
      await loadAll();
    }
  } catch (err) {
    console.error(err);
    toast(err.message || "Delete failed");
  }
});

// ------------------------------
// Start
// ------------------------------
wireTabs();
loadAll();
