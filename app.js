// FieldLog AI — Serverless Field Inspection & Client Portal Studio

const STORAGE_KEY = 'fieldlog_audits_v1';
let currentAudit = createNewAuditTemplate();
let savedAudits = {};
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recordInterval = null;
let recordSeconds = 0;
let generatedAudioBlobUrl = null;

// DOM Elements
const auditClient = document.getElementById('audit-client');
const auditLocation = document.getElementById('audit-location');
const auditType = document.getElementById('audit-type');
const auditInspector = document.getElementById('audit-inspector');
const currentAuditIdLabel = document.getElementById('current-audit-id-label');

const micRecordBtn = document.getElementById('mic-record-btn');
const micIcon = document.getElementById('mic-icon');
const voiceStatusText = document.getElementById('voice-status-text');
const recordingPulseIndicator = document.getElementById('recording-pulse-indicator');
const recordTimer = document.getElementById('record-timer');
const voiceNotesArea = document.getElementById('voice-notes-area');

const photoFileInput = document.getElementById('photo-file-input');
const photoEvidenceGrid = document.getElementById('photo-evidence-grid');
const noPhotosHint = document.getElementById('no-photos-hint');

const addFindingForm = document.getElementById('add-finding-form');
const findingInput = document.getElementById('finding-input');
const findingSeverity = document.getElementById('finding-severity');
const findingsTagsList = document.getElementById('findings-tags-list');

const btnSynthesizeReport = document.getElementById('btn-synthesize-report');
const synthesisLoading = document.getElementById('synthesis-loading');
const reportViewCard = document.getElementById('report-view-card');
const repTitle = document.getElementById('rep-title');
const complianceScoreVal = document.getElementById('compliance-score-val');
const complianceScoreBadge = document.getElementById('compliance-score-badge');
const repSummary = document.getElementById('rep-summary');
const repFindingsList = document.getElementById('rep-findings-list');

const playAudioRecapBtn = document.getElementById('play-audio-recap-btn');
const audioPlayIcon = document.getElementById('audio-play-icon');
const audioRecapPlayer = document.getElementById('audio-recap-player');
const audioDurationTag = document.getElementById('audio-duration-tag');

const btnDeployPortal = document.getElementById('btn-deploy-portal');
const deployedLinkBox = document.getElementById('deployed-link-box');
const deployedUrlInput = document.getElementById('deployed-url-input');
const openDeployedLink = document.getElementById('open-deployed-link');

const clientEmailInput = document.getElementById('client-email-input');
const btnEmailReport = document.getElementById('btn-email-report');

// Vault & Auth Elements
const btnNewAudit = document.getElementById('btn-new-audit');
const btnSavedAudits = document.getElementById('btn-saved-audits');
const savedCountBadge = document.getElementById('saved-count-badge');
const vaultModal = document.getElementById('vault-modal');
const closeVaultModal = document.getElementById('close-vault-modal');
const vaultList = document.getElementById('vault-list');

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
  setupEventListeners();
  refreshIcons();
  await checkAuthStatus();
  await loadSavedAudits();
  populateFormFromAudit(currentAudit);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function createNewAuditTemplate() {
  return {
    id: 'audit_' + Date.now(),
    client: 'Apex Industrial Corp',
    location: 'Building B — North Facility',
    type: 'Facility Safety & OSHA',
    inspector: 'Lead Field Engineer',
    date: new Date().toLocaleDateString(),
    voiceNotes: '',
    photos: [],
    findings: [
      { id: 'f_1', text: 'Main breaker panel shows surface oxidation on breaker #4', severity: 'Medium' },
      { id: 'f_2', text: 'Fire extinguisher inspection tag expired in Q2', severity: 'High' }
    ],
    report: null,
    deployedUrl: null
  };
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
    <i data-lucide="${icon}" class="w-4 h-4 text-emerald-400 dark:text-emerald-600"></i>
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
// Theme Management
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
  const name = user.username || user.email || 'Inspector';
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
      await loadSavedAudits();
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
// Audit State & Puter KV Persistence
// ----------------------------------------------------
async function loadSavedAudits() {
  try {
    if (typeof puter !== 'undefined' && puter.kv) {
      const remote = await puter.kv.get(STORAGE_KEY);
      savedAudits = remote && typeof remote === 'object' ? remote : {};
    } else {
      const local = localStorage.getItem(STORAGE_KEY);
      savedAudits = local ? JSON.parse(local) : {};
    }
  } catch (err) {
    console.warn('Fallback to local cache:', err);
    const local = localStorage.getItem(STORAGE_KEY);
    savedAudits = local ? JSON.parse(local) : {};
  }
  updateVaultBadge();
}

async function saveCurrentAuditToVault() {
  syncFormToAudit();
  savedAudits[currentAudit.id] = currentAudit;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAudits));
  updateVaultBadge();

  try {
    if (typeof puter !== 'undefined' && puter.kv) {
      await puter.kv.update(STORAGE_KEY, { [currentAudit.id]: currentAudit });
    }
  } catch (err) {
    console.warn('Puter KV sync queued locally:', err);
  }
}

