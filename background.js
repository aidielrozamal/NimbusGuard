let adBlockEnabled = false;

// Load settings on startup
chrome.storage.local.get(["adBlockEnabled"], (settings) => {
  adBlockEnabled = settings.adBlockEnabled ?? false;
  updateRules();
});

// Handle toggle commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "toggleAdBlock") {
    adBlockEnabled = message.enabled;
    chrome.storage.local.set({ adBlockEnabled }, () => {
      console.log("Ad blocker toggled:", adBlockEnabled);
      updateRules();
    });
  }
  sendResponse({ success: true });
});

// Update rules dynamically
function updateRules() {
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: [1, 2, 3, 4], // Remove previous rules
      addRules: adBlockEnabled ? generateRules() : []
    },
    () => {
      console.log(`Ad-blocking ${adBlockEnabled ? "enabled" : "disabled"}`);
    }
  );
}

// Generate ad-blocking rules
function generateRules() {
  return [
    { id: 1, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*doubleclick.net/*" } },
    { id: 2, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*googleadservices.com/*" } },
    { id: 3, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*adserver.com/*" } },
    { id: 4, priority: 1, action: { type: "block" }, condition: { urlFilter: "*://*ads.example.com/*" } }
  ];
}
