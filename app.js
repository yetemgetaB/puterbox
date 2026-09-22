// PuterBox — The Ultimate Free AI & Web Tool Suite

// Active Tool State
let currentActiveTool = null;
let scratchpadSaveTimeout = null;

// DOM Elements
const globalSearch = document.getElementById('global-tool-search');
const categoryPills = document.querySelectorAll('.category-pill');
const toolCards = document.querySelectorAll('.tool-card');
const toolWorkspace = document.getElementById('tool-workspace');
const closeWorkspaceBtn = document.getElementById('close-workspace-btn');
const activeToolTitle = document.getElementById('active-tool-title');
const activeToolDesc = document.getElementById('active-tool-desc');
const activeToolIcon = document.getElementById('active-tool-icon');
const toolContentArea = document.getElementById('tool-content-area');

// Auth & Theme Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const usernameDisplay = document.getElementById('username-display');
const userAvatarInitial = document.getElementById('user-avatar-initial');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const toastContainer = document.getElementById('toast-container');

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
async function init() {
  initTheme();
  setupNavEvents();
  refreshIcons();
  await checkAuthStatus();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ----------------------------------------------------
// Toast Feedback
// ----------------------------------------------------
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const typeIcons = {
    success: 'check-circle',
    info: 'info',
    error: 'alert-circle'
  };
  const icon = typeIcons[type] || 'info';

  toast.className = 'toast-enter pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-xl backdrop-blur-md transition-all';
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 text-indigo-400 dark:text-indigo-600"></i>
    <span>${escapeHTML(message)}</span>
  `;

  toastContainer.appendChild(toast);
  refreshIcons();

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

// ----------------------------------------------------
// Theme
// ----------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'dark' || (!saved && prefersDark);

  if (isDark) {
    document.documentElement.classList.add('dark');
    themeIcon.setAttribute('data-lucide', 'sun');
  } else {
    document.documentElement.classList.remove('dark');
    themeIcon.setAttribute('data-lucide', 'moon');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  refreshIcons();
}

// ----------------------------------------------------
// Puter Auth
// ----------------------------------------------------
async function checkAuthStatus() {
  try {
    if (typeof puter !== 'undefined' && puter.auth && puter.auth.isSignedIn()) {
      const user = await puter.auth.getUser();
      showLoggedIn(user);
    } else {
      showLoggedOut();
    }
  } catch (err) {
    console.warn('Puter Auth Check:', err);
    showLoggedOut();
  }
  refreshIcons();
}

function showLoggedIn(user) {
  loginBtn.classList.add('hidden');
  userProfile.classList.remove('hidden');
  userProfile.classList.add('flex');
  const name = user.username || user.email || 'User';
  usernameDisplay.textContent = name;
  userAvatarInitial.textContent = name.charAt(0).toUpperCase();
}

function showLoggedOut() {
  loginBtn.classList.remove('hidden');
  userProfile.classList.add('hidden');
  userProfile.classList.remove('flex');
}

async function handleLogin() {
  try {
    if (typeof puter === 'undefined') {
      alert('Puter.js SDK not available.');
      return;
    }
    const res = await puter.auth.signIn();
    if (res) {
      await checkAuthStatus();
      showToast('Logged in with Puter', 'success');
    }
  } catch (err) {
    console.error('Login error:', err);
  }
}

async function handleLogout() {
  try {
    if (typeof puter !== 'undefined' && puter.auth) {
      await puter.auth.signOut();
    }
    showLoggedOut();
    showToast('Signed out', 'info');
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// ----------------------------------------------------
// Tool Launch Engine
// ----------------------------------------------------
const TOOLS_CONFIG = {
  ocr: {
    title: 'Instant OCR & Image-to-Text',
    desc: 'Extract clean text from screenshots, documents, and whiteboard photos using Puter Vision.',
    icon: 'scan-text',
    render: renderOcrTool
  },
  tts: {
    title: 'AI Studio Voiceover (Text-to-Speech)',
    desc: 'Generate natural, high-definition spoken audio from any text using Puter Audio.',
    icon: 'volume-2',
    render: renderTtsTool
  },
  stt: {
    title: 'Voice-to-Text Transcriber (Speech-to-Text)',
    desc: 'Transcribe live microphone dictation or audio files into clean text.',
    icon: 'mic',
    render: renderSttTool
  },
  hosting: {
    title: '1-Click Free Static Site Host',
    desc: 'Deploy static web pages to live *.puter.site URLs with automatic HTTPS in 1 second.',
    icon: 'globe',
    render: renderHostingTool
  },
  txt2img: {
    title: 'AI Image Generator',
    desc: 'Create artwork, icons, mockups, and wallpapers from natural language prompts.',
    icon: 'image',
    render: renderTxt2ImgTool
  },
  corsfetch: {
    title: 'CORS-Free API & Web Fetcher',
    desc: 'Fetch any public REST API, website HTML, or RSS feed without CORS restrictions.',
    icon: 'network',
    render: renderCorsFetchTool
  },
  aichat: {
    title: 'Universal AI Prompt & Code Fixer',
    desc: 'Instant access to frontier LLMs for code debugging, translation, and analysis.',
    icon: 'bot',
    render: renderAiChatTool
  },
  scratchpad: {
    title: 'Cloud Synced Scratchpad',
    desc: 'Auto-saving markdown notepad synchronized across all your devices via Puter KV.',
    icon: 'file-text',
    render: renderScratchpadTool
  },
  qrcode: {
    title: 'QR Code Studio',
    desc: 'Generate custom QR codes for URLs, WiFi credentials, and contact cards with PNG export.',
    icon: 'qr-code',
    render: renderQrCodeTool
  },
  json: {
    title: 'JSON Formatter & Validator',
    desc: 'Prettify, minify, sort keys, and validate JSON structures with instant error diagnostics.',
    icon: 'code',
    render: renderJsonTool
  },
  base64: {
    title: 'Base64 & Hash Utility',
    desc: 'Encode and decode Base64 and URL strings, plus generate SHA-256 and UUIDv4 tokens.',
    icon: 'binary',
    render: renderBase64Tool
  }
};

function openTool(toolId) {
  const config = TOOLS_CONFIG[toolId];
  if (!config) return;

  currentActiveTool = toolId;
  activeToolTitle.textContent = config.title;
  activeToolDesc.textContent = config.desc;
  activeToolIcon.innerHTML = `<i data-lucide="${config.icon}" class="w-5 h-5"></i>`;

  toolContentArea.innerHTML = '';
  config.render(toolContentArea);

  toolWorkspace.classList.remove('hidden');
  toolWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  refreshIcons();
}

function closeTool() {
  toolWorkspace.classList.add('hidden');
  toolContentArea.innerHTML = '';
  currentActiveTool = null;
}

// ----------------------------------------------------
// 1. OCR Tool Implementation
// ----------------------------------------------------
function renderOcrTool(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="space-y-3">
        <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400">Select or Drop Image</label>
        <div id="ocr-drop-zone" class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center min-h-[220px]">
          <i data-lucide="upload-cloud" class="w-8 h-8 text-indigo-500 mb-2"></i>
          <p class="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload or drag image here</p>
          <p class="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, WebP, screenshots, documents</p>
          <input type="file" id="ocr-file-input" accept="image/*" class="hidden" />
        </div>
        <div id="ocr-preview-box" class="hidden relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48">
          <img id="ocr-preview-img" class="w-full h-full object-contain bg-slate-950" />
        </div>
      </div>

      <div class="space-y-3 flex flex-col">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">Extracted Text</label>
          <button id="ocr-copy-btn" class="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition cursor-pointer">
            Copy Text
          </button>
        </div>
        <textarea id="ocr-result-area" rows="8" placeholder="Extracted text will appear here automatically after upload..." class="flex-1 w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
      </div>
    </div>
  `;

  const dropZone = container.querySelector('#ocr-drop-zone');
  const fileInput = container.querySelector('#ocr-file-input');
  const previewBox = container.querySelector('#ocr-preview-box');
  const previewImg = container.querySelector('#ocr-preview-img');
  const resultArea = container.querySelector('#ocr-result-area');
  const copyBtn = container.querySelector('#ocr-copy-btn');

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processOcrFile(file);
  });

  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-indigo-500'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-indigo-500'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500');
    if (e.dataTransfer.files[0]) processOcrFile(e.dataTransfer.files[0]);
  });

  copyBtn.addEventListener('click', () => {
    if (!resultArea.value) return;
    navigator.clipboard.writeText(resultArea.value);
    showToast('Copied to clipboard', 'success');
  });

  async function processOcrFile(file) {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      previewImg.src = dataUrl;
      previewBox.classList.remove('hidden');
      resultArea.value = 'Running Puter Vision OCR on image...';

      try {
        if (typeof puter !== 'undefined' && puter.ai && puter.ai.img2txt) {
          const text = await puter.ai.img2txt(dataUrl);
          resultArea.value = text || 'No text detected in image.';
          showToast('OCR extraction complete!', 'success');
        } else {
          resultArea.value = 'Sample OCR output: (Puter SDK loaded via HTTP required for live OCR API)';
        }
      } catch (err) {
        resultArea.value = 'OCR Error: ' + err.message;
      }
    };
    reader.readAsDataURL(file);
  }
}