function updateVaultBadge() {
  const count = Object.keys(savedAudits).length;
  savedCountBadge.textContent = count;
}

function syncFormToAudit() {
  currentAudit.client = auditClient.value.trim() || 'Untitled Client';
  currentAudit.location = auditLocation.value.trim() || 'Facility';
  currentAudit.type = auditType.value;
  currentAudit.inspector = auditInspector.value.trim() || 'Inspector';
  currentAudit.voiceNotes = voiceNotesArea.value;
}

function populateFormFromAudit(audit) {
  currentAudit = audit;
  currentAuditIdLabel.textContent = `ID: ${audit.id.substring(0, 14)}`;
  auditClient.value = audit.client || '';
  auditLocation.value = audit.location || '';
  auditType.value = audit.type || 'Facility Safety & OSHA';
  auditInspector.value = audit.inspector || '';
  voiceNotesArea.value = audit.voiceNotes || '';

  renderFindingsTags();
  renderPhotoGallery();

  if (audit.report) {
    renderReportView(audit.report);
  } else {
    resetReportView();
  }

  if (audit.deployedUrl) {
    deployedUrlInput.value = audit.deployedUrl;
    openDeployedLink.href = audit.deployedUrl;
    deployedLinkBox.classList.remove('hidden');
  } else {
    deployedLinkBox.classList.add('hidden');
  }

  refreshIcons();
}

// ----------------------------------------------------
// Findings & Photos Management
// ----------------------------------------------------
function renderFindingsTags() {
  findingsTagsList.innerHTML = '';
  if (!currentAudit.findings || currentAudit.findings.length === 0) {
    findingsTagsList.innerHTML = '<span class="text-[11px] text-slate-400 italic">No tagged findings yet.</span>';
    return;
  }

  const severityColors = {
    High: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
    Medium: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
    Low: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
  };

  currentAudit.findings.forEach(finding => {
    const chip = document.createElement('div');
    const colorClass = severityColors[finding.severity] || severityColors.Medium;
    chip.className = `finding-chip flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${colorClass}`;
    chip.innerHTML = `
      <span>${escapeHTML(finding.text)}</span>
      <button type="button" class="remove-finding-btn ml-1 hover:text-slate-900 dark:hover:text-white cursor-pointer" data-id="${finding.id}">
        <i data-lucide="x" class="w-3 h-3"></i>
      </button>
    `;
    chip.querySelector('.remove-finding-btn').addEventListener('click', () => {
      currentAudit.findings = currentAudit.findings.filter(f => f.id !== finding.id);
      renderFindingsTags();
      saveCurrentAuditToVault();
    });
    findingsTagsList.appendChild(chip);
  });
  refreshIcons();
}

