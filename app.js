const API = "https://crud-clinic.onrender.com/api";

/* =======================
   TABS
======================= */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    document.querySelectorAll(".panel").forEach(p => {
      p.hidden = p.id !== tab.dataset.tab;
    });
  });
});

/* =======================
   HELPERS
======================= */
const $ = (id) => document.getElementById(id);
const esc = (s="") => String(s)
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#039;");

/* =======================
   PATIENTS
======================= */
async function loadPatients() {
  const res = await fetch(`${API}/patients`);
  const list = await res.json();

  $("patientsTbody").innerHTML = list.map(p => `
    <tr>
      <td>${esc(p.name)}</td>
      <td>${esc(p.email)}</td>
      <td>${esc(p.phone)}</td>
      <td>${p.birthDate ? new Date(p.birthDate).toLocaleDateString() : ""}</td>
      <td>
        <button class="delBtn" data-type="patient" data-id="${p._id}">Delete</button>
      </td>
    </tr>
  `).join("");

  renderPatientDropdown(list);
}

function renderPatientDropdown(list) {
  const sel = $("apptPatient");
  sel.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Patient";
  placeholder.disabled = true;
  placeholder.selected = true;
  sel.appendChild(placeholder);

  list.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p._id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

$("patientForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;

  const res = await fetch(`${API}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: f.name.value.trim(),
      birthDate: f.dob.value, // backend expects birthDate
      email: f.email.value.trim(),
      phone: f.phone.value.trim()
    })
  });

  const out = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (out.message?.includes("E11000")) {
      alert("Email already exists.");
      return;
    }
    alert(out.message || "Failed to add patient");
    return;
  }

  f.reset();
  loadPatients();
});

/* =======================
   DOCTORS
======================= */
async function loadDoctors() {
  const res = await fetch(`${API}/doctors`);
  const list = await res.json();

  $("doctorsTbody").innerHTML = list.map(d => `
    <tr>
      <td>${esc(d.name)}</td>
      <td>${esc(d.specialty || "")}</td>
      <td>${esc(d.phone || "")}</td>
      <td>
        <button class="delBtn" data-type="doctor" data-id="${d._id}">Delete</button>
      </td>
    </tr>
  `).join("");

  renderDoctorDropdown(list);
}

function renderDoctorDropdown(list) {
  const sel = $("apptDoctor");
  sel.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Doctor";
  placeholder.disabled = true;
  placeholder.selected = true;
  sel.appendChild(placeholder);

  list.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d._id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}

$("doctorForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;

  const res = await fetch(`${API}/doctors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: f.name.value.trim(),
      specialty: f.specialization.value.trim(), // backend expects specialty
      phone: f.phone.value.trim()
    })
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(out.message || "Failed to add doctor");
    return;
  }

  f.reset();
  loadDoctors();
});

/* =======================
   APPOINTMENTS
======================= */
async function loadAppointments() {
  const res = await fetch(`${API}/appointments`);
  const list = await res.json();

  $("appointmentsTbody").innerHTML = list.map(a => `
    <tr>
      <td>${esc(a.patient?.name || "")}</td>
      <td>${esc(a.doctor?.name || "")}</td>
      <td>${esc(a.date || "")} ${esc(a.time || "")}</td>
      <td>${esc(a.notes || "")}</td>
      <td>
        <button class="delBtn" data-type="appointment" data-id="${a._id}">Delete</button>
      </td>
    </tr>
  `).join("");
}

$("appointmentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;

  if (!f.patient.value || !f.doctor.value) {
    alert("Please select patient and doctor.");
    return;
  }

  const res = await fetch(`${API}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient: f.patient.value,
      doctor: f.doctor.value,
      date: f.date.value,
      time: f.time.value,
      notes: f.notes.value.trim()
    })
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(out.message || "Failed to add appointment");
    return;
  }

  f.reset();
  $("apptPatient").selectedIndex = 0;
  $("apptDoctor").selectedIndex = 0;
  loadAppointments();
});

/* =======================
   DELETE HANDLER (ALL)
======================= */
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delBtn");
  if (!btn) return;

  const type = btn.dataset.type;
  const id = btn.dataset.id;

  const ok = confirm(`Delete this ${type}?`);
  if (!ok) return;

  let endpoint = "";
  if (type === "patient") endpoint = `/patients/${id}`;
  if (type === "doctor") endpoint = `/doctors/${id}`;
  if (type === "appointment") endpoint = `/appointments/${id}`;

  const res = await fetch(`${API}${endpoint}`, { method: "DELETE" });
  const out = await res.json().catch(() => ({}));

  if (!res.ok) {
    alert(out.message || "Delete failed");
    return;
  }

  // refresh
  if (type === "patient") { loadPatients(); loadAppointments(); }
  if (type === "doctor") { loadDoctors(); loadAppointments(); }
  if (type === "appointment") { loadAppointments(); }
});

/* =======================
   INIT
======================= */
loadPatients();
loadDoctors();
loadAppointments();
