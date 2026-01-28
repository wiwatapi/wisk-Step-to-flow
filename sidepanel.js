// ===== Flow Auto V3 - Unified Side Panel =====

(function () {
  'use strict';

  // Prevent double injection
  if (document.getElementById('flow-auto-sidepanel')) {
    console.log('🎨 Flow Auto V3 - Already injected');
    return;
  }

  // Check if we're on the correct page
  const currentUrl = window.location.href;
  if (!currentUrl.includes('labs.google')) {
    console.log('🎨 Flow Auto V3 - Not on labs.google, skipping');
    return;
  }

  console.log('🎨 Flow Auto V3 - Loading...');

  // State
  let dirHandle = null;
  let imageHandles = [];
  let isCaptioning = false;
  let isProcessing = false;
  let isPanelVisible = false;

  // CSS Styles
  const panelCSS = `
    /* Side Panel */
    .flow-sidepanel {
      position: fixed;
      top: 0;
      right: -320px;
      width: 320px;
      height: 100vh;
      background: linear-gradient(180deg, #1e3a5f 0%, #0f2847 100%);
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      transition: right 0.3s ease;
    }

    .flow-sidepanel.visible {
      right: 0;
    }

    .flow-sp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .flow-sp-logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .flow-sp-logo-icon {
      font-size: 18px;
    }

    .flow-sp-logo-text {
      font-size: 15px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .flow-sp-close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: rgba(255, 255, 255, 0.7);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .flow-sp-close-btn:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .flow-sp-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px;
    }

    .flow-sp-section-title {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .flow-sp-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 16px 0;
    }

    .flow-sp-section {
      margin-bottom: 12px;
    }

    .flow-sp-folder-info {
      display: block;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 6px;
    }

    .flow-sp-label {
      display: block;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 4px;
    }

    .flow-sp-input {
      width: 100%;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #ffffff;
      font-size: 13px;
    }

    .flow-sp-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .flow-sp-textarea {
      width: 100%;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #ffffff;
      font-size: 12px;
      resize: vertical;
      min-height: 60px;
    }

    .flow-sp-textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .flow-sp-textarea::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .flow-sp-prompt-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }

    .flow-sp-prompt-info {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      text-align: right;
      margin-top: 4px;
    }

    .flow-sp-settings-row {
      display: flex;
      gap: 10px;
    }

    .flow-sp-setting {
      flex: 1;
    }

    .flow-sp-stats {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .flow-sp-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      flex: 1;
    }

    .flow-sp-stat-label {
      color: rgba(255, 255, 255, 0.6);
    }

    .flow-sp-stat-value {
      font-weight: 600;
      color: #60a5fa;
    }

    .flow-sp-stats-row {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }

    .flow-sp-stat-box {
      flex: 1;
      text-align: center;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }

    .flow-sp-stat-number {
      display: block;
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .flow-sp-stat-text {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
    }

    .flow-sp-progress-section {
      margin-bottom: 10px;
    }

    .flow-sp-progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 4px;
      color: rgba(255, 255, 255, 0.7);
    }

    .flow-sp-progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .flow-sp-progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .flow-sp-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .flow-sp-btn {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .flow-sp-btn-small {
      padding: 6px 10px;
      font-size: 11px;
      flex: 1;
    }

    .flow-sp-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .flow-sp-btn-folder {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }

    .flow-sp-btn-folder:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    }

    .flow-sp-btn-start {
      background: #ffffff;
      color: #1e3a5f;
    }

    .flow-sp-btn-start:hover:not(:disabled) {
      background: #f0f9ff;
      transform: translateY(-1px);
    }

    .flow-sp-btn-gen {
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      color: white;
    }

    .flow-sp-btn-gen:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }

    .flow-sp-btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .flow-sp-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .flow-sp-btn-stop {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .flow-sp-btn-stop:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }

    .flow-sp-btn-clear {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .flow-sp-log-section {
      margin-bottom: 10px;
    }

    .flow-sp-log {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      padding: 8px;
      font-size: 10px;
      font-family: monospace;
      overflow-y: auto;
      color: rgba(255, 255, 255, 0.7);
      max-height: 100px;
      min-height: 50px;
    }

    .flow-sp-log .log-ok { color: #34d399; }
    .flow-sp-log .log-error { color: #f87171; }

    .flow-sp-log-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }

    .flow-sp-footer {
      padding: 10px 16px;
      background: rgba(0, 0, 0, 0.2);
      font-size: 10px;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      flex-shrink: 0;
    }
  `;

  // Create Side Panel HTML
  const panelHTML = `
    <div id="flow-auto-sidepanel" class="flow-sidepanel">
      <div class="flow-sp-header">
        <div class="flow-sp-logo">
          <span class="flow-sp-logo-icon">🎨</span>
          <span class="flow-sp-logo-text">Flow Auto V3</span>
        </div>
        <button id="flowClosePanel" class="flow-sp-close-btn" title="ปิด">✕</button>
      </div>

      <div class="flow-sp-content">
        <div class="flow-sp-section-title">📁 สร้าง Prompts จากรูปภาพ</div>
        <div class="flow-sp-section">
          <button id="flowPickFolder" class="flow-sp-btn flow-sp-btn-folder">
            เลือกโฟลเดอร์รูปภาพ
          </button>
          <span id="flowFolderInfo" class="flow-sp-folder-info">ยังไม่ได้เลือก</span>
        </div>

        <div class="flow-sp-stats">
          <div class="flow-sp-stat">
            <span class="flow-sp-stat-label">Total:</span>
            <span id="flowTotalImages" class="flow-sp-stat-value">0</span>
          </div>
          <div class="flow-sp-stat">
            <span class="flow-sp-stat-label">Current:</span>
            <span id="flowCurrentImage" class="flow-sp-stat-value">0</span>
          </div>
        </div>

        <div class="flow-sp-progress-section">
          <div class="flow-sp-progress-header">
            <span>Progress</span>
            <span id="flowProgressPercent">0%</span>
          </div>
          <div class="flow-sp-progress-bar">
            <div id="flowProgressFill" class="flow-sp-progress-fill"></div>
          </div>
        </div>

        <div class="flow-sp-section">
          <label class="flow-sp-label">⏱️ หน่วงเวลา (ms)</label>
          <input type="number" id="flowCaptionDelay" class="flow-sp-input" value="1000" min="0" step="100">
        </div>

        <div class="flow-sp-actions">
          <button id="flowBtnStart" class="flow-sp-btn flow-sp-btn-start" disabled>
            ▶ สร้าง Captions
          </button>
          <button id="flowBtnStartWithGen" class="flow-sp-btn flow-sp-btn-gen" disabled>
            🎨 สร้าง Captions + เจนรูป
          </button>
        </div>

        <div class="flow-sp-divider"></div>
        <div class="flow-sp-section-title">✏️ Prompts</div>
        
        <div class="flow-sp-section">
          <textarea id="flowPromptsInput" class="flow-sp-textarea" 
            placeholder="ใส่ prompt ที่ต้องการสร้าง...&#10;แต่ละบรรทัดจะสร้างภาพใหม่"
            rows="3"></textarea>
          <div class="flow-sp-prompt-actions">
            <button id="flowBtnLoadFile" class="flow-sp-btn flow-sp-btn-small">📁 โหลดไฟล์</button>
            <button id="flowBtnClearPrompts" class="flow-sp-btn flow-sp-btn-small flow-sp-btn-clear">🗑️ ล้าง</button>
          </div>
          <div class="flow-sp-prompt-info">
            <span id="flowPromptCount">0 prompts</span>
          </div>
          <input type="file" id="flowFileInput" accept=".txt" style="display: none;">
        </div>

        <div class="flow-sp-section">
          <div class="flow-sp-settings-row">
            <div class="flow-sp-setting">
              <label class="flow-sp-label">⏱️ หน่วงเวลา (วินาที)</label>
              <input type="number" id="flowDelayInput" class="flow-sp-input" value="20" min="1" max="60">
            </div>
            <div class="flow-sp-setting">
              <label class="flow-sp-label">🔄 ซ้ำ (ครั้ง)</label>
              <input type="number" id="flowRepeatInput" class="flow-sp-input" value="1" min="1" max="10">
            </div>
          </div>
        </div>

        <div class="flow-sp-actions">
          <button id="flowBtnGenerate" class="flow-sp-btn flow-sp-btn-primary">
            🚀 เริ่มสร้างรูป
          </button>
          <button id="flowBtnStop" class="flow-sp-btn flow-sp-btn-stop" disabled>
            ■ หยุด
          </button>
        </div>

        <div class="flow-sp-stats-row">
          <div class="flow-sp-stat-box">
            <span id="flowStatGenerated" class="flow-sp-stat-number">0</span>
            <span class="flow-sp-stat-text">สร้างแล้ว</span>
          </div>
          <div class="flow-sp-stat-box">
            <span id="flowStatDownloaded" class="flow-sp-stat-number">0</span>
            <span class="flow-sp-stat-text">ดาวน์โหลด</span>
          </div>
        </div>

        <div class="flow-sp-section-title">📋 Log</div>
        <div class="flow-sp-log-section">
          <div id="flowLog" class="flow-sp-log"></div>
          <div class="flow-sp-log-actions">
            <button id="flowBtnCopyLog" class="flow-sp-btn flow-sp-btn-small">📋 Copy</button>
            <button id="flowBtnClearLog" class="flow-sp-btn flow-sp-btn-small flow-sp-btn-clear">🗑️ Clear</button>
          </div>
        </div>
      </div>

      <div class="flow-sp-footer">
        <span>✨ Flow Auto V3</span>
      </div>
    </div>
  `;

  // Inject CSS
  const styleEl = document.createElement('style');
  styleEl.textContent = panelCSS;
  document.head.appendChild(styleEl);

  // Inject Panel
  const panelContainer = document.createElement('div');
  panelContainer.innerHTML = panelHTML;
  document.body.appendChild(panelContainer.firstElementChild);

  // Get DOM elements
  const panel = document.getElementById('flow-auto-sidepanel');
  const closeBtn = document.getElementById('flowClosePanel');
  const pickFolderBtn = document.getElementById('flowPickFolder');
  const folderInfoEl = document.getElementById('flowFolderInfo');
  const totalImagesEl = document.getElementById('flowTotalImages');
  const currentImageEl = document.getElementById('flowCurrentImage');
  const progressPercentEl = document.getElementById('flowProgressPercent');
  const progressFillEl = document.getElementById('flowProgressFill');
  const captionDelayInput = document.getElementById('flowCaptionDelay');
  const startBtn = document.getElementById('flowBtnStart');
  const startWithGenBtn = document.getElementById('flowBtnStartWithGen');
  const promptsInput = document.getElementById('flowPromptsInput');
  const btnLoadFile = document.getElementById('flowBtnLoadFile');
  const btnClearPrompts = document.getElementById('flowBtnClearPrompts');
  const fileInput = document.getElementById('flowFileInput');
  const promptCountEl = document.getElementById('flowPromptCount');
  const delayInput = document.getElementById('flowDelayInput');
  const repeatInput = document.getElementById('flowRepeatInput');
  const btnGenerate = document.getElementById('flowBtnGenerate');
  const stopBtn = document.getElementById('flowBtnStop');
  const statGeneratedEl = document.getElementById('flowStatGenerated');
  const statDownloadedEl = document.getElementById('flowStatDownloaded');
  const logEl = document.getElementById('flowLog');
  const btnCopyLog = document.getElementById('flowBtnCopyLog');
  const btnClearLog = document.getElementById('flowBtnClearLog');

  // Toggle Panel
  function togglePanel() {
    isPanelVisible = !isPanelVisible;
    if (isPanelVisible) {
      panel.classList.add('visible');
    } else {
      panel.classList.remove('visible');
    }
  }

  // Log function
  function log(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.textContent = `[${time}] ${message}`;
    if (type === 'ok') div.className = 'log-ok';
    if (type === 'error') div.className = 'log-error';
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  // Update progress
  function updateProgress(current, total) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    currentImageEl.textContent = current;
    progressPercentEl.textContent = `${percent}%`;
    progressFillEl.style.width = `${percent}%`;
  }

  // Update prompt count
  function updatePromptCount() {
    const text = promptsInput.value.trim();
    const prompts = text ? text.split('\n').filter(p => p.trim()) : [];
    const repeat = parseInt(repeatInput.value) || 1;
    const total = prompts.length * repeat;
    promptCountEl.textContent = `${prompts.length} prompts × ${repeat} = ${total} งาน`;
  }

  // Array buffer to base64
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



  // Pick folder
  async function handlePickFolder() {
    try {
      const handle = await window.showDirectoryPicker({ id: 'flow-caption-folder', mode: 'readwrite' });
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

      imageHandles.sort((a, b) => a.name.localeCompare(b.name));

      totalImagesEl.textContent = imageHandles.length;
      folderInfoEl.textContent = `📁 ${handle.name} (${imageHandles.length} รูป)`;
      folderInfoEl.style.color = '#34d399';

      startBtn.disabled = imageHandles.length === 0;
      startWithGenBtn.disabled = imageHandles.length === 0;

      log(`เลือกโฟลเดอร์: ${handle.name} (${imageHandles.length} รูป)`, 'ok');
    } catch (err) {
      if (err.name !== 'AbortError') {
        log(`ข้อผิดพลาด: ${err.message}`, 'error');
      }
    }
  }

  // Generate captions
  async function handleGenerateCaptions(withGenerate = false) {
    if (!dirHandle || imageHandles.length === 0) {
      log('กรุณาเลือกโฟลเดอร์ที่มีรูปภาพก่อน', 'error');
      return;
    }

    isCaptioning = true;
    startBtn.disabled = true;
    startWithGenBtn.disabled = true;
    stopBtn.disabled = false;
    logEl.innerHTML = '';

    const delayMs = Math.max(0, parseInt(captionDelayInput.value, 10) || 1000);
    log(`เริ่มสร้าง captions สำหรับ ${imageHandles.length} รูป`);

    const outputs = [];

    for (let i = 0; i < imageHandles.length && isCaptioning; i++) {
      const handle = imageHandles[i];
      updateProgress(i + 1, imageHandles.length);

      try {
        const file = await handle.getFile();
        log(`(${i + 1}/${imageHandles.length}) ${file.name}...`);

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

        const response = await chrome.runtime.sendMessage({ type: 'sendCaption', payload });

        if (!response?.ok) {
          const errorMsg = response?.error || 'Unknown error';
          log(`❌ ${file.name}: ${errorMsg}`, 'error');
          outputs.push({ file: file.name, output: `ERROR: ${errorMsg}` });
        } else {
          const output = response.data?.result?.data?.json?.result?.candidates?.[0]?.output || '';
          outputs.push({ file: file.name, output });
          log(`✅ ${file.name}`, 'ok');


        }

        if (i < imageHandles.length - 1 && isCaptioning) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      } catch (err) {
        log(`❌ ${handle.name}: ${err.message}`, 'error');
      }
    }

    if (dirHandle && outputs.length > 0) {
      try {
        const prompts = outputs
          .map(r => String(r.output || '').replace(/\r?\n/g, ' ').trim())
          .filter(p => p && !p.startsWith('ERROR:'));

        if (prompts.length > 0) {
          const existingPrompts = promptsInput.value.trim();
          if (existingPrompts) {
            promptsInput.value = existingPrompts + '\n' + prompts.join('\n');
          } else {
            promptsInput.value = prompts.join('\n');
          }
          updatePromptCount();
        }

        const text = prompts.join('\n\n');
        const fileHandle = await dirHandle.getFileHandle('prompts.txt', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(text);
        await writable.close();

        log(`📝 บันทึก prompts.txt (${prompts.length})`, 'ok');

        if (withGenerate && prompts.length > 0 && isCaptioning) {
          log('🎨 กำลังเริ่มสร้างรูป...', 'info');
          await handleGenerateImages(prompts);
        }
      } catch (err) {
        log(`❌ ${err.message}`, 'error');
      }
    }

    // Only reset if NOT generating images (withGenerate mode waits for FLOW_COMPLETE)
    if (!withGenerate) {
      log('🎉 เสร็จสิ้น Caption!', 'ok');
      isCaptioning = false;
      startBtn.disabled = imageHandles.length === 0;
      startWithGenBtn.disabled = imageHandles.length === 0;
      stopBtn.disabled = true;
    }
    // If withGenerate, the UI will be reset when FLOW_COMPLETE is received
  }

  // Generate images from prompts
  async function handleGenerateImages(promptList = null) {
    const prompts = promptList || promptsInput.value.trim().split('\n').filter(p => p.trim());
    if (prompts.length === 0) {
      log('กรุณาใส่ prompt ก่อน', 'error');
      return;
    }

    const repeat = parseInt(repeatInput.value) || 1;
    const delay = (parseInt(delayInput.value) || 20) * 1000;

    const fullPrompts = [];
    for (let r = 0; r < repeat; r++) {
      for (const prompt of prompts) {
        fullPrompts.push(prompt.trim());
      }
    }

    log(`🚀 เริ่มสร้าง ${fullPrompts.length} รูป`);
    isProcessing = true;
    btnGenerate.disabled = true;
    stopBtn.disabled = false;

    // Send to content script via window.postMessage (both are content scripts in same context)
    window.postMessage({
      type: 'FLOW_AUTO_GENERATE',
      prompts: fullPrompts,
      settings: { delay }
    }, '*');

    log('📤 ส่ง prompts ไปยัง content script แล้ว');
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
        .filter(line => line && !line.startsWith('#'));

      if (lines.length > 0) {
        const existingPrompts = promptsInput.value.trim();
        if (existingPrompts) {
          promptsInput.value = existingPrompts + '\n' + lines.join('\n');
        } else {
          promptsInput.value = lines.join('\n');
        }
        updatePromptCount();
        log(`โหลด ${lines.length} prompts`, 'ok');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  }

  // Stop processing
  function handleStop() {
    isCaptioning = false;
    isProcessing = false;

    // Send stop message to content script
    window.postMessage({ type: 'FLOW_STOP' }, '*');

    log('⚠️ หยุด', 'error');
    startBtn.disabled = imageHandles.length === 0;
    startWithGenBtn.disabled = imageHandles.length === 0;
    btnGenerate.disabled = false;
    stopBtn.disabled = true;
  }

  // Event listeners
  closeBtn.addEventListener('click', togglePanel);
  pickFolderBtn.addEventListener('click', handlePickFolder);
  startBtn.addEventListener('click', () => handleGenerateCaptions(false));
  startWithGenBtn.addEventListener('click', () => handleGenerateCaptions(true));
  btnLoadFile.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileLoad);
  btnClearPrompts.addEventListener('click', () => {
    promptsInput.value = '';
    updatePromptCount();
    log('ล้าง prompts แล้ว', 'info');
  });
  promptsInput.addEventListener('input', updatePromptCount);
  repeatInput.addEventListener('input', updatePromptCount);
  btnGenerate.addEventListener('click', () => handleGenerateImages());
  stopBtn.addEventListener('click', handleStop);

  // Log action buttons
  btnCopyLog.addEventListener('click', () => {
    const logText = logEl.innerText;
    navigator.clipboard.writeText(logText).then(() => {
      log('คัดลอก log แล้ว!', 'ok');
    }).catch(() => {
      log('ไม่สามารถคัดลอกได้', 'error');
    });
  });

  btnClearLog.addEventListener('click', () => {
    logEl.innerHTML = '';
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_PANEL') {
      console.log('🎨 Received TOGGLE_PANEL message');
      togglePanel();
      sendResponse({ status: 'OK' });
    }
    return true;
  });

  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    if (event.data.type === 'FLOW_PROGRESS') {
      statGeneratedEl.textContent = event.data.current;
    } else if (event.data.type === 'FLOW_DOWNLOAD') {
      statDownloadedEl.textContent = parseInt(statDownloadedEl.textContent) + 1;
    } else if (event.data.type === 'FLOW_COMPLETE') {
      log('🎉 เสร็จทั้งหมดแล้ว!', 'ok');
      // Reset UI without showing "หยุด" message
      isCaptioning = false;
      isProcessing = false;
      startBtn.disabled = imageHandles.length === 0;
      startWithGenBtn.disabled = imageHandles.length === 0;
      btnGenerate.disabled = false;
      stopBtn.disabled = true;
    }
  });

  // Initialize
  updatePromptCount();

  console.log('🎨 Flow Auto V3 - Ready! Click extension icon to toggle panel.');
})();
