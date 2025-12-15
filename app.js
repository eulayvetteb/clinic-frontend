const API_URL = "https://crud-clinic.onrender.com/api/patients";

const patientForm = document.getElementById("patientForm");
const patientList = document.getElementById("patientList");

// Load patients
async function loadPatients() {
  patientList.innerHTML = "";

  const res = await fetch(API_URL);
  const patients = await res.json();

  patients.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} - ${p.email}`;
    patientList.appendChild(li);
  });
}

// Add patient
patientForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const patient = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    birthDate: document.getElementById("birthDate").value
  };

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient)
  });

  patientForm.reset();
  loadPatients();
});

// Initial load
loadPatients();
