// NimbusGuard Options Page Controller
class OptionsController {
  constructor() {
    this.settings = null;
    this.stats = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSettings();
    await this.loadStats();
    this.updateUI();
  }

  setupEventListeners() {
    // Setting toggles
    document.getElementById('adBlockEnabled').addEventListener('change', (e) => {
      this.updateSetting('adBlockEnabled', e.target.checked);
    });

    document.getElementById('httpsEnabled').addEventListener('change', (e) => {
      this.updateSetting('httpsEnabled', e.target.checked);
    });

    document.getElementById('trackerBlockEnabled').addEventListener('change', (e) => {
      this.updateSetting('trackerBlockEnabled', e.target.checked);
    });

    document.getElementById('privacyMode').addEventListener('change', (e) => {
      this.updateSetting('privacyMode', e.target.checked);
    });

    // Allowlist management
    document.getElementById('addAllowlist').addEventListener('click', () => {
      this.addToAllowlist();
    });

    document.getElementById('allowlistInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToAllowlist();
      }
    });

    // Statistics
    document.getElementById('resetStats').addEventListener('click', () => {
      this.resetStats();
    });

    // Advanced settings
    document.getElementById('exportSettings').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('importSettings').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
      this.importSettings(e.target.files[0]);
    });
  }

  async loadSettings() {
    try {
      const response = await this.sendMessage({ command: 'getSettings' });
      if (response.success) {
        this.settings = response.settings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadStats() {
    try {
      const response = await this.sendMessage({ command: 'getStats' });
      if (response.success) {
        this.stats = response.stats;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  updateUI() {
    if (!this.settings) return;

    // Update setting toggles
    document.getElementById('adBlockEnabled').checked = this.settings.adBlockEnabled;
    document.getElementById('httpsEnabled').checked = this.settings.httpsEnabled;
    document.getElementById('trackerBlockEnabled').checked = this.settings.trackerBlockEnabled;
    document.getElementById('privacyMode').checked = this.settings.privacyMode;

    // Update allowlist
    this.updateAllowlistUI();

    // Update stats
    if (this.stats) {
      document.getElementById('adsBlocked').textContent = this.stats.adsBlocked.toLocaleString();
      document.getElementById('trackersBlocked').textContent = this.stats.trackersBlocked.toLocaleString();
      document.getElementById('httpsRedirects').textContent = this.stats.httpsRedirects.toLocaleString();
    }
  }

  updateAllowlistUI() {
    const container = document.getElementById('allowlistItems');
    container.innerHTML = '';

    if (this.settings.allowlist.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No domains in allowlist</p>';
      return;
    }

    this.settings.allowlist.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'allowlist-item';
      item.innerHTML = `
        <span>${domain}</span>
        <button class="remove-btn" onclick="optionsController.removeFromAllowlist('${domain}')">Remove</button>
      `;
      container.appendChild(item);
    });
  }

  async updateSetting(key, value) {
    if (!this.settings) return;

    this.settings[key] = value;
    
    try {
      const command = {
        'adBlockEnabled': 'toggleAdBlock',
        'httpsEnabled': 'toggleHTTPS',
        'trackerBlockEnabled': 'toggleTrackerBlock',
        'privacyMode': 'togglePrivacyMode'
      }[key];

      const response = await this.sendMessage({ command, enabled: value });
      if (response.success) {
        this.showNotification(`${key} ${value ? 'enabled' : 'disabled'}`);
      } else {
        this.showNotification('Error updating setting', 'error');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      this.showNotification('Error updating setting', 'error');
    }
  }

  async addToAllowlist() {
    const input = document.getElementById('allowlistInput');
    const domain = input.value.trim();

    if (!domain) {
      this.showNotification('Please enter a domain', 'error');
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      this.showNotification('Invalid domain format', 'error');
      return;
    }

    try {
      const response = await this.sendMessage({ command: 'addToAllowlist', domain });
      if (response.success) {
        this.settings.allowlist = response.allowlist;
        this.updateAllowlistUI();
        input.value = '';
        this.showNotification(`${domain} added to allowlist`);
      } else {
        this.showNotification('Error adding to allowlist', 'error');
      }
    } catch (error) {
      console.error('Error adding to allowlist:', error);
      this.showNotification('Error adding to allowlist', 'error');
    }
  }

  async removeFromAllowlist(domain) {
    try {
      const response = await this.sendMessage({ command: 'removeFromAllowlist', domain });
      if (response.success) {
        this.settings.allowlist = response.allowlist;
        this.updateAllowlistUI();
        this.showNotification(`${domain} removed from allowlist`);
      } else {
        this.showNotification('Error removing from allowlist', 'error');
      }
    } catch (error) {
      console.error('Error removing from allowlist:', error);
      this.showNotification('Error removing from allowlist', 'error');
    }
  }

  async resetStats() {
    if (!confirm('Are you sure you want to reset all statistics?')) {
      return;
    }

    try {
      const response = await this.sendMessage({ command: 'resetStats' });
      if (response.success) {
        this.stats = response.stats;
        this.updateUI();
        this.showNotification('Statistics reset successfully');
      } else {
        this.showNotification('Error resetting statistics', 'error');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      this.showNotification('Error resetting statistics', 'error');
    }
  }

  exportSettings() {
    const exportData = {
      settings: this.settings,
      stats: this.stats,
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nimbusguard-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Settings exported successfully');
  }

  async importSettings(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.settings) {
        this.showNotification('Invalid settings file', 'error');
        return;
      }

      // Import settings
      const settings = data.settings;
      await this.updateSetting('adBlockEnabled', settings.adBlockEnabled);
      await this.updateSetting('httpsEnabled', settings.httpsEnabled);
      await this.updateSetting('trackerBlockEnabled', settings.trackerBlockEnabled);
      await this.updateSetting('privacyMode', settings.privacyMode);

      // Import allowlist
      if (settings.allowlist) {
        for (const domain of settings.allowlist) {
          await this.sendMessage({ command: 'addToAllowlist', domain });
        }
      }

      await this.loadSettings();
      this.updateUI();
      this.showNotification('Settings imported successfully');
    } catch (error) {
      console.error('Error importing settings:', error);
      this.showNotification('Error importing settings', 'error');
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-size: 14px;
      z-index: 1000;
      transition: opacity 0.3s ease;
      ${type === 'error' ? 'background-color: #dc3545;' : 'background-color: #28a745;'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize options controller
let optionsController;
document.addEventListener('DOMContentLoaded', () => {
  optionsController = new OptionsController();
});

// Auto-refresh stats every 10 seconds
setInterval(async () => {
  if (optionsController) {
    await optionsController.loadStats();
    if (optionsController.stats) {
      document.getElementById('adsBlocked').textContent = optionsController.stats.adsBlocked.toLocaleString();
      document.getElementById('trackersBlocked').textContent = optionsController.stats.trackersBlocked.toLocaleString();
      document.getElementById('httpsRedirects').textContent = optionsController.stats.httpsRedirects.toLocaleString();
    }
  }
}, 10000);
