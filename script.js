const DEVICE_ID  = "dev-001";  // Ganti kalau pakai device lain
const SERVER_URL = "https://script.google.com/macros/s/AKfycbyJlWA2t3iNyrtFBgdKQopLW3TdiZMQ9ezeLk25BzkIjzPVuXWtUVsgLYPw-XT3cyHX/exec";  
// <-- PASTIKAN PAKAI URL DARI DEPLOYMENT TERBARU (yang "Anyone")

let sensorActive       = false;
let samples            = [];
let sendTimer          = null;
let isMobile           = false;
let motionListenerAdded = false;
let motionDataReceived = false;

// ── Utility: Update status badge ──
function setStatus(text, type) {
  const badge = document.getElementById("statusBadge");
  const span  = document.getElementById("statusText");
  span.textContent = text;
  badge.className  = "status-badge status-" + type;
}

// ── Utility: Update send log ──
function setSendLog(text, show = true) {
  const el = document.getElementById("sendLog");
  el.style.display = show ? "flex" : "none";
  document.getElementById("sendLogText").textContent = text;
}

// ── Utility: Update sensor values in UI ──
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
    setStatus("Sensor ON – Bergerak! Mag: " + mag, "warning");
  } else {
    setStatus("Sensor ON – Data minim, goyang lebih kuat", "warning");
  }
}

function getMagnitude(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

// ── START ──
function startSensor() {
  if (sensorActive) return;
  sensorActive       = true;
  motionDataReceived = false;
  motionListenerAdded = false;

  document.getElementById("startBtn").disabled = true;
  document.getElementById("stopBtn").disabled  = false;
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
      sendTimer = setInterval(sendLatest, 10000);  // kirim setiap 10 detik
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

// ── STOP ──
function stopSensor() {
  sensorActive        = false;
  motionListenerAdded = false;
  window.removeEventListener("devicemotion", onRealMotion);
  window.removeEventListener("mousemove", onMouseSimulate);
  clearInterval(sendTimer);
  sendTimer = null;
  samples   = [];

  document.getElementById("startBtn").disabled = false;
  document.getElementById("stopBtn").disabled  = true;
  setStatus("Sensor OFF", "off");
  setSendLog("", false);
  updateUI(0, 0, 0);
}

// ── Real Device Motion ──
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

// ── Mouse Simulation (untuk tes di laptop) ──
let prevMouseX = 0, prevMouseY = 0;
function onMouseSimulate(event) {
  if (!sensorActive) return;
  motionDataReceived = true;
  const dx = (event.clientX - prevMouseX) * 0.08;
  const dy = (event.clientY - prevMouseY) * 0.08;
  const x  = dx;
  const y  = dy;
  const z  = 9.8 + (Math.random() * 0.4 - 0.2);
  updateUI(x, y, z);
  samples.push({ t: Date.now(), x, y, z });
  prevMouseX = event.clientX;
  prevMouseY = event.clientY;
}

// ── Check if motion data ever arrived ──
function checkMotionStatus() {
  if (!sensorActive || motionDataReceived) return;
  setStatus("Sensor ON tapi nol? Goyang kuat atau cek izin browser", "warning");
}

// ── Kirim data ke Apps Script ──
function sendLatest() {
  if (samples.length === 0) {
    console.log("Tidak ada data baru, skip kirim");
    setSendLog("Menunggu data baru...", true);
    return;
  }

  const latest  = samples[samples.length - 1];
  const payload = { device_id: DEVICE_ID, samples: [latest] };
  const waktu   = new Date(latest.t).toLocaleTimeString("id-ID");

  console.log("Kirim data pukul " + waktu);
  setSendLog("Mengirim data pukul " + waktu + "...", true);

  fetch(SERVER_URL + "?path=telemetry/accel", {
    method:  "POST",
    mode:    "no-cors",                          // bypass CORS strict
    redirect: "follow",
    headers: { 
      "Content-Type": "text/plain;charset=utf-8" // simple request → no preflight
    },
    body:    JSON.stringify(payload)
  })
  .then(() => {
    console.log("Data terkirim (no-cors)");
    setSendLog("✓ Terkirim pukul " + waktu, true);
    samples = [];  // kosongkan setelah kirim
  })
  .catch(err => {
    console.error("Fetch error:", err);
    setSendLog("❌ Gagal kirim: " + (err.message || "Cek koneksi/URL"), true);
  });
}

// Init: disable stop button saat load
document.getElementById("stopBtn").disabled = true;