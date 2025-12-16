// ================== CONFIG ==================
const API_BASE = "https://crud-clinic.onrender.com/api"; // ✅ change if needed

// ================== HELPERS ==================
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // if backend returns no JSON
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Request failed (${res.status}) on ${path}`;
    throw new Error(msg);
  }

  return data;
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(err) {
  const msg = err?.message || String(err);
  // nicer later (toast), for now alert:
  alert(msg);
}

// ================== TABS ==================
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.tab;
    panels.forEach((p) => (p.hidden = p.id !== target));
  });
});

// ================== ELEMENTS ==================
// Forms
const patientForm = document.getElementById("patientForm");
const doctorForm = document.getElementById("doctorForm");
const appointmentForm = document.getElementById("appointmentForm");

// Tables
const patientsTbody = document.getElementById("patientsTbody");
const doctorsTbody = document.getElementById("doctorsTbody");
const appointmentsTbody = document.getElementById("appointmentsTbody");

// Appointment selects
const apptPatientSelect = document.getElementById("apptPatient");
const apptDoctorSelect = document.getElementById("apptDoctor");

// ================== STATE ==================
let patientsCache = [];
let doctorsCache = [];

// ================== RENDERERS ==================
function renderPatientsTable(list) {
  if (!patientsTbody) return;
  patientsTbody.innerHTML = "";

  list.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.email)}</td>
      <td>${escapeHtml(p.phone)}</td>
      <td>${escapeHtml(p.dob || p.date || "")}</td>
      <td class="actionsCol">
        <button class="smallBtn danger" data-type="patient" data-id="${p._id}">Delete</button>
      </td>
    `;
    patientsTbody.appendChild(tr);
  });
}

function renderDoctorsTable(list) {
  if (!doctorsTbody) return;
  doctorsTbody.innerHTML = "";

  list.forEach((d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.specialty || d.specialization || "")}</td>
      <td>${escapeHtml(d.phone || "")}</td>
      <td class="actionsCol">
        <button class="smallBtn danger" data-type="doctor" data-id="${d._id}">Delete</button>
      </td>
    `;
    doctorsTbody.appendChild(tr);
  });
}

function renderAppointmentsTable(list) {
  if (!appointmentsTbody) return;
  appointmentsTbody.innerHTML = "";

  list.forEach((a) => {
    // backend might return populated patient/doctor objects OR ids
    const patientName =
      a.patient?.name ||
      patientsCache.find((p) => p._id === a.patient)?.name ||
      "";
    const doctorName =
      a.doctor?.name ||
      doctorsCache.find((d) => d._id === a.doctor)?.name ||
      "";

    const when = [a.date || "", a.time || ""].filter(Boolean).join(" ");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(patientName)}</td>
      <td>${escapeHtml(doctorName)}</td>
      <td>${escapeHtml(when)}</td>
      <td>${escapeHtml(a.notes || "")}</td>
      <td class="actionsCol">
        <button class="smallBtn danger" data-type="appointment" data-id="${a._id}">Delete</button>
      </td>
    `;
    appointmentsTbody.appendChild(tr);
  });
}

function renderAppointmentDropdowns() {
  if (!apptPatientSelect || !apptDoctorSelect) return;

  apptPatientSelect.innerHTML = `<option value="" disabled selected>Select Patient</option>`;
  patientsCache.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p._id;
    opt.textContent = p.name;
    apptPatientSelect.appendChild(opt);
  });

  apptDoctorSelect.innerHTML = `<option value="" disabled selected>Select Doctor</option>`;
  doctorsCache.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d._id;
    opt.textContent = d.name;
    apptDoctorSelect.appendChild(opt);
  });
}

// ================== LOADERS ==================
async function loadPatients() {
  const data = await api("/patients");
  patientsCache = Array.isArray(data) ? data : data?.patients || [];
  renderPatientsTable(patientsCache);
  renderAppointmentDropdowns();
}

async function loadDoctors() {
  const data = await api("/doctors");
  doctorsCache = Array.isArray(data) ? data : data?.doctors || [];
  renderDoctorsTable(doctorsCache);
  renderAppointmentDropdowns();
}

async function loadAppointments() {
  const data = await api("/appointments");
  const list = Array.isArray(data) ? data : data?.appointments || [];
  renderAppointmentsTable(list);
}

// ================== SUBMITS ==================
patientForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = e.target.elements["name"]?.value.trim();
  const dob = e.target.elements["dob"]?.value; // date input
  const email = e.target.elements["email"]?.value.trim();
  const phone = e.target.elements["phone"]?.value.trim();

  try {
    await api("/patients", {
      method: "POST",
      body: JSON.stringify({ name, dob, email, phone }),
    });

    e.target.reset();
    await loadPatients();
  } catch (err) {
    // handle duplicate email nicely
    if (String(err.message).includes("E11000") || String(err.message).toLowerCase().includes("duplicate")) {
      alert("Email already exists. Please use a different email.");
      return;
    }
    showError(err);
  }
});

doctorForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = e.target.elements["name"]?.value.trim();
  const specialization = e.target.elements["specialization"]?.value.trim();
  const phone = e.target.elements["phone"]?.value.trim();

  try {
    // ✅ IMPORTANT: backend expects "specialty"
    await api("/doctors", {
      method: "POST",
      body: JSON.stringify({ name, specialty: specialization, phone }),
    });

    e.target.reset();
    await loadDoctors();
  } catch (err) {
    showError(err);
  }
});

appointmentForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const patient = e.target.elements["patient"]?.value;
  const doctor = e.target.elements["doctor"]?.value;
  const date = e.target.elements["date"]?.value;
  const time = e.target.elements["time"]?.value;
  const notes = e.target.elements["notes"]?.value?.trim() || "";

  if (!patient || !doctor) {
    alert("Please select patient and doctor.");
    return;
  }

  try {
    await api("/appointments", {
      method: "POST",
      body: JSON.stringify({ patient, doctor, date, time, notes }),
    });

    e.target.reset();
    await loadAppointments();
  } catch (err) {
    showError(err);
  }
});

// ================== DELETE (optional if your backend supports it) ==================
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-type][data-id]");
  if (!btn) return;

  const type = btn.dataset.type;
  const id = btn.dataset.id;

  const ok = confirm(`Delete this ${type}?`);
  if (!ok) return;

  try {
    if (type === "patient") {
      await api(`/patients/${id}`, { method: "DELETE" });
      await loadPatients();
      await loadAppointments(); // appointments might reference patient
    }
    if (type === "doctor") {
      await api(`/doctors/${id}`, { method: "DELETE" });
      await loadDoctors();
      await loadAppointments();
    }
    if (type === "appointment") {
      await api(`/appointments/${id}`, { method: "DELETE" });
      await loadAppointments();
    }
  } catch (err) {
    showError(err);
  }
});

// ================== INIT ==================
(async function init() {
  try {
    await loadPatients();
    await loadDoctors();
    await loadAppointments();
  } catch (err) {
    showError(err);
  }
})();