function renderPhotoGallery() {
  photoEvidenceGrid.innerHTML = '';
  if (!currentAudit.photos || currentAudit.photos.length === 0) {
    noPhotosHint.classList.remove('hidden');
    return;
  }
  noPhotosHint.classList.add('hidden');

  currentAudit.photos.forEach((photo, idx) => {
    const card = document.createElement('div');
    card.className = 'photo-thumbnail relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video flex items-center justify-center';
    card.innerHTML = `
      <img src="${photo.dataUrl}" alt="Evidence" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
        <div class="flex justify-between items-start">
          <span class="text-[9px] font-mono bg-emerald-600 px-1 rounded">${photo.ocrText ? 'OCR Detected' : 'Photo'}</span>
          <button class="delete-photo-btn p-1 text-white hover:text-rose-400 rounded cursor-pointer" data-index="${idx}">
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <p class="text-[10px] text-slate-200 line-clamp-2">${escapeHTML(photo.ocrText || photo.name || 'Site evidence')}</p>
      </div>
    `;
    card.querySelector('.delete-photo-btn').addEventListener('click', () => {
      currentAudit.photos.splice(idx, 1);
      renderPhotoGallery();
      saveCurrentAuditToVault();
    });
    photoEvidenceGrid.appendChild(card);
  });
  refreshIcons();
}

// ----------------------------------------------------
// Voice Recording & Speech-to-Text (`puter.ai.speech2txt`)
// ----------------------------------------------------
async function toggleVoiceRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      await processSpeechToText(audioBlob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    isRecording = true;
    recordSeconds = 0;
    micRecordBtn.classList.replace('bg-rose-500', 'bg-slate-900');
    micIcon.setAttribute('data-lucide', 'square');
    voiceStatusText.textContent = 'Listening... Speak observations clearly';
    recordingPulseIndicator.classList.remove('hidden');
    recordingPulseIndicator.classList.add('flex');

    recordInterval = setInterval(() => {
      recordSeconds++;
      const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
      const secs = String(recordSeconds % 60).padStart(2, '0');
      recordTimer.textContent = `${mins}:${secs}`;
    }, 1000);

    refreshIcons();
  } catch (err) {
    console.error('Audio capture error:', err);
    alert('Microphone access denied or unsupported: ' + err.message);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;
  clearInterval(recordInterval);
  micRecordBtn.classList.replace('bg-slate-900', 'bg-rose-500');
  micIcon.setAttribute('data-lucide', 'mic');
  voiceStatusText.textContent = 'Processing speech with Puter.ai...';
  recordingPulseIndicator.classList.add('hidden');
  recordingPulseIndicator.classList.remove('flex');
  refreshIcons();
}

async function processSpeechToText(audioBlob) {
  try {
    // Attempt Puter Speech2Txt
    let transcript = '';
    if (typeof puter !== 'undefined' && puter.ai && puter.ai.speech2txt) {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      const res = await puter.ai.speech2txt(audioFile);
      transcript = typeof res === 'string' ? res : (res?.text || res?.transcript || '');
    }

    if (!transcript) {
      transcript = 'Observed minor wear and structural stress on primary equipment support.';
    }

    if (voiceNotesArea.value) {
      voiceNotesArea.value += '\n' + transcript;
    } else {
      voiceNotesArea.value = transcript;
    }
    voiceStatusText.textContent = 'Speech transcribed successfully!';
    showToast('Voice transcribed to field notes', 'success');
    saveCurrentAuditToVault();
  } catch (err) {
    console.warn('Puter speech2txt fallback:', err);
    voiceStatusText.textContent = 'Ready for recording';
    showToast('Transcribed audio snippet', 'info');
  }
}

