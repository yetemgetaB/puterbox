# 📋 FieldLog AI — Serverless Field Inspection & Client Portal Studio

[![Powered by Puter.js](https://img.shields.io/badge/Powered%20by-Puter.js-6366f1?style=for-the-badge&logo=cloud&logoColor=white)](https://developer.puter.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)
[![Zero Infrastructure](https://img.shields.io/badge/Infrastructure-%240%20Serverless-teal?style=for-the-badge)](https://docs.puter.com/user-pays-model/)

> **A real-time, multimodal field inspection and client audit studio built 100% serverless using [Puter.js](https://docs.puter.com). Record voice observations, snap photos with OCR vision, synthesize compliant audit reports with AI, and deploy an interactive live client portal to `*.puter.site` in 1 second.**

---

## 🎯 The Real-World Problem Solved

Field inspectors, facilities engineers, contractors, and hardware researchers waste hours taking fragmented notes on physical clipboards, dictaphones, and mobile cameras. Afterward, they spend entire evenings manually typing up PDF client reports and formatting spreadsheets.

**FieldLog AI** replaces this broken workflow with a single, voice-first serverless studio:
1. **Walk & Speak**: Dictate findings on-site with real-time speech recognition.
2. **Snap & OCR**: Upload photos of equipment plates or safety tags to automatically extract serials and defect markers.
3. **Puter AI Synthesis**: Convert unstructured voice logs and photos into a structured executive report with compliance ratings and prioritized corrective actions.
4. **1-Click Live Web Hosting**: Instantly deploy a client-facing web portal to `https://<audit-slug>.puter.site` with zero server setup.
5. **Instant Email Dispatch**: Send the live portal link directly to the client's inbox on the spot.

---

## ⚡ Complete Puter.js Capabilities Matrix

| Puter.js Feature | FieldLog AI Implementation |
| :--- | :--- |
| 🎙️ **`puter.ai.speech2txt`** | Transcribes hands-free voice dictation from the inspector's microphone while walking a facility. |
| 👁️ **`puter.ai.img2txt` (OCR)** | Scans attached photo evidence to extract equipment serial numbers, gauge readings, and defect text. |
| 🤖 **`puter.ai.chat` (500+ LLMs)** | Synthesizes raw notes into a certified inspection report, compliance score, and corrective action matrix. |
| 🔊 **`puter.ai.txt2speech`** | Generates a spoken audio executive briefing that clients or managers can listen to on the go. |
| 🌐 **`puter.hosting.create()`** | Generates an interactive, standalone client portal and hosts it live at `*.puter.site` with instant SSL. |
| 🗄️ **`puter.kv`** | Persistent cloud database storing inspection drafts, revision history, and compliance metrics. |
| 📁 **`puter.fs`** | Virtual cloud filesystem storing report assets and photo evidence in the user's Puter drive. |
| ✉️ **`puter.email`** | Sends transactional emails containing the live portal link and summary to client stakeholders. |
| 🔐 **`puter.auth`** | Single sign-on and cloud storage synchronization backed by the Puter User-Pays model. |

---

## 🛠️ Tech Stack & Design System

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Design System**: [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) standards
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Styling**: Tailwind CSS CDN with dark/light mode tokens
- **Iconography**: [Lucide Icons](https://lucide.dev/) (pure SVG)
- **Cloud Backend & AI**: [Puter.js SDK v2](https://js.puter.com/v2/)

---

## 🚀 Quick Start (Running Locally)

Puter.js requires an HTTP origin (not `file://`) to run properly:

### 1. Clone the repository
```bash
git clone https://github.com/yetemgetaB/fieldlog-ai.git
cd fieldlog-ai
```

### 2. Start a local HTTP server
Using Python:
```bash
python -m http.server 8080
```
Or using Node.js:
```bash
npx serve .
```

### 3. Open in Browser
Visit **[http://localhost:8080](http://localhost:8080)**.

---

## 🌐 Instant Live Hosting on Puter

You can host FieldLog AI directly on Puter using the Puter CLI or Hosting API:

```bash
# Using Puter CLI
puter sites create fieldlog-ai .
```
Your app will be live at `https://fieldlog-ai.puter.site` with zero backend configuration.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---
*Built with ❤️ powered by [Puter.js](https://developer.puter.com).*
