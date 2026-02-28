const mockPersonnel = [
  { name: "Dr. Hassan A.", role: "General Physician", eta: "12 mins", distanceKm: 2.1 },
  { name: "Nurse Emily O.", role: "Community Nurse", eta: "9 mins", distanceKm: 1.4 },
  { name: "Paramedic Unit 14", role: "Emergency Response", eta: "7 mins", distanceKm: 1.1 }
];

const personnelList = document.getElementById("personnelList");
const historyList = document.getElementById("historyList");
const requestForm = document.getElementById("requestForm");
const locateBtn = document.getElementById("locateBtn");
const locationStatus = document.getElementById("locationStatus");
const servicePanel = document.getElementById("servicePanel");

let currentCoords = null;

const saveHistory = (entry) => {
  const existing = JSON.parse(localStorage.getItem("doraRequests") || "[]");
  existing.unshift(entry);
  localStorage.setItem("doraRequests", JSON.stringify(existing.slice(0, 6)));
};

const readHistory = () => JSON.parse(localStorage.getItem("doraRequests") || "[]");

const renderPersonnel = () => {
  personnelList.innerHTML = mockPersonnel
    .map(
      (person) => `
      <li>
        <strong>${person.name}</strong><br>
        <span>${person.role}</span><br>
        <small>${person.distanceKm} km away • ETA ${person.eta}</small>
      </li>
    `
    )
    .join("");
};

const renderHistory = () => {
  const records = readHistory();
  historyList.innerHTML = records.length
    ? records
        .map(
          (record) => `
      <li>
        <strong>${record.name}</strong> - <span class="badge ${record.serviceType === "ambulance" ? "emergency" : ""}">${record.serviceType}</span><br>
        <small>${record.complaint}</small><br>
        <small>${record.time}</small>
      </li>
    `
        )
        .join("")
    : "<li>No requests yet.</li>";
};

const updateLocationText = () => {
  if (!currentCoords) {
    locationStatus.innerHTML = "<strong>Location:</strong> Not captured yet.";
    return;
  }

  locationStatus.innerHTML = `<strong>Location:</strong> Lat ${currentCoords.latitude.toFixed(5)}, Lng ${currentCoords.longitude.toFixed(5)}`;
};

const acquireLocation = () => {
  if (!navigator.geolocation) {
    locationStatus.innerHTML = "<strong>Location:</strong> Geolocation is not supported on this device.";
    return;
  }

  locationStatus.innerHTML = "<strong>Location:</strong> Fetching your coordinates...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      updateLocationText();
    },
    () => {
      locationStatus.innerHTML = "<strong>Location:</strong> Unable to access your location. Please enable GPS permission.";
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
};

locateBtn.addEventListener("click", acquireLocation);

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(requestForm);

  const payload = {
    name: formData.get("patientName"),
    phone: formData.get("phone"),
    serviceType: formData.get("serviceType"),
    complaint: formData.get("complaint"),
    history: formData.get("history"),
    medication: formData.get("medication"),
    address: formData.get("address"),
    location: currentCoords,
    time: new Date().toLocaleString()
  };

  saveHistory(payload);
  renderHistory();

  const responseText =
    payload.serviceType === "ambulance"
      ? `🚑 Ambulance dispatched to ${payload.address}. Nearest paramedic unit is on the way.`
      : `✅ ${payload.serviceType === "doorstep" ? "Doorstep clinician" : "Telemedicine team"} assigned. A health worker will contact ${payload.phone}.`;

  servicePanel.innerHTML = `<h3>Service Status</h3><p>${responseText}</p><p><strong>Complaint:</strong> ${payload.complaint}</p>`;

  requestForm.reset();
  currentCoords = null;
  updateLocationText();
});

renderPersonnel();
renderHistory();
updateLocationText();