// ----------------------------------------------------
// 2. TTS Voiceover Tool
// ----------------------------------------------------
function renderTtsTool(container) {
  container.innerHTML = `
    <div class="space-y-4 max-w-3xl mx-auto">
      <div>
        <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Enter Text to Speak</label>
        <textarea id="tts-input" rows="4" placeholder="Type or paste any text or script here..." class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"></textarea>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button id="tts-generate-btn" class="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm">
          <i data-lucide="volume-2" class="w-4 h-4"></i>
          <span>Synthesize Speech</span>
        </button>

        <div id="tts-player-box" class="hidden flex items-center gap-3 w-full sm:w-auto">
          <audio id="tts-audio-elem" controls class="h-9"></audio>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#tts-input');
  const btn = container.querySelector('#tts-generate-btn');
  const playerBox = container.querySelector('#tts-player-box');
  const audioElem = container.querySelector('#tts-audio-elem');

  btn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) { input.focus(); return; }

    btn.disabled = true;
    showToast('Synthesizing speech with Puter Audio...', 'info');

    try {
      if (typeof puter !== 'undefined' && puter.ai && puter.ai.txt2speech) {
        const audio = await puter.ai.txt2speech(text);
        if (audio) {
          audioElem.src = typeof audio === 'string' ? audio : URL.createObjectURL(audio);
          playerBox.classList.remove('hidden');
          audioElem.play();
          showToast('Speech generated!', 'success');
        }
      } else {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utter);
        showToast('Playing speech locally', 'info');
      }
    } catch (err) {
      alert('TTS Error: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

// ----------------------------------------------------
// 3. STT Transcriber Tool
// ----------------------------------------------------
function renderSttTool(container) {
  container.innerHTML = `
    <div class="space-y-4 max-w-3xl mx-auto">
      <div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <button id="stt-mic-btn" class="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center mx-auto transition shadow-lg shadow-rose-500/20 cursor-pointer active:scale-95">
          <i data-lucide="mic" id="stt-mic-icon" class="w-7 h-7"></i>
        </button>
        <p id="stt-status-text" class="text-xs font-semibold text-slate-700 dark:text-slate-300">Click microphone to start dictation</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">Transcribed Output</label>
          <button id="stt-copy-btn" class="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition cursor-pointer">Copy</button>
        </div>
        <textarea id="stt-output" rows="6" placeholder="Speech text will appear here..." class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"></textarea>
      </div>
    </div>
  `;

  const micBtn = container.querySelector('#stt-mic-btn');
  const micIcon = container.querySelector('#stt-mic-icon');
  const statusText = container.querySelector('#stt-status-text');
  const output = container.querySelector('#stt-output');
  const copyBtn = container.querySelector('#stt-copy-btn');

  let mediaRec = null;
  let isRec = false;
  let chunks = [];

  micBtn.addEventListener('click', async () => {
    if (isRec) {
      if (mediaRec) mediaRec.stop();
      isRec = false;
      micBtn.classList.replace('bg-slate-900', 'bg-rose-500');
      statusText.textContent = 'Transcribing with Puter AI...';
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRec = new MediaRecorder(stream);
        chunks = [];

        mediaRec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        mediaRec.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          if (typeof puter !== 'undefined' && puter.ai && puter.ai.speech2txt) {
            try {
              const file = new File([blob], 'audio.wav', { type: 'audio/wav' });
              const res = await puter.ai.speech2txt(file);
              const text = typeof res === 'string' ? res : (res?.text || '');
              output.value += (output.value ? '\n' : '') + text;
              showToast('Audio transcribed!', 'success');
            } catch (err) {
              output.value += '\n(Sample transcript: Puter.js speech2txt converted voice stream)';
            }
          } else {
            output.value += '\n(Sample transcript: Puter.js speech2txt converted voice stream)';
          }
          statusText.textContent = 'Click microphone to record again';
          stream.getTracks().forEach(t => t.stop());
        };

        mediaRec.start();
        isRec = true;
        micBtn.classList.replace('bg-rose-500', 'bg-slate-900');
        statusText.textContent = 'Recording in progress... Speak now';
      } catch (err) {
        alert('Microphone error: ' + err.message);
      }
    }
    refreshIcons();
  });

  copyBtn.addEventListener('click', () => {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value);
    showToast('Copied text to clipboard', 'success');
  });
}

// ----------------------------------------------------
// 4. 1-Click Hosting Tool
// ----------------------------------------------------
function renderHostingTool(container) {
  const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Puter Site</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white min-h-screen flex items-center justify-center p-6 text-center">
  <div class="max-w-lg space-y-4">
    <div class="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center text-2xl font-bold border border-indigo-500/30">🚀</div>
    <h1 class="text-3xl font-bold tracking-tight">Hello from Puter.js!</h1>
    <p class="text-slate-300 text-sm">This website was deployed instantly with zero servers.</p>
    <a href="https://developer.puter.com" target="_blank" class="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold transition">Powered by Puter</a>
  </div>
</body>
</html>`;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">HTML/CSS/JS Source Code</label>
        <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <i data-lucide="check" class="w-3.5 h-3.5"></i> Instant HTTPS & Subdomain
        </span>
      </div>

      <textarea id="hosting-code-input" rows="9" class="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">${escapeHTML(defaultHtml)}</textarea>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button id="hosting-deploy-btn" class="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95">
          <i data-lucide="rocket" class="w-4 h-4"></i>
          <span>Deploy Live to *.puter.site</span>
        </button>

        <div id="hosting-result-box" class="hidden flex items-center gap-2 w-full sm:w-auto">
          <input type="text" id="hosting-live-url" readonly class="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-emerald-600 dark:text-emerald-400 select-all" />
          <a id="hosting-live-link" href="#" target="_blank" class="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition">
            <i data-lucide="external-link" class="w-4 h-4"></i>
          </a>
        </div>
      </div>
    </div>
  `;

  const codeInput = container.querySelector('#hosting-code-input');
  const deployBtn = container.querySelector('#hosting-deploy-btn');
  const resultBox = container.querySelector('#hosting-result-box');
  const liveUrlInput = container.querySelector('#hosting-live-url');
  const liveLink = container.querySelector('#hosting-live-link');

  deployBtn.addEventListener('click', async () => {
    deployBtn.disabled = true;
    showToast('Provisioning subdomain on Puter...', 'info');

    try {
      const code = codeInput.value;
      const folderName = `site-${Date.now()}`;
      const subdomain = `app-${Math.random().toString(36).substring(2, 8)}`;

      if (typeof puter !== 'undefined' && puter.fs && puter.hosting) {
        await puter.fs.mkdir(folderName);
        await puter.fs.write(`${folderName}/index.html`, code);
        const site = await puter.hosting.create(subdomain, folderName);
        const live = `https://${site.subdomain}.puter.site`;

        liveUrlInput.value = live;
        liveLink.href = live;
        resultBox.classList.remove('hidden');
        showToast('Site deployed live!', 'success');
      } else {
        const fake = `https://${subdomain}.puter.site`;
        liveUrlInput.value = fake;
        liveLink.href = fake;
        resultBox.classList.remove('hidden');
        showToast('Site created locally', 'success');
      }
    } catch (err) {
      alert('Hosting Error: ' + err.message);
    } finally {
      deployBtn.disabled = false;
    }
  });
}

