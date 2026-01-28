// ===== Flow Auto Generator V2 - Popup Script =====

// Default settings
const DEFAULT_SETTINGS = {
  delay: 20,
  repeat: 1,
  prompts: '',
  captionDelay: 1000
};

// State
let state = {
  isConnected: false,
  isProcessing: false,
  isCaptioning: false,
  generated: 0,
  downloaded: 0
};

// Caption folder state
let dirHandle = null;
let imageHandles = [];

// DOM Elements
const elements = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  await loadSavedState();
  await checkConnection();
  setupEventListeners();
});

// Initialize DOM elements
function initElements() {
  elements.connectionStatus = document.getElementById('connectionStatus');
  elements.promptsInput = document.getElementById('promptsInput');
  elements.promptCount = document.getElementById('promptCount');
  elements.delayInput = document.getElementById('delayInput');
  elements.repeatInput = document.getElementById('repeatInput');
  elements.btnGenerate = document.getElementById('btnGenerate');
  elements.btnStop = document.getElementById('btnStop');
  elements.progressSection = document.getElementById('progressSection');
  elements.progressText = document.getElementById('progressText');
  elements.progressPercent = document.getElementById('progressPercent');
  elements.progressFill = document.getElementById('progressFill');
  elements.statGenerated = document.getElementById('statGenerated');
  elements.statDownloaded = document.getElementById('statDownloaded');
  elements.fileInput = document.getElementById('fileInput');
  elements.btnLoadFile = document.getElementById('btnLoadFile');
  elements.btnClearPrompts = document.getElementById('btnClearPrompts');
  // Caption elements
  elements.btnPickFolder = document.getElementById('btnPickFolder');
  elements.folderInfo = document.getElementById('folderInfo');
  elements.captionDelay = document.getElementById('captionDelay');
  elements.btnGenerateCaptions = document.getElementById('btnGenerateCaptions');
  elements.captionLog = document.getElementById('captionLog');
}

// Check connection to Flow page
function checkConnection() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (!tab || !tab.url) {
      setConnectionStatus('error');
      return;
    }

    if (!tab.url.includes('labs.google')) {
      setConnectionStatus('not-flow');
      return;
    }

    // Store tab ID for later use
    state.currentTabId = tab.id;

    // Try to ping content script with callback
    chrome.tabs.sendMessage(tab.id, { type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not responding, injecting...');
        // Try to inject content script programmatically
        injectContentScript(tab.id);
        return;
      }

      if (response && response.status === 'OK') {
        console.log('Connected to content script!');
        setConnectionStatus('connected');
      } else {
        console.log('Invalid response, injecting script...');
        injectContentScript(tab.id);
      }
    });
  });
}

// Inject content script programmatically
function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }).then(() => {
    console.log('Content script injected successfully');
    // Wait a bit then check connection again
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
        if (response && response.status === 'OK') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      });
    }, 500);
  }).catch((error) => {
    console.error('Failed to inject content script:', error);
    setConnectionStatus('disconnected');
  });
}

// Set connection status
function setConnectionStatus(status) {
  const badge = elements.connectionStatus;
  const statusText = badge.querySelector('.status-text');

  badge.className = 'status-badge';
  state.isConnected = false;

  switch (status) {
    case 'connected':
      badge.classList.add('connected');
      statusText.textContent = 'เชื่อมต่อแล้ว ✓';
      state.isConnected = true;
      elements.btnGenerate.disabled = false;
      break;
    case 'disconnected':
      statusText.textContent = 'รอเชื่อมต่อ...';
      elements.btnGenerate.disabled = true;
      break;
    case 'not-flow':
      badge.classList.add('error');
      statusText.textContent = 'ไม่ใช่หน้า Flow';
      elements.btnGenerate.disabled = true;
      break;
    case 'error':
      badge.classList.add('error');
      statusText.textContent = 'เกิดข้อผิดพลาด';
      elements.btnGenerate.disabled = true;
      break;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Update prompt count and save state on input
  elements.promptsInput.addEventListener('input', () => {
    updatePromptCount();
    saveState();
  });

  // Save state when delay or repeat changes
  elements.delayInput.addEventListener('input', saveState);
  elements.repeatInput.addEventListener('input', () => {
    updatePromptCount();
    saveState();
  });

  // Generate button
  elements.btnGenerate.addEventListener('click', handleGenerate);

  // Stop button
  elements.btnStop.addEventListener('click', handleStop);

  // Load file button
  elements.btnLoadFile.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileLoad);

  // Clear prompts button
  elements.btnClearPrompts.addEventListener('click', handleClearPrompts);

  // Caption buttons
  elements.btnPickFolder.addEventListener('click', handlePickFolder);
  elements.btnGenerateCaptions.addEventListener('click', handleGenerateCaptions);

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(handleMessage);

  // Retry connection every 2 seconds if not connected
  setInterval(() => {
    if (!state.isConnected && !state.isProcessing) {
      checkConnection();
    }
  }, 2000);
}

