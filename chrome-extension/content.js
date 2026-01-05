// Creator OS Browser Sync - Content Script

// Inject marker element so the web app can detect the extension
(function() {
  const marker = document.createElement('div');
  marker.id = 'creator-os-extension-marker';
  marker.style.display = 'none';
  marker.setAttribute('data-version', '1.0.0');
  document.body.appendChild(marker);
  
  console.log('Creator OS Browser Sync: Extension detected on this page');
})();

// Listen for messages from the popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_DATA') {
    // Future: Extract structured data from the page
    const pageData = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    sendResponse(pageData);
  }
  return true;
});
