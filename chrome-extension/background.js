// Creator OS Browser Sync - Background Service Worker

// Listen for external messages (from Creator OS web app)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok', version: '1.0.0' });
    return true;
  }
  
  if (message.type === 'SET_TOKEN') {
    chrome.storage.local.set({ syncToken: message.token, isConnected: true });
    sendResponse({ success: true });
    return true;
  }
});

// Listen for internal messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['syncToken', 'isConnected'], (result) => {
      sendResponse({
        connected: result.isConnected || false,
        hasToken: !!result.syncToken
      });
    });
    return true;
  }
});

// Inject marker element when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Creator OS Browser Sync extension installed');
});
