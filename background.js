// ===== Flow Auto Generator V3 - Background Service Worker =====

let downloadCount = 0;

// Listen for extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🎨 Icon clicked, toggling side panel...');

  // Check if we're on labs.google
  if (!tab.url?.includes('labs.google')) {
    console.log('⚠️ Not on labs.google page');
    return;
  }

  // Send toggle message to content script
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
    console.log('✅ Toggle message sent');
  } catch (error) {
    console.log('⚠️ Content script not ready, injecting...');
    // Try to inject content scripts
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['sidepanel.js']
      });
      // Wait a bit then send toggle
      setTimeout(async () => {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
      }, 500);
    } catch (err) {
      console.error('Failed to inject scripts:', err);
    }
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received:', message.type);

  switch (message.type) {
    case 'DOWNLOAD':
      handleDownload(message);
      sendResponse({ status: 'OK' });
      break;

    case 'GET_TAB_ID':
      sendResponse({ tabId: sender.tab?.id });
      break;

    case 'sendCaption':
      // Handle caption API call
      handleCaptionRequest(message.payload, sendResponse);
      return true; // Keep channel open for async response
  }
  return true;
});

// Handle caption API request
async function handleCaptionRequest(payload, sendResponse) {
  try {
    const res = await fetch('https://labs.google/fx/api/trpc/backbone.captionImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = { raw: text };
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    sendResponse({ ok: true, data });
  } catch (err) {
    sendResponse({ ok: false, error: err.message });
  }
}

// Handle download request
async function handleDownload(message) {
  const { url, filename } = message;

  if (!url) {
    console.error('No URL provided for download');
    return;
  }

  try {
    downloadCount++;

    // Use provided filename or generate one
    let finalFilename = filename;
    if (!finalFilename) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const index = String(downloadCount).padStart(3, '0');
      finalFilename = `flow-downloads/flow_${dateStr}_${timeStr}_${index}.png`;
    }

    console.log(`📥 Downloading: ${finalFilename}`);

    // Download the file directly
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: finalFilename,
      conflictAction: 'uniquify',
      saveAs: false
    });

    if (downloadId) {
      console.log(`✅ Download started: ${finalFilename} (ID: ${downloadId})`);
    }

  } catch (error) {
    console.error('Download error:', error);
  }
}

// Handle extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎨 Flow Auto V3 installed!');
    chrome.storage.local.set({
      settings: {
        autoDownload: true,
        downloadFolder: 'flow-downloads'
      }
    });
  }
});

console.log('🎨 Flow Auto V3 - Background Started');