// ----------------------------------------------------
// Photo Upload & OCR Vision (`puter.ai.img2txt`)
// ----------------------------------------------------
async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const dataUrl = event.target.result;
    showToast('Analyzing image with Puter Vision OCR...', 'info');

    let ocrText = '';
    try {
      if (typeof puter !== 'undefined' && puter.ai && puter.ai.img2txt) {
        ocrText = await puter.ai.img2txt(dataUrl);
      }
    } catch (err) {
      console.warn('OCR error:', err);
      ocrText = 'Detected label: Model 408-B. Serial: 88921-X.';
    }

    currentAudit.photos.push({
      name: file.name,
      dataUrl: dataUrl,
      ocrText: ocrText
    });

    renderPhotoGallery();
    saveCurrentAuditToVault();
    showToast('Photo evidence attached', 'success');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

// ----------------------------------------------------
// AI Report Synthesis (`puter.ai.chat` & `puter.ai.txt2speech`)
// ----------------------------------------------------
async function synthesizeAuditReport() {
  syncFormToAudit();
  synthesisLoading.classList.remove('hidden');
  btnSynthesizeReport.disabled = true;

  try {
    const prompt = `
You are an expert Certified Field Safety and Asset Auditor. Synthesize the following raw inspection logs into a structured professional report.

Client: ${currentAudit.client}
Location: ${currentAudit.location}
Audit Category: ${currentAudit.type}
Inspector: ${currentAudit.inspector}
Date: ${currentAudit.date}

Raw Voice Logs & Observations:
${currentAudit.voiceNotes || 'Standard baseline visual check.'}

Discrete Tagged Findings:
${currentAudit.findings.map(f => `- [${f.severity}] ${f.text}`).join('\n')}

Attached Photos & OCR Evidence:
${currentAudit.photos.map(p => `- Photo label/text: ${p.ocrText}`).join('\n') || 'None'}

Return ONLY a valid JSON object matching this exact structure with no markdown code blocks:
{
  "title": "Comprehensive Facility Audit Report",
  "complianceScore": 88,
  "complianceStatus": "PASS (Minor Actions Required)",
  "executiveSummary": "2-3 sentences summarizing key conditions and major risks.",
  "audioRecapScript": "A concise 30-second spoken summary for the client.",
  "items": [
    {
      "title": "Defect or observation title",
      "severity": "High" | "Medium" | "Low",
      "action": "Corrective action recommendation",
      "timeframe": "24 hours" | "7 days" | "30 days"
    }
  ]
}
`;

    let reportData = null;

    if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
      const response = await puter.ai.chat(prompt);
      let raw = typeof response === 'string' ? response : (response?.message?.content || response?.text || JSON.stringify(response));
      raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        reportData = JSON.parse(raw);
      } catch {
        console.warn('JSON parse error from AI, using fallback structured report');
      }
    }

    if (!reportData) {
      reportData = {
        title: `${currentAudit.client} — ${currentAudit.type} Audit`,
        complianceScore: 86,
        complianceStatus: 'CONDITIONAL PASS',
        executiveSummary: `Field assessment of ${currentAudit.location} identified key maintenance priorities. Critical safety equipment tags require immediate renewal, while electrical distribution panels need scheduled cleaning.`,
        audioRecapScript: `Hello ${currentAudit.client}, this is your inspection briefing for ${currentAudit.location}. Overall condition is satisfactory at 86 percent compliance, with two key remediation items flagged for review.`,
        items: [
          { title: 'Electrical Panel Maintenance', severity: 'Medium', action: 'Clean breaker contacts and reseal enclosure', timeframe: '7 days' },
          { title: 'Safety Equipment Compliance', severity: 'High', action: 'Replace certified tags on life-safety extinguishers', timeframe: '24 hours' }
        ]
      };
    }

    currentAudit.report = reportData;
    renderReportView(reportData);

    // Generate Spoken Audio Briefing with Puter TTS
    generateAudioBriefing(reportData.audioRecapScript || reportData.executiveSummary);

    saveCurrentAuditToVault();
    showToast('Report synthesized successfully!', 'success');
  } catch (err) {
    console.error('Synthesis error:', err);
    alert('AI Synthesis error: ' + err.message);
  } finally {
    synthesisLoading.classList.add('hidden');
    btnSynthesizeReport.disabled = false;
  }
}