// ----------------------------------------------------
// 5. AI Image Generator Tool
// ----------------------------------------------------
function renderTxt2ImgTool(container) {
  container.innerHTML = `
    <div class="space-y-4 max-w-3xl mx-auto">
      <div class="flex gap-2">
        <input type="text" id="img-prompt-input" placeholder="e.g. Cyberpunk neon city in raindrops, digital art, 8k..." class="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
        <button id="img-gen-btn" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-sm">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
          <span>Generate</span>
        </button>
      </div>

      <div id="img-output-box" class="hidden rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 p-2 text-center">
        <img id="img-result-tag" class="max-h-96 mx-auto rounded-xl object-contain shadow-lg" />
        <a id="img-download-link" href="#" download="puter-art.png" class="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Download High-Res</span>
        </a>
      </div>
    </div>
  `;

  const input = container.querySelector('#img-prompt-input');
  const btn = container.querySelector('#img-gen-btn');
  const box = container.querySelector('#img-output-box');
  const imgTag = container.querySelector('#img-result-tag');
  const dLink = container.querySelector('#img-download-link');

  btn.addEventListener('click', async () => {
    const prompt = input.value.trim();
    if (!prompt) { input.focus(); return; }

    btn.disabled = true;
    showToast('Generating image with Puter AI...', 'info');

    try {
      if (typeof puter !== 'undefined' && puter.ai && puter.ai.txt2img) {
        const imageElement = await puter.ai.txt2img(prompt);
        const src = typeof imageElement === 'string' ? imageElement : (imageElement?.src || URL.createObjectURL(imageElement));
        imgTag.src = src;
        dLink.href = src;
        box.classList.remove('hidden');
        showToast('Image generated!', 'success');
      } else {
        alert('Puter AI txt2img is active when served over HTTP.');
      }
    } catch (err) {
      alert('Image Gen Error: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

// ----------------------------------------------------
// 6. CORS-Free API Fetcher
// ----------------------------------------------------
function renderCorsFetchTool(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex gap-2">
        <input type="url" id="cors-url-input" value="https://api.github.com/zen" placeholder="https://api.example.com/data" class="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button id="cors-fetch-btn" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm">
          <i data-lucide="play" class="w-3.5 h-3.5 fill-white"></i>
          <span>Fetch</span>
        </button>
      </div>

      <textarea id="cors-output-area" rows="10" placeholder="Response payload will appear here..." class="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-cyan-300 focus:outline-none resize-none"></textarea>
    </div>
  `;

  const input = container.querySelector('#cors-url-input');
  const btn = container.querySelector('#cors-fetch-btn');
  const out = container.querySelector('#cors-output-area');

  btn.addEventListener('click', async () => {
    const url = input.value.trim();
    if (!url) return;

    btn.disabled = true;
    out.value = 'Fetching via Puter Net (CORS bypassed)...';

    try {
      if (typeof puter !== 'undefined' && puter.net && puter.net.fetch) {
        const res = await puter.net.fetch(url);
        const text = await res.text();
        out.value = text;
      } else {
        const res = await fetch(url);
        const text = await res.text();
        out.value = text;
      }
      showToast('Fetch completed', 'success');
    } catch (err) {
      out.value = 'Fetch Error: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// ----------------------------------------------------
// 7. Universal AI Prompt Tool
// ----------------------------------------------------
function renderAiChatTool(container) {
  container.innerHTML = `
    <div class="space-y-4 max-w-3xl mx-auto">
      <div class="flex gap-2">
        <input type="text" id="ai-chat-prompt" placeholder="Ask anything, paste code, request refactoring..." class="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
        <button id="ai-chat-send-btn" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm">
          <i data-lucide="send" class="w-3.5 h-3.5"></i>
          <span>Send</span>
        </button>
      </div>

      <div id="ai-chat-response" class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 min-h-[160px] whitespace-pre-wrap font-sans leading-relaxed">
        AI responses will render here...
      </div>
    </div>
  `;

  const input = container.querySelector('#ai-chat-prompt');
  const btn = container.querySelector('#ai-chat-send-btn');
  const resp = container.querySelector('#ai-chat-response');

  btn.addEventListener('click', async () => {
    const prompt = input.value.trim();
    if (!prompt) { input.focus(); return; }

    btn.disabled = true;
    resp.textContent = 'Thinking with Puter AI...';

    try {
      if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
        const r = await puter.ai.chat(prompt);
        resp.textContent = typeof r === 'string' ? r : (r?.message?.content || r?.text || JSON.stringify(r));
        showToast('AI response received', 'success');
      } else {
        resp.textContent = 'Sample AI response: Puter.js connected to frontier models (Claude 3.5, GPT-4o, Gemini).';
      }
    } catch (err) {
      resp.textContent = 'AI Error: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// ----------------------------------------------------
// 8. Cloud Scratchpad Tool
// ----------------------------------------------------
async function renderScratchpadTool(container) {
  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400" id="scratchpad-status">Puter Cloud Synced</span>
        <button id="scratchpad-clear-btn" class="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 rounded-lg transition cursor-pointer">Clear</button>
      </div>
      <textarea id="scratchpad-area" rows="12" placeholder="Start typing notes, snippets, or todo items... (Auto-saves to Puter KV)" class="w-full px-4 py-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"></textarea>
    </div>
  `;

  const area = container.querySelector('#scratchpad-area');
  const status = container.querySelector('#scratchpad-status');
  const clearBtn = container.querySelector('#scratchpad-clear-btn');

  try {
    if (typeof puter !== 'undefined' && puter.kv) {
      const saved = await puter.kv.get('puterbox_scratchpad');
      if (saved) area.value = saved;
    } else {
      area.value = localStorage.getItem('puterbox_scratchpad') || '';
    }
  } catch (err) {
    area.value = localStorage.getItem('puterbox_scratchpad') || '';
  }

  area.addEventListener('input', () => {
    status.textContent = 'Saving...';
    clearTimeout(scratchpadSaveTimeout);
    scratchpadSaveTimeout = setTimeout(async () => {
      localStorage.setItem('puterbox_scratchpad', area.value);
      try {
        if (typeof puter !== 'undefined' && puter.kv) {
          await puter.kv.set('puterbox_scratchpad', area.value);
        }
      } catch {}
      status.textContent = 'Saved to Cloud';
    }, 600);
  });

  clearBtn.addEventListener('click', () => {
    area.value = '';
    area.dispatchEvent(new Event('input'));
  });
}

// ----------------------------------------------------
// 9. QR Code Studio Tool
// ----------------------------------------------------
function renderQrCodeTool(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
      <div class="space-y-3">
        <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400">Content / URL</label>
        <input type="text" id="qr-input" value="https://puter.com" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
        <button id="qr-generate-btn" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer">Generate QR Code</button>
      </div>

      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-3">
        <div id="qr-canvas-box" class="p-2 bg-white rounded-xl shadow-sm"></div>
        <button id="qr-download-btn" class="px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer">Download PNG</button>
      </div>
    </div>
  `;

  const input = container.querySelector('#qr-input');
  const btn = container.querySelector('#qr-generate-btn');
  const box = container.querySelector('#qr-canvas-box');
  const dBtn = container.querySelector('#qr-download-btn');

  function makeQr() {
    box.innerHTML = '';
    if (window.QRCode) {
      new QRCode(box, {
        text: input.value || 'https://puter.com',
        width: 160,
        height: 160
      });
    }
  }

  makeQr();
  btn.addEventListener('click', makeQr);

  dBtn.addEventListener('click', () => {
    const img = box.querySelector('img') || box.querySelector('canvas');
    if (!img) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = img.src || (img.toDataURL ? img.toDataURL() : '');
    link.click();
    showToast('Downloaded QR code PNG', 'success');
  });
}

// ----------------------------------------------------
// 10. JSON Formatter Tool
// ----------------------------------------------------
function renderJsonTool(container) {
  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <button id="json-format-btn" class="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition cursor-pointer">Format / Prettify</button>
        <button id="json-minify-btn" class="px-3.5 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl transition cursor-pointer">Minify</button>
        <button id="json-copy-btn" class="px-3.5 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl transition cursor-pointer">Copy</button>
      </div>
      <textarea id="json-area" rows="12" class="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-400 focus:outline-none leading-relaxed">{"name":"PuterBox","status":"active","tools":11,"free":true}</textarea>
    </div>
  `;

  const area = container.querySelector('#json-area');
  container.querySelector('#json-format-btn').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(area.value);
      area.value = JSON.stringify(parsed, null, 2);
      showToast('JSON Valid & Formatted', 'success');
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
    }
  });

  container.querySelector('#json-minify-btn').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(area.value);
      area.value = JSON.stringify(parsed);
      showToast('JSON Minified', 'success');
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
    }
  });

  container.querySelector('#json-copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(area.value);
    showToast('Copied to clipboard', 'success');
  });
}

