const API = "https://crud-clinic.onrender.com/api";

// tabs
document.querySelectorAll(".tab").forEach(tab=>{
  tab.onclick = ()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");

    document.querySelectorAll(".panel").forEach(p=>{
      p.hidden = p.id !== tab.dataset.tab;
    });
  };
});

// helpers
const $ = id => document.getElementById(id);

// LOADERS
async function loadPatients(){
  const res = await fetch(`${API}/patients`);
  const data = await res.json();
  $("patientsTbody").innerHTML = data.map(p=>`
    <tr><td>${p.name}</td><td>${p.email}</td><td>${p.phone}</td><td>${p.dob}</td></tr>
  `).join("");

  $("apptPatient").innerHTML =
    `<option disabled selected>Select Patient</option>` +
    data.map(p=>`<option value="${p._id}">${p.name}</option>`).join("");
}

async function loadDoctors(){
  const res = await fetch(`${API}/doctors`);
  const data = await res.json();
  $("doctorsTbody").innerHTML = data.map(d=>`
    <tr><td>${d.name}</td><td>${d.specialty}</td><td>${d.phone}</td></tr>
  `).join("");

  $("apptDoctor").innerHTML =
    `<option disabled selected>Select Doctor</option>` +
    data.map(d=>`<option value="${d._id}">${d.name}</option>`).join("");
}

async function loadAppointments(){
  const res = await fetch(`${API}/appointments`);
  const data = await res.json();
  $("appointmentsTbody").innerHTML = data.map(a=>`
    <tr>
      <td>${a.patient?.name || ""}</td>
      <td>${a.doctor?.name || ""}</td>
      <td>${a.date} ${a.time}</td>
      <td>${a.notes||""}</td>
    </tr>
  `).join("");
}

// SUBMITS
$("patientForm").onsubmit = async e=>{
  e.preventDefault();
  const f = e.target;
  await fetch(`${API}/patients`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      name:f.name.value, dob:f.dob.value,
      email:f.email.value, phone:f.phone.value
    })
  });
  f.reset(); loadPatients();
};

$("doctorForm").onsubmit = async e=>{
  e.preventDefault();
  const f = e.target;
  await fetch(`${API}/doctors`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      name:f.name.value,
      specialty:f.specialization.value,
      phone:f.phone.value
    })
  });
  f.reset(); loadDoctors();
};

$("appointmentForm").onsubmit = async e=>{
  e.preventDefault();
  const f = e.target;
  await fetch(`${API}/appointments`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      patient:f.patient.value,
      doctor:f.doctor.value,
      date:f.date.value,
      time:f.time.value,
      notes:f.notes.value
    })
  });
  f.reset(); loadAppointments();
};

// init
loadPatients(); loadDoctors(); loadAppointments();