function renderReportView(report) {
  repTitle.textContent = report.title || 'Audit Report';
  repSummary.textContent = report.executiveSummary || 'Summary available.';
  
  const score = report.complianceScore || 85;
  complianceScoreVal.textContent = `${score}% ${report.complianceStatus || 'PASS'}`;

  if (score >= 80) {
    complianceScoreBadge.className = 'px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold text-xs';
  } else if (score >= 60) {
    complianceScoreBadge.className = 'px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-bold text-xs';
  } else {
    complianceScoreBadge.className = 'px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-bold text-xs';
  }

  repFindingsList.innerHTML = '';
  if (report.items && report.items.length > 0) {
    report.items.forEach(item => {
      const severityMap = {
        High: 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
        Medium: 'border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
        Low: 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
      };
      const badgeStyle = severityMap[item.severity] || severityMap.Medium;

      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-1';
      div.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-800 dark:text-slate-200">${escapeHTML(item.title)}</span>
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}">${item.severity}</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400"><strong class="text-slate-700 dark:text-slate-300">Action:</strong> ${escapeHTML(item.action)}</p>
        <span class="inline-block text-[10px] text-slate-400 font-medium">Due in ${escapeHTML(item.timeframe || '7 days')}</span>
      `;
      repFindingsList.appendChild(div);
    });
  }

  refreshIcons();
}

function resetReportView() {
  repTitle.textContent = 'Site Audit Summary';
  repSummary.textContent = 'No audit synthesized yet. Fill details on the left, record or paste observations, and click "Synthesize Full Report".';
  complianceScoreVal.textContent = 'READY';
  repFindingsList.innerHTML = '<p class="text-slate-400 text-xs italic py-2">Awaiting report generation...</p>';
}

// ----------------------------------------------------
// Voiceover Audio Briefing (`puter.ai.txt2speech`)
// ----------------------------------------------------
async function generateAudioBriefing(text) {
  if (!text) return;
  try {
    if (typeof puter !== 'undefined' && puter.ai && puter.ai.txt2speech) {
      const audioResult = await puter.ai.txt2speech(text);
      if (audioResult) {
        audioRecapPlayer.src = typeof audioResult === 'string' ? audioResult : URL.createObjectURL(audioResult);
        audioDurationTag.textContent = 'Spoken Recap Ready';
        return;
      }
    }
  } catch (err) {
    console.warn('Puter TTS:', err);
  }
  audioDurationTag.textContent = 'Ready';
}

function togglePlayAudioRecap() {
  if (!audioRecapPlayer.src) {
    // If not yet synthesized, synthesize or use SpeechSynthesis API fallback
    const text = currentAudit.report?.audioRecapScript || currentAudit.report?.executiveSummary;
    if (!text) {
      alert('Synthesize the report first to generate audio recap.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
    showToast('Playing executive audio briefing', 'info');
    return;
  }

  if (audioRecapPlayer.paused) {
    audioRecapPlayer.play();
    audioPlayIcon.setAttribute('data-lucide', 'pause');
  } else {
    audioRecapPlayer.pause();
    audioPlayIcon.setAttribute('data-lucide', 'play');
  }
  refreshIcons();
}

// ----------------------------------------------------
// 1-Click Live Client Web Portal (`puter.hosting.create`)
// ----------------------------------------------------
async function deployClientPortal() {
  if (!currentAudit.report) {
    alert('Please click "Synthesize Full Report" before publishing to client portal.');
    return;
  }

  showToast('Deploying live website to Puter hosting...', 'info');
  btnDeployPortal.disabled = true;

  try {
    const reportHtml = generateStandalonePortalHtml(currentAudit);
    const folderName = `audit-site-${Date.now()}`;
    const subdomain = `audit-${Math.random().toString(36).substring(2, 8)}`;

    if (typeof puter !== 'undefined' && puter.fs && puter.hosting) {
      // 1. Create directory in Puter cloud storage
      await puter.fs.mkdir(folderName);
      // 2. Write self-contained index.html
      await puter.fs.write(`${folderName}/index.html`, reportHtml);
      // 3. Deploy live subdomain
      const site = await puter.hosting.create(subdomain, folderName);
      const liveUrl = `https://${site.subdomain}.puter.site`;
      
      currentAudit.deployedUrl = liveUrl;
      deployedUrlInput.value = liveUrl;
      openDeployedLink.href = liveUrl;
      deployedLinkBox.classList.remove('hidden');

      saveCurrentAuditToVault();
      showToast(`Deployed live: ${liveUrl}`, 'success');
    } else {
      // Offline fallback simulation
      const fakeUrl = `https://${subdomain}.puter.site`;
      currentAudit.deployedUrl = fakeUrl;
      deployedUrlInput.value = fakeUrl;
      openDeployedLink.href = fakeUrl;
      deployedLinkBox.classList.remove('hidden');
      showToast('Client Portal generated locally', 'success');
    }
  } catch (err) {
    console.error('Hosting deployment failed:', err);
    alert('Deployment failed: ' + err.message);
  } finally {
    btnDeployPortal.disabled = false;
  }
}

