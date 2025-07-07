// NimbusGuard Popup Controller
class PopupController {
  constructor() {
    this.currentDomain = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadCurrentSettings();
    await this.loadCurrentStats();
    await this.loadCurrentWebsite();
  }

  setupEventListeners() {
    // Feature toggles
    document.getElementById('toggleAdBlocker').addEventListener('change', (e) => {
      this.toggleFeature('toggleAdBlock', e.target.checked);
    });

    document.getElementById('toggleHTTPS').addEventListener('change', (e) => {
      this.toggleFeature('toggleHTTPS', e.target.checked);
    });

    document.getElementById('toggleTrackerBlock').addEventListener('change', (e) => {
      this.toggleFeature('toggleTrackerBlock', e.target.checked);
    });

    document.getElementById('togglePrivacyMode').addEventListener('change', (e) => {
      this.toggleFeature('togglePrivacyMode', e.target.checked);
    });

    // Allowlist controls
    document.getElementById('allowSite').addEventListener('click', () => {
      this.addToAllowlist();
    });

    document.getElementById('blockSite').addEventListener('click', () => {
      this.removeFromAllowlist();
    });

    // Stats reset
    document.getElementById('resetStats').addEventListener('click', () => {
      this.resetStats();
    });

    // Footer links
    document.getElementById('openOptions').addEventListener('click', () => {
      this.openOptionsPage();
    });

    document.getElementById('reportIssue').addEventListener('click', () => {
      this.reportIssue();
    });

    document.getElementById('privacyPolicy').addEventListener('click', () => {
      this.openPrivacyPolicy();
    });
  }

  async loadCurrentSettings() {
    try {
      const response = await this.sendMessage({ command: 'getSettings' });
      if (response.success) {
        const settings = response.settings;
        document.getElementById('toggleAdBlocker').checked = settings.adBlockEnabled;
        document.getElementById('toggleHTTPS').checked = settings.httpsEnabled;
        document.getElementById('toggleTrackerBlock').checked = settings.trackerBlockEnabled;
        document.getElementById('togglePrivacyMode').checked = settings.privacyMode;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadCurrentStats() {
    try {
      const response = await this.sendMessage({ command: 'getStats' });
      if (response.success) {
        const stats = response.stats;
        document.getElementById('adsBlocked').textContent = stats.adsBlocked.toLocaleString();
        document.getElementById('trackersBlocked').textContent = stats.trackersBlocked.toLocaleString();
        document.getElementById('httpsRedirects').textContent = stats.httpsRedirects.toLocaleString();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadCurrentWebsite() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        const url = new URL(tabs[0].url);
        this.currentDomain = url.hostname;
        document.getElementById('urlDisplay').textContent = `Current Website: ${this.currentDomain}`;
        
        // Update allowlist button states
        await this.updateAllowlistButtons();
      } else {
        document.getElementById('urlDisplay').textContent = "Current Website: N/A";
      }
    } catch (error) {
      console.error('Error loading current website:', error);
      document.getElementById('urlDisplay').textContent = "Current Website: N/A";
    }
  }

  async updateAllowlistButtons() {
    try {
      const response = await this.sendMessage({ command: 'getSettings' });
      if (response.success) {
        const isAllowlisted = response.settings.allowlist.includes(this.currentDomain);
        const allowBtn = document.getElementById('allowSite');
        const blockBtn = document.getElementById('blockSite');
        
        if (isAllowlisted) {
          allowBtn.textContent = 'Remove from Allowlist';
          allowBtn.className = 'btn btn-secondary';
          blockBtn.style.display = 'none';
        } else {
          allowBtn.textContent = 'Add to Allowlist';
          allowBtn.className = 'btn btn-primary';
          blockBtn.style.display = 'inline-block';
        }
      }
    } catch (error) {
      console.error('Error updating allowlist buttons:', error);
    }
  }

  async toggleFeature(command, enabled) {
    try {
      const response = await this.sendMessage({ command, enabled });
      if (response.success) {
        this.showNotification(`Feature ${enabled ? 'enabled' : 'disabled'} successfully`);
        
        // Refresh current tab if ad blocker is toggled
        if (command === 'toggleAdBlock') {
          await this.refreshCurrentTab();
        }
      } else {
        this.showNotification('Error updating feature', 'error');
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
      this.showNotification('Error updating feature', 'error');
    }
  }

  async addToAllowlist() {
    if (!this.currentDomain) return;
    
    try {
      const response = await this.sendMessage({ 
        command: 'addToAllowlist', 
        domain: this.currentDomain 
      });
      
      if (response.success) {
        this.showNotification(`${this.currentDomain} added to allowlist`);
        await this.updateAllowlistButtons();
        await this.refreshCurrentTab();
      } else {
        this.showNotification('Error adding to allowlist', 'error');
      }
    } catch (error) {
      console.error('Error adding to allowlist:', error);
      this.showNotification('Error adding to allowlist', 'error');
    }
  }

  async removeFromAllowlist() {
    if (!this.currentDomain) return;
    
    try {
      const response = await this.sendMessage({ 
        command: 'removeFromAllowlist', 
        domain: this.currentDomain 
      });
      
      if (response.success) {
        this.showNotification(`${this.currentDomain} removed from allowlist`);
        await this.updateAllowlistButtons();
        await this.refreshCurrentTab();
      } else {
        this.showNotification('Error removing from allowlist', 'error');
      }
    } catch (error) {
      console.error('Error removing from allowlist:', error);
      this.showNotification('Error removing from allowlist', 'error');
    }
  }

  async resetStats() {
    try {
      const response = await this.sendMessage({ command: 'resetStats' });
      if (response.success) {
        this.showNotification('Statistics reset successfully');
        await this.loadCurrentStats();
      } else {
        this.showNotification('Error resetting statistics', 'error');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      this.showNotification('Error resetting statistics', 'error');
    }
  }

  async refreshCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        await chrome.tabs.reload(tabs[0].id);
      }
    } catch (error) {
      console.error('Error refreshing tab:', error);
    }
  }

  openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  reportIssue() {
    chrome.tabs.create({ 
      url: 'https://github.com/your-username/nimbus-guard/issues' 
    });
  }

  openPrivacyPolicy() {
    chrome.tabs.create({ 
      url: 'https://your-website.com/privacy-policy' 
    });
  }

  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px 15px;
      border-radius: 5px;
      color: white;
      font-size: 12px;
      z-index: 1000;
      transition: opacity 0.3s ease;
      ${type === 'error' ? 'background-color: #dc3545;' : 'background-color: #28a745;'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
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

// Initialize popup controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Auto-refresh stats every 5 seconds
setInterval(async () => {
  try {
    const response = await chrome.runtime.sendMessage({ command: 'getStats' });
    if (response.success) {
      const stats = response.stats;
      document.getElementById('adsBlocked').textContent = stats.adsBlocked.toLocaleString();
      document.getElementById('trackersBlocked').textContent = stats.trackersBlocked.toLocaleString();
      document.getElementById('httpsRedirects').textContent = stats.httpsRedirects.toLocaleString();
    }
  } catch (error) {
    console.error('Error auto-refreshing stats:', error);
  }
}, 5000);