// Update prompt count display
function updatePromptCount() {
  if (!elements.promptsInput || !elements.repeatInput || !elements.promptCount) return;

  const text = elements.promptsInput.value.trim();
  const prompts = text ? text.split('\n').filter(p => p.trim()) : [];
  const repeat = parseInt(elements.repeatInput.value) || 1;
  const total = prompts.length * repeat;
  elements.promptCount.textContent = `${prompts.length} prompts × ${repeat} = ${total} งาน`;
}

// Handle generate button click
async function handleGenerate() {
  if (!state.isConnected) {
    showToast('กรุณาเปิดหน้า Google Flow ก่อน', 'warning');
    return;
  }

  const text = elements.promptsInput.value.trim();
  if (!text) {
    showToast('กรุณาใส่ prompt', 'warning');
    return;
  }

  const basePrompts = text.split('\n').filter(p => p.trim());
  const repeat = parseInt(elements.repeatInput.value) || 1;
  const delay = (parseInt(elements.delayInput.value) || 5) * 1000;

  // Create full prompt list with repeats
  const prompts = [];
  for (let r = 0; r < repeat; r++) {
    for (const prompt of basePrompts) {
      prompts.push(prompt.trim());
    }
  }

  console.log(`Starting generation: ${prompts.length} prompts`);

  // Update UI
  state.isProcessing = true;
  state.generated = 0;
  elements.btnGenerate.disabled = true;
  elements.btnStop.disabled = false;
  elements.progressSection.style.display = 'block';
  updateProgress(0, prompts.length);

  // Send to content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, {
      type: 'GENERATE',
      prompts: prompts,
      settings: { delay }
    });
    showToast(`เริ่มสร้าง ${prompts.length} ภาพ`, 'success');
  } catch (error) {
    console.error('Error starting generation:', error);
    showToast('เกิดข้อผิดพลาด', 'error');
    resetUI();
  }
}

// Handle stop button click
async function handleStop() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: 'STOP' });
    showToast('หยุดการสร้างแล้ว', 'warning');
    resetUI();
  } catch (error) {
    console.error('Error stopping:', error);
  }
}

// Handle messages from content/background
function handleMessage(message, sender, sendResponse) {
  console.log('Popup received:', message.type);

  switch (message.type) {
    case 'PROGRESS':
      state.generated = message.current;
      updateProgress(message.current, message.total);
      elements.statGenerated.textContent = message.current;
      break;

    case 'DOWNLOAD_COMPLETE':
      state.downloaded++;
      elements.statDownloaded.textContent = state.downloaded;
      break;

    case 'GENERATION_COMPLETE':
      showToast('สร้างภาพเสร็จทั้งหมดแล้ว! 🎉', 'success');
      resetUI();
      break;

    case 'ERROR':
      showToast(message.error || 'เกิดข้อผิดพลาด', 'error');
      break;
  }
}

// Update progress bar
function updateProgress(current, total) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  elements.progressText.textContent = `กำลังสร้าง ${current}/${total}`;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressFill.style.width = `${percent}%`;
}

// Reset UI after completion
function resetUI() {
  state.isProcessing = false;
  elements.btnGenerate.disabled = !state.isConnected;
  elements.btnStop.disabled = true;
  elements.progressSection.style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Handle file load
function handleFileLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Ignore empty lines and comments

    if (lines.length > 0) {
      // Append to existing prompts or replace
      const existingPrompts = elements.promptsInput.value.trim();
      if (existingPrompts) {
        elements.promptsInput.value = existingPrompts + '\n' + lines.join('\n');
      } else {
        elements.promptsInput.value = lines.join('\n');
      }

      updatePromptCount();
      saveState();
      showToast(`โหลด ${lines.length} prompts จากไฟล์`, 'success');
    } else {
      showToast('ไฟล์ว่างเปล่า', 'warning');
    }
  };

  reader.onerror = () => {
    showToast('ไม่สามารถอ่านไฟล์ได้', 'error');
  };

  reader.readAsText(file);

  // Reset file input so same file can be selected again
  event.target.value = '';
}

// Handle clear prompts
function handleClearPrompts() {
  elements.promptsInput.value = '';
  updatePromptCount();
  saveState();
  showToast('ล้าง prompts แล้ว', 'info');
}

// ===== Caption Functions =====

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Log to caption log
function logCaption(message, type = 'info') {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${message}`;
  const div = document.createElement('div');
  div.textContent = line;
  if (type === 'ok') div.className = 'log-ok';
  if (type === 'error') div.className = 'log-error';
  elements.captionLog.appendChild(div);
  elements.captionLog.scrollTop = elements.captionLog.scrollHeight;
}

// Handle folder pick
async function handlePickFolder() {
  try {
    const handle = await window.showDirectoryPicker({ id: 'flow-caption-folder', mode: 'read' });
    dirHandle = handle;
    imageHandles = [];

    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        const name = entry.name.toLowerCase();
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
          imageHandles.push(entry);
        }
      }
    }

    // Sort by name
    imageHandles.sort((a, b) => a.name.localeCompare(b.name));

    elements.folderInfo.textContent = `${handle.name} (${imageHandles.length} รูป)`;
    elements.btnGenerateCaptions.disabled = imageHandles.length === 0;
    showToast(`เลือกโฟลเดอร์: ${handle.name} มี ${imageHandles.length} รูปภาพ`, 'success');
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast(`ข้อผิดพลาด: ${err.message}`, 'error');
    }
  }
}

// Handle generate captions
async function handleGenerateCaptions() {
  if (!dirHandle || imageHandles.length === 0) {
    showToast('กรุณาเลือกโฟลเดอร์ที่มีรูปภาพก่อน', 'warning');
    return;
  }

  state.isCaptioning = true;
  elements.btnGenerateCaptions.disabled = true;
  elements.btnPickFolder.disabled = true;
  elements.captionLog.style.display = 'block';
  elements.captionLog.innerHTML = '';

  const delayMs = Math.max(0, parseInt(elements.captionDelay.value, 10) || 1000);
  logCaption(`เริ่มสร้าง captions สำหรับ ${imageHandles.length} รูป`);

  const outputs = [];

  for (let i = 0; i < imageHandles.length; i++) {
    const handle = imageHandles[i];
    try {
      const file = await handle.getFile();
      logCaption(`(${i + 1}/${imageHandles.length}) กำลังอ่าน ${file.name}...`);

      const buffer = await readFileAsArrayBuffer(file);
      const base64 = arrayBufferToBase64(buffer);

      const timestamp = Date.now();
      const payload = {
        json: {
          clientContext: {
            sessionId: `;${timestamp}`,
            workflowId: '9e6e4c28-6f86-4e1a-8f99-4a56e8524eda'
          },
          captionInput: {
            candidatesCount: 1,
            mediaInput: {
              mediaCategory: 'MEDIA_CATEGORY_SUBJECT',
              rawBytes: base64
            }
          }
        }
      };

      logCaption(`กำลังส่ง ${file.name} ไปยัง Flow...`);
      const response = await chrome.runtime.sendMessage({ type: 'sendCaption', payload });

      if (!response?.ok) {
        const errorMsg = response?.error || 'Unknown error';
        logCaption(`❌ ${file.name}: ${errorMsg}`, 'error');
        outputs.push({ file: file.name, output: `ERROR: ${errorMsg}` });
      } else {
        const output = response.data?.result?.data?.json?.result?.candidates?.[0]?.output || '';
        outputs.push({ file: file.name, output });
        logCaption(`✅ ${file.name} สำเร็จ`, 'ok');
      }

      if (i < imageHandles.length - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    } catch (err) {
      logCaption(`❌ ${handle.name}: ${err.message}`, 'error');
    }
  }

  // Extract prompts and add to textarea
  const prompts = outputs
    .map(r => String(r.output || '').replace(/\r?\n/g, ' ').trim())
    .filter(p => p && !p.startsWith('ERROR:'));

  if (prompts.length > 0) {
    const existingPrompts = elements.promptsInput.value.trim();
    if (existingPrompts) {
      elements.promptsInput.value = existingPrompts + '\n' + prompts.join('\n');
    } else {
      elements.promptsInput.value = prompts.join('\n');
    }
    updatePromptCount();
    saveState();
    logCaption(`🎉 เสร็จสิ้น! ได้ ${prompts.length} prompts`, 'ok');
    showToast(`ได้ ${prompts.length} prompts จาก ${imageHandles.length} รูป`, 'success');
  } else {
    logCaption('ไม่สามารถสร้าง prompts ได้', 'error');
    showToast('ไม่สามารถสร้าง prompts ได้', 'error');
  }

  state.isCaptioning = false;
  elements.btnGenerateCaptions.disabled = false;
  elements.btnPickFolder.disabled = false;
}

// Save state to chrome.storage.local
function saveState() {
  const data = {
    prompts: elements.promptsInput.value,
    delay: parseInt(elements.delayInput.value) || DEFAULT_SETTINGS.delay,
    repeat: parseInt(elements.repeatInput.value) || DEFAULT_SETTINGS.repeat,
    generated: state.generated,
    downloaded: state.downloaded
  };

  chrome.storage.local.set({ flowAutoState: data }, () => {
    console.log('State saved:', data);
  });
}

// Load saved state from chrome.storage.local
async function loadSavedState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['flowAutoState'], (result) => {
      if (result.flowAutoState) {
        const data = result.flowAutoState;
        console.log('Loaded state:', data);

        // Restore prompts
        if (data.prompts) {
          elements.promptsInput.value = data.prompts;
        }

        // Restore delay (with default fallback)
        elements.delayInput.value = data.delay || DEFAULT_SETTINGS.delay;

        // Restore repeat (with default fallback)
        elements.repeatInput.value = data.repeat || DEFAULT_SETTINGS.repeat;

        // Restore stats
        if (data.generated !== undefined) {
          state.generated = data.generated;
          elements.statGenerated.textContent = data.generated;
        }
        if (data.downloaded !== undefined) {
          state.downloaded = data.downloaded;
          elements.statDownloaded.textContent = data.downloaded;
        }

        updatePromptCount();
      } else {
        // Set default values if no saved state
        elements.delayInput.value = DEFAULT_SETTINGS.delay;
        elements.repeatInput.value = DEFAULT_SETTINGS.repeat;
      }
      resolve();
    });
  });
}