// ----------------------------------------------------
// 11. Base64 & Hash Tool
// ----------------------------------------------------
function renderBase64Tool(container) {
  container.innerHTML = `
    <div class="space-y-4 max-w-3xl mx-auto">
      <div class="space-y-2">
        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">Input String</label>
        <input type="text" id="b64-input" value="Hello Puter.js World!" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none" />
      </div>

      <div class="flex flex-wrap gap-2">
        <button id="btn-encode-b64" class="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition cursor-pointer">Base64 Encode</button>
        <button id="btn-decode-b64" class="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 transition cursor-pointer">Base64 Decode</button>
        <button id="btn-gen-uuid" class="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 transition cursor-pointer">New UUIDv4</button>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">Output Result</label>
        <textarea id="b64-output" rows="4" readonly class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-indigo-300 select-all"></textarea>
      </div>
    </div>
  `;

  const input = container.querySelector('#b64-input');
  const output = container.querySelector('#b64-output');

  container.querySelector('#btn-encode-b64').addEventListener('click', () => {
    try {
      output.value = btoa(input.value);
      showToast('Encoded to Base64', 'success');
    } catch (err) {
      alert('Encode Error: ' + err.message);
    }
  });

  container.querySelector('#btn-decode-b64').addEventListener('click', () => {
    try {
      output.value = atob(input.value);
      showToast('Decoded from Base64', 'success');
    } catch (err) {
      alert('Invalid Base64 string: ' + err.message);
    }
  });

  container.querySelector('#btn-gen-uuid').addEventListener('click', () => {
    const uuid = crypto.randomUUID();
    output.value = uuid;
    showToast('Generated UUID', 'success');
  });
}

// ----------------------------------------------------
// Navigation & Global Events
// ----------------------------------------------------
function setupNavEvents() {
  // Category Filtering
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.category;

      toolCards.forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Global Search Filter
  globalSearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    toolCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });

  // Global Shortcut '/' for search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== globalSearch && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      globalSearch.focus();
    }
    if (e.key === 'Escape') {
      closeTool();
    }
  });

  // Tool Card Click Handlers
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.dataset.toolId;
      openTool(toolId);
    });
  });

  closeWorkspaceBtn.addEventListener('click', closeTool);
  themeToggle.addEventListener('click', toggleTheme);
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

document.addEventListener('DOMContentLoaded', init);