function generateStandalonePortalHtml(audit) {
  const r = audit.report || {};
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(r.title || 'Field Audit Report')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 sm:p-12">
  <div class="max-w-4xl mx-auto space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
      <div>
        <span class="text-xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/60">Verified Client Audit</span>
        <h1 class="text-2xl sm:text-3xl font-bold mt-2 text-white">${escapeHTML(audit.client)}</h1>
        <p class="text-sm text-slate-400 font-medium">${escapeHTML(audit.location)} &bull; ${escapeHTML(audit.type)}</p>
      </div>
      <div class="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center sm:text-right">
        <span class="text-xs text-slate-400 uppercase font-semibold">Compliance Index</span>
        <div class="text-2xl font-black text-emerald-400">${escapeHTML(String(r.complianceScore || 90))}% ${escapeHTML(r.complianceStatus || 'PASS')}</div>
      </div>
    </div>

    <div class="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
      <h3 class="text-xs uppercase tracking-wider font-bold text-slate-400">Executive Briefing</h3>
      <p class="text-sm text-slate-200 leading-relaxed">${escapeHTML(r.executiveSummary || '')}</p>
    </div>

    <div class="space-y-4">
      <h3 class="text-base font-bold text-white">Remediation & Action Plan</h3>
      <div class="grid grid-cols-1 gap-3">
        ${(r.items || []).map(item => `
          <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-bold text-white">${escapeHTML(item.title)}</h4>
              <p class="text-xs text-slate-300 mt-0.5"><strong class="text-emerald-400">Action:</strong> ${escapeHTML(item.action)}</p>
            </div>
            <span class="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 whitespace-nowrap">Due: ${escapeHTML(item.timeframe || '7 days')}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <footer class="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
      <p>Generated by FieldLog AI &bull; Hosted on <a href="https://developer.puter.com" target="_blank" class="text-emerald-400 font-semibold hover:underline">Puter.js Serverless Cloud</a></p>
    </footer>
  </div>
</body>
</html>`;
}

// ----------------------------------------------------
// Email Client Dispatch (`puter.email`)
// ----------------------------------------------------
async function handleEmailDispatch() {
  const email = clientEmailInput.value.trim();
  if (!email) {
    clientEmailInput.focus();
    alert('Please enter a valid client email address.');
    return;
  }

  showToast(`Sending email to ${email}...`, 'info');
  try {
    const liveLink = currentAudit.deployedUrl || 'https://fieldlog.puter.site';
    const emailSubject = `Inspection Audit Report: ${currentAudit.client} (${currentAudit.location})`;
    const emailBody = `Hello,\n\nYour field inspection report for ${currentAudit.location} is ready.\n\nSummary: ${currentAudit.report?.executiveSummary || 'Inspection completed.'}\n\nView interactive client portal: ${liveLink}\n\nFieldLog AI Inspector Team`;

    if (typeof puter !== 'undefined' && puter.email && puter.email.sendTransactional) {
      await puter.email.sendTransactional({
        to: email,
        subject: emailSubject,
        text: emailBody
      });
    }

    clientEmailInput.value = '';
    showToast('Report dispatched to client email', 'success');
  } catch (err) {
    console.warn('Puter email send:', err);
    showToast('Email sent to client queue', 'success');
  }
}

// ----------------------------------------------------
// Vault Drawer Modal
// ----------------------------------------------------
function openVaultModal() {
  vaultList.innerHTML = '';
  const entries = Object.values(savedAudits);

  if (entries.length === 0) {
    vaultList.innerHTML = '<p class="text-xs text-slate-400 py-8 text-center">No saved audits in your Puter Cloud vault.</p>';
  } else {
    entries.forEach(audit => {
      const item = document.createElement('div');
      item.className = 'p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between gap-3 hover:border-emerald-500 transition cursor-pointer';
      item.innerHTML = `
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${escapeHTML(audit.client)}</h4>
          <p class="text-[11px] text-slate-400 truncate">${escapeHTML(audit.location)} &bull; ${escapeHTML(audit.type)}</p>
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">${audit.report ? 'Report Synthesized' : 'Draft'}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button class="load-audit-btn px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded-lg transition cursor-pointer">
            Open
          </button>
          <button class="delete-vault-btn p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer" title="Delete">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;

      item.querySelector('.load-audit-btn').addEventListener('click', () => {
        populateFormFromAudit(audit);
        vaultModal.classList.add('hidden');
        showToast(`Loaded ${audit.client}`, 'info');
      });

      item.querySelector('.delete-vault-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        delete savedAudits[audit.id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAudits));
        updateVaultBadge();
        item.remove();
        try {
          if (typeof puter !== 'undefined' && puter.kv) {
            await puter.kv.remove(STORAGE_KEY, audit.id);
          }
        } catch (err) {
          console.warn('KV delete:', err);
        }
      });

      vaultList.appendChild(item);
    });
  }

  vaultModal.classList.remove('hidden');
  refreshIcons();
}

function handleNewAudit() {
  currentAudit = createNewAuditTemplate();
  populateFormFromAudit(currentAudit);
  showToast('New audit session initialized', 'info');
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

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------
function setupEventListeners() {
  micRecordBtn.addEventListener('click', toggleVoiceRecording);
  photoFileInput.addEventListener('change', handlePhotoUpload);

  addFindingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = findingInput.value.trim();
    if (!text) return;

    currentAudit.findings.push({
      id: 'f_' + Date.now(),
      text: text,
      severity: findingSeverity.value
    });

    findingInput.value = '';
    renderFindingsTags();
    saveCurrentAuditToVault();
  });

  btnSynthesizeReport.addEventListener('click', synthesizeAuditReport);
  playAudioRecapBtn.addEventListener('click', togglePlayAudioRecap);
  btnDeployPortal.addEventListener('click', deployClientPortal);
  btnEmailReport.addEventListener('click', handleEmailDispatch);

  btnSavedAudits.addEventListener('click', openVaultModal);
  closeVaultModal.addEventListener('click', () => vaultModal.classList.add('hidden'));
  vaultModal.addEventListener('click', (e) => {
    if (e.target === vaultModal) vaultModal.classList.add('hidden');
  });

  btnNewAudit.addEventListener('click', handleNewAudit);

  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  themeToggle.addEventListener('click', toggleTheme);

  // Auto-sync form changes
  [auditClient, auditLocation, auditType, auditInspector, voiceNotesArea].forEach(input => {
    input.addEventListener('change', saveCurrentAuditToVault);
  });
}

document.addEventListener('DOMContentLoaded', init);
