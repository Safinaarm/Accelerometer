# AccelSender - Accelerometer Data Transmission System

## Daftar Isi
- [Deskripsi Sistem](#deskripsi-sistem)
- [Tentang Sistem](#tentang-sistem)
- [Fitur Utama](#fitur-utama)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur File](#struktur-file)
- [API & Integrasi](#api--integrasi)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Referensi](#referensi)
- [Lisensi](#lisensi)
- [Tim Pengembang](#tim-pengembang)

---

## Deskripsi Sistem

AccelSender adalah aplikasi web untuk menangkap dan mengirimkan data accelerometer dari perangkat mobile atau simulasi gerakan mouse dari desktop ke backend server. Dirancang untuk cloud computing praktikum dengan integrasi Google Apps Script.

---

## Tentang Sistem

Aplikasi ini menyediakan interface user-friendly untuk:
- Mengakses sensor accelerometer perangkat (X, Y, Z axis)
- Mensimulasikan data motion melalui mouse pada desktop
- Mengirim data real-time ke backend server
- Monitoring status koneksi dan response server

---

## Fitur Utama

1. **Dual Mode**: Support mobile (real accelerometer) dan desktop (simulasi mouse)
2. **Real-time Data**: Capture data akselerasi X, Y, Z secara langsung
3. **Magnitude Calculation**: Hitung resultan akselerasi dari ketiga sumbu
4. **Auto Send**: Kirim data otomatis setiap 10 detik
5. **Status Monitoring**: Indikator visual status sensor dan pergerakan
6. **Device Detection**: Deteksi otomatis tipe perangkat
7. **Permission Handling**: Request izin sensor dengan graceful handling
8. **Modern UI**: Interface responsif dengan dark theme dan animasi

---

## Instalasi

### Prasyarat
- Browser modern (Chrome, Firefox, Safari, Edge)
- Koneksi internet stabil
- Device dengan sensor accelerometer (untuk mobile)

### Setup

1. **Download/clone project**
   ```bash
   git clone https://github.com/Safinaarm/Accelerometer.git 
   ```

2. **Buka di browser**
   - Buka `index.html` langsung di browser, atau
   - Gunakan local server:
     ```bash
     python -m http.server 8000
     ```

3. **Konfigurasi endpoint**
   - Edit `script.js` dan update `SERVER_URL`:
     ```javascript
     const SERVER_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
     ```

---

## Penggunaan

### Mobile Device
1. Buka aplikasi di browser mobile
2. Klik "START" untuk mengaktifkan sensor
3. Izinkan akses sensor jika diminta
4. Gerakan device untuk melihat data X, Y, Z berubah
5. Data dikirim otomatis setiap 10 detik

### Desktop (Simulasi)
1. Buka aplikasi di browser desktop
2. Klik "START"
3. Gerakkan mouse di area canvas
4. Data simulasi X, Y akan berubah sesuai pergerakan
5. Data dikirim otomatis setiap 10 detik

---

## Arsitektur Sistem

```
┌────────────────────────────────────────────────┐
│             Frontend (Client)                  │
│  ┌───────────────────────────────────────────┐ │
│  │ HTML (index.html)                         │ │
│  │ - Canvas untuk simulasi                   │ │
│  │ - Display data sensor                     │ │
│  │ - Control buttons                         │ │
│  └───────────────────────────────────────────┘ │
│           ▼                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ JavaScript (script.js)                    │ │
│  │ - Accelerometer API handler               │ │
│  │ - Mouse event listener                    │ │
│  │ - Data formatting & sending               │ │
│  │ - UI updates                              │ │
│  └───────────────────────────────────────────┘ │
│           ▼                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ CSS (style.css)                           │ │
│  │ - Responsive layout                       │ │
│  │ - Dark theme styling                      │ │
│  │ - Animations                              │ │
│  └───────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
            ▼
     ┌──────────────┐
     │  Fetch API   │
     │ (POST JSON)  │
     └──────────────┘
            ▼
┌─────────────────────────────────────────────────┐
│    Backend (Google Apps Script)                 │
│  - Receive POST requests                        │
│  - Store data ke Google Sheets                  │
└─────────────────────────────────────────────────┘
```

---

## Struktur File

```
AccelSender/
├── index.html           # HTML structure & interface
├── script.js            # JavaScript logic & API handling
├── style.css            # Styling & responsive design
└── README.md            # Dokumentasi project
```

### File Details

- **index.html**: Struktur interface dengan canvas, display cards, buttons
- **script.js**: Sensor handling, data formatting, HTTP requests
- **style.css**: Dark theme, flexbox layout, animations

---

## API & Integrasi

### Client-Side APIs

**DeviceMotionEvent API** (Mobile accelerometer)
```javascript
window.addEventListener('devicemotion', (event) => {
  const x = event.accelerationIncludingGravity.x;
  const y = event.accelerationIncludingGravity.y;
  const z = event.accelerationIncludingGravity.z;
});
```

**Fetch API** (Send data)
```javascript
fetch(SERVER_URL, {
  method: 'POST',
  mode: 'no-cors',
  body: JSON.stringify(payload)
});
```

### Payload Format

```json
{
  "device_id": "dev-001",
  "timestamp": "2024-03-04T10:30:45Z",
  "x": 0.45,
  "y": -0.23,
  "z": 9.81
}
```

### Google Apps Script Handler

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  // Save to Google Sheets
  return ContentService.createTextOutput("OK");
}
```

---

## Teknologi yang Digunakan

HTML5 – Markup & struktur
CSS3 – Styling & responsiveness
JavaScript ES6+ – Logic & interactivity
Fetch API – HTTP requests
DeviceMotion API – Sensor accelerometer
Google Apps Script – Backend & storage

---

## Referensi

1. [MDN - DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent)
2. [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
3. [Google Apps Script Docs](https://developers.google.com/apps-script)
4. [MDN - Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## Lisensi

MIT License - Bebas digunakan, dimodifikasi, dan didistribusikan.

---

## Tim Pengembang

**Kelompok 5 - Cloud Computing Praktikum**

Dikembangkan sebagai pemenuhan tugas kulian praktikum Cloud Computing 

**Last Updated**: March 2026 
**Version**: 1.0.0
