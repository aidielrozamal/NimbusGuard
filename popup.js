document.addEventListener('DOMContentLoaded', function () {
  const adBlockerCheckbox = document.getElementById('toggleAdBlocker');
  const urlDisplay = document.getElementById('urlDisplay');

  // Load stored ad blocker state
  chrome.storage.local.get(["adBlockEnabled"], (data) => {
    const adBlockEnabled = data.adBlockEnabled ?? false;
    adBlockerCheckbox.checked = adBlockEnabled;
  });

  // Toggle ad blocker when checkbox is changed
  adBlockerCheckbox.addEventListener('change', () => {
    const isChecked = adBlockerCheckbox.checked;

    // Save the new state
    chrome.storage.local.set({ adBlockEnabled: isChecked }, () => {
      chrome.runtime.sendMessage({ command: "toggleAdBlock", enabled: isChecked });

      // Refresh the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  });

  // Show the current website hostname
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const url = new URL(tabs[0].url);
      urlDisplay.textContent = `Current Website: ${url.hostname}`;
    } else {
      urlDisplay.textContent = "Current Website: N/A";
    }
  });
});
