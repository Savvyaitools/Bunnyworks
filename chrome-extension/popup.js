// Creator OS Browser Sync - Popup Script

const API_URL = 'https://rforophgmeiueauuxhga.supabase.co/functions/v1/ingest-browser-sync';

// DOM Elements
const tokenInput = document.getElementById('token');
const connectBtn = document.getElementById('connect-btn');
const syncBtn = document.getElementById('sync-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const messageEl = document.getElementById('message');

// State
let isConnected = false;
let currentToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check for token in URL params (auto-fill from Creator OS)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    tokenInput.value = tokenFromUrl;
    showMessage('Token auto-filled from Creator OS!', 'success');
  }
  
  // Load saved token
  const saved = await chrome.storage.local.get(['syncToken', 'isConnected']);
  if (saved.syncToken) {
    tokenInput.value = saved.syncToken;
    if (saved.isConnected) {
      setConnected(true);
    }
  }
});

// Connect button handler
connectBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  
  if (!token) {
    showMessage('Please enter a sync token', 'error');
    return;
  }
  
  connectBtn.disabled = true;
  connectBtn.textContent = 'Connecting...';
  
  try {
    // Validate token with the API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        action: 'validate'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.valid) {
      // Save token and state
      await chrome.storage.local.set({
        syncToken: token,
        isConnected: true
      });
      
      currentToken = token;
      setConnected(true);
      showMessage('Connected successfully!', 'success');
    } else {
      showMessage(result.error || 'Invalid or expired token', 'error');
    }
  } catch (error) {
    console.error('Connection error:', error);
    showMessage('Failed to connect. Check your internet connection.', 'error');
  } finally {
    connectBtn.disabled = false;
    connectBtn.textContent = isConnected ? 'Reconnect' : 'Connect';
  }
});

// Sync button handler
syncBtn.addEventListener('click', async () => {
  if (!currentToken) {
    showMessage('Please connect first', 'error');
    return;
  }
  
  syncBtn.disabled = true;
  syncBtn.textContent = 'Syncing...';
  
  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showMessage('No active tab found', 'error');
      return;
    }
    
    // Check if we're on a supported platform
    const supportedPlatforms = ['onlyfans.com', 'fansly.com'];
    const isSupported = supportedPlatforms.some(platform => tab.url?.includes(platform));
    
    if (!isSupported) {
      showMessage('Please navigate to OnlyFans or Fansly first', 'error');
      return;
    }
    
    // Capture screenshot
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 90
    });
    
    // Extract platform from URL
    let platform = 'unknown';
    if (tab.url?.includes('onlyfans.com')) platform = 'OnlyFans';
    if (tab.url?.includes('fansly.com')) platform = 'Fansly';
    
    // Send to API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: currentToken,
        action: 'sync',
        data: {
          screenshot: screenshot,
          url: tab.url,
          title: tab.title,
          platform: platform,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showMessage('Page synced successfully! Check your import queue.', 'success');
    } else {
      showMessage(result.error || 'Sync failed', 'error');
    }
  } catch (error) {
    console.error('Sync error:', error);
    showMessage('Failed to sync. Check permissions.', 'error');
  } finally {
    syncBtn.disabled = false;
    syncBtn.textContent = 'Sync Current Page';
  }
});

// Helper functions
function setConnected(connected) {
  isConnected = connected;
  currentToken = connected ? tokenInput.value.trim() : null;
  
  statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
  statusText.textContent = connected ? 'Connected' : 'Not connected';
  syncBtn.disabled = !connected;
  connectBtn.textContent = connected ? 'Reconnect' : 'Connect';
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type} visible`;
  
  setTimeout(() => {
    messageEl.className = 'message';
  }, 5000);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok', connected: isConnected });
  }
});
