# 🧰 PuterBox — The Chaotic Swiss Army Knife of Free Web & AI Tools

[![Powered by Puter.js](https://img.shields.io/badge/Powered%20by-Puter.js-6366f1?style=for-the-badge&logo=cloud&logoColor=white)](https://developer.puter.com)
[![Infrastructure](https://img.shields.io/badge/Server%20Bill-%240.00-emerald?style=for-the-badge)](https://docs.puter.com/user-pays-model/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

> *"What is this project? Honestly, I have no idea. Just a chaotic, ridiculously useful collection of free AI & browser tools built with Puter.js because paying \$20/month for random micro-utilities is a scam."*

---

## 🤔 Wait, what even is this?

You know when you just need to:
- Rip text from a screenshot without opening a sketch ad-filled website?
- Turn some text into a realistic AI voiceover without creating a 14-day trial account on ElevenLabs?
- Host a random HTML file live on the internet in literally 1 second without configuring DNS, Vercel, or AWS?
- Test an API call without the browser screaming about **CORS**?
- Generate a quick QR code or format a nasty mess of JSON?

Yeah. That's why **PuterBox** exists. It's a zero-backend, zero-subscription, client-side toolkit that leverages [Puter.js](https://docs.puter.com) to give you superpowers for free.

---

## 🛠️ The Arsenal (What's in the box?)

| Tool | What it does | Powered by |
| :--- | :--- | :--- |
| 👁️ **Instant OCR** | Drop any image, screenshot, or receipt -> get raw text. | `puter.ai.img2txt` (Puter Vision) |
| 🎙️ **Studio Voiceover (TTS)** | Type words -> hear realistic spoken voice + download audio. | `puter.ai.txt2speech` (Puter Audio) |
| 👂 **Voice Transcriber (STT)** | Speak into your mic or upload audio -> clean transcript. | `puter.ai.speech2txt` (Puter Speech) |
| 🚀 **1-Click Static Site Host** | Paste HTML -> get a real live `https://*.puter.site` URL instantly. | `puter.hosting.create` |
| 🎨 **AI Image Art Studio** | Prompt anything -> generate high-res art & images. | `puter.ai.txt2img` |
| 🌐 **CORS-Free Web Fetcher** | Hit any API or scrape public web HTML with zero CORS errors. | `puter.net.fetch` |
| 🤖 **Universal AI Prompt** | Chat, fix buggy code, or ask questions with 500+ LLMs. | `puter.ai.chat` |
| ☁️ **Cloud Scratchpad** | Auto-saving notepad synced across your devices. | `puter.kv` |
| 📱 **QR Code Studio** | Instant clean QR codes for links, Wi-Fi, and text. | Client-side QR engine |
| ⚡ **Dev Micro-Tools** | JSON Prettifier & Minifier, Base64 & URL Encoders, UUID/SHA-256 Generators. | Native Web Crypto |

---

## 🔮 How does it work for \$0? (The Catch)

Under the hood, this runs on **Puter.js** — which uses the **User-Pays Model**:
- **For you**: You don't pay a single dime for hosting servers or API bills.
- **For your users**: When users sign in, their own free monthly Puter allowance covers their AI tokens and storage. No API keys to leak, no servers to crash.

---

## 🏃 How to run it locally

Puter.js requires an HTTP origin (not `file://`):

```bash
# 1. Clone this repo
git clone https://github.com/yetemgetaB/fieldlog-ai.git
cd fieldlog-ai

# 2. Run any simple web server
python -m http.server 8080
# or: npx serve .

# 3. Open your browser
# http://localhost:8080
```

---

## 📜 License

MIT License. Do whatever you want with it!

---
*Built for fun with ❤️ and powered by [Puter.js](https://developer.puter.com).*
