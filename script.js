const DEVICE_ID  = "dev-001";
const SERVER_URL = "https://script.google.com/macros/s/AKfycbxrQreOZe0bZisAAmT5e0Owc_s9cphNlh0G3k9wRM3XX7Ilyo3j-r5qBEzIoEtf_DE7/exec";  

let sensorActive       = false;
let samples            = [];
let sendTimer          = null;
let isMobile           = false;
let motionListenerAdded = false;
let motionDataReceived = false;

// ── Utility ──
function setStatus(text, type) {
  const badge = document.getElementById("statusBadge");
  const span  = document.getElementById("statusText");
  span.textContent = text;
  badge.className  = "status-badge status-" + type;
}

function setSendLog(text, show = true) {
  const el = document.getElementById("sendLog");
  el.style.display = show ? "flex" : "none";
  document.getElementById("sendLogText").textContent = text;
}

function updateUI(x = 0, y = 0, z = 0) {
  document.getElementById("x").textContent   = x.toFixed(2);
  document.getElementById("y").textContent   = y.toFixed(2);
  document.getElementById("z").textContent   = z.toFixed(2);
  const mag = getMagnitude(x, y, z);
  document.getElementById("mag").textContent = mag.toFixed(2);

  if (!motionDataReceived) {
    setStatus("Sensor ON – Menunggu data pertama...", "info");
    return;
  }

  const magNum = parseFloat(mag);
  if (Math.abs(magNum - 9.8) < 1.5) {
    setStatus("Sensor ON – Stabil (gravitasi normal)", "on");
  } else if (magNum > 1) {
    setStatus("Sensor ON – Bergerak! Mag: " + mag.toFixed(2), "warning");
  } else {
    setStatus("Sensor ON – Data minim, goyang lebih kuat", "warning");
  }
}

function getMagnitude(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

// ── START & STOP ──
function startSensor() {
  if (sensorActive) return;
  sensorActive = true;
  motionDataReceived = false;
  motionListenerAdded = false;

  document.getElementById("startBtn").disabled = true;
  document.getElementById("stopBtn").disabled = false;
  document.getElementById("testBtn").disabled = false;
  setSendLog("Sensor aktif, menunggu data...", true);
  setStatus("Sensor ON – Memulai...", "info");

  isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  document.getElementById("deviceInfo").innerHTML = isMobile
    ? '<i class="fas fa-mobile-screen-button"></i> Mobile/Tablet – Pakai accelerometer asli'
    : '<i class="fas fa-laptop"></i> Laptop/Desktop – Simulasi via mouse';

  if (isMobile) {
    const addListener = () => {
      if (motionListenerAdded) return;
      motionListenerAdded = true;
      window.addEventListener("devicemotion", onRealMotion, { passive: true });
      sendTimer = setInterval(sendLatest, 10000); // kirim tiap 10 detik
      setTimeout(checkMotionStatus, 5000);
    };

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then(perm => {
          if (perm === "granted") addListener();
          else setStatus("Izin sensor ditolak", "off");
        })
        .catch(err => setStatus("Error izin: " + err.message, "off"));
    } else {
      addListener();
    }
  } else {
    window.addEventListener("mousemove", onMouseSimulate);
    sendTimer = setInterval(sendLatest, 10000);
    setStatus("Sensor ON (simulasi) – Gerakkan mouse!", "on");
  }
}

function stopSensor() {
  sensorActive = false;
  motionListenerAdded = false;
  window.removeEventListener("devicemotion", onRealMotion);
  window.removeEventListener("mousemove", onMouseSimulate);
  clearInterval(sendTimer);
  sendTimer = null;
  samples = [];

  document.getElementById("startBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
  document.getElementById("testBtn").disabled = true;
  setStatus("Sensor OFF", "off");
  setSendLog("", false);
  updateUI(0, 0, 0);
}

// ── Sensor Handlers ──
function onRealMotion(event) {
  if (!sensorActive) return;
  motionDataReceived = true;
  const acc = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
  const x = acc.x ?? 0;
  const y = acc.y ?? 0;
  const z = acc.z ?? 0;
  updateUI(x, y, z);
  samples.push({ t: Date.now(), x, y, z });
}

let prevMouseX = 0, prevMouseY = 0;
function onMouseSimulate(event) {
  if (!sensorActive) return;
  motionDataReceived = true;
  const dx = (event.clientX - prevMouseX) * 0.08;
  const dy = (event.clientY - prevMouseY) * 0.08;
  const x = dx;
  const y = dy;
  const z = 9.8 + (Math.random() * 0.4 - 0.2);
  updateUI(x, y, z);
  samples.push({ t: Date.now(), x, y, z });
  prevMouseX = event.clientX;
  prevMouseY = event.clientY;
}

function checkMotionStatus() {
  if (!sensorActive || motionDataReceived) return;
  setStatus("Sensor ON tapi nol? Goyang kuat atau cek izin browser", "warning");
}

// ── Kirim Data (versi fix CORS) ──
function sendLatest() {
  if (samples.length === 0) {
    console.log("Tidak ada data baru, skip kirim");
    setSendLog("Menunggu data baru...", true);
    return;
  }

  const latest = samples[samples.length - 1];
  const payload = { device_id: DEVICE_ID, samples: [latest] };
  const waktu = new Date(latest.t).toLocaleTimeString("id-ID");

  console.log("Mencoba kirim ke:", SERVER_URL + "?path=telemetry/accel");
  console.log("Payload:", JSON.stringify(payload, null, 2));
  setSendLog("Mengirim data pukul " + waktu + "...", true);

  fetch(SERVER_URL + "?path=telemetry/accel", {
    method: "POST",
    mode: "no-cors",  // bypass preflight & CORS block dari origin null
    cache: "no-cache",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain"  // simple request, no preflight
    },
    body: JSON.stringify(payload)
  })
  .then(() => {
    // no-cors → response ga bisa dibaca, tapi kalau sampai sini berarti request dikirim
    console.log("Request berhasil dikirim (no-cors mode)");
    setSendLog("✓ Dikirim pukul " + waktu + " (cek sheet Accel)", true);
    samples = []; // kosongkan setelah kirim
  })
  .catch(err => {
    console.error("Fetch gagal (mungkin CORS atau network):", err);
    setSendLog("❌ Gagal kirim: " + (err.message || "Cek koneksi / buka via Live Server"), true);
  });
}

// ── Tes Manual ──
function testSend() {
  const testPayload = {
    device_id: DEVICE_ID,
    samples: [{
      t: Date.now(),
      x: 1.23,
      y: 4.56,
      z: 9.81
    }]
  };

  console.log("Tes manual - Mencoba kirim:", JSON.stringify(testPayload, null, 2));

  fetch(SERVER_URL + "?path=telemetry/accel", {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(testPayload)
  })
  .then(() => {
    console.log("Tes manual dikirim (no-cors)");
    setSendLog("Tes manual: ✓ Dikirim (cek sheet)", true);
  })
  .catch(err => {
    console.error("Tes manual gagal:", err);
    setSendLog("Tes manual: ❌ " + err.message, true);
  });
}

// Init
document.getElementById("stopBtn").disabled = true;
document.getElementById("testBtn").disabled = true;