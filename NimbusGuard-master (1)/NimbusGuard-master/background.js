// NimbusGuard - Enhanced Ad Blocker & Privacy Protection
class NimbusGuard {
  constructor() {
    this.settings = {
      adBlockEnabled: false,
      httpsEnabled: true,
      trackerBlockEnabled: true,
      privacyMode: false,
      allowlist: [],
      customRules: []
    };
    this.stats = {
      adsBlocked: 0,
      trackersBlocked: 0,
      httpsRedirects: 0,
      startTime: Date.now()
    };
    this.ruleIdCounter = 1;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    await this.updateAllRules();
    this.setupEventListeners();
    console.log('NimbusGuard initialized');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['stats']);
      if (result.stats) {
        this.stats = { ...this.stats, ...result.stats };
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ settings: this.settings });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async saveStats() {
    try {
      await chrome.storage.local.set({ stats: this.stats });
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  setupEventListeners() {
    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Track blocked requests
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        if (this.isBlockedRequest(details.url)) {
          this.incrementBlockedCounter(details.url);
        }
      },
      { urls: ['<all_urls>'] },
      ['requestBody']
    );

    // Handle tab updates for HTTPS enforcement
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && this.settings.httpsEnabled) {
        this.enforceHTTPS(tabId, changeInfo.url);
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.command) {
        case 'toggleAdBlock':
          this.settings.adBlockEnabled = message.enabled;
          await this.saveSettings();
          await this.updateAllRules();
          sendResponse({ success: true, enabled: this.settings.adBlockEnabled });
          break;
        
        case 'toggleHTTPS':
          this.settings.httpsEnabled = message.enabled;
          await this.saveSettings();
          await this.updateAllRules();
          sendResponse({ success: true, enabled: this.settings.httpsEnabled });
          break;
        
        case 'toggleTrackerBlock':
          this.settings.trackerBlockEnabled = message.enabled;
          await this.saveSettings();
          await this.updateAllRules();
          sendResponse({ success: true, enabled: this.settings.trackerBlockEnabled });
          break;
        
        case 'togglePrivacyMode':
          this.settings.privacyMode = message.enabled;
          await this.saveSettings();
          await this.updateAllRules();
          sendResponse({ success: true, enabled: this.settings.privacyMode });
          break;
        
        case 'addToAllowlist':
          if (message.domain && !this.settings.allowlist.includes(message.domain)) {
            this.settings.allowlist.push(message.domain);
            await this.saveSettings();
            await this.updateAllRules();
          }
          sendResponse({ success: true, allowlist: this.settings.allowlist });
          break;
        
        case 'removeFromAllowlist':
          this.settings.allowlist = this.settings.allowlist.filter(domain => domain !== message.domain);
          await this.saveSettings();
          await this.updateAllRules();
          sendResponse({ success: true, allowlist: this.settings.allowlist });
          break;
        
        case 'getSettings':
          sendResponse({ success: true, settings: this.settings });
          break;
        
        case 'getStats':
          sendResponse({ success: true, stats: this.stats });
          break;
        
        case 'resetStats':
          this.stats = {
            adsBlocked: 0,
            trackersBlocked: 0,
            httpsRedirects: 0,
            startTime: Date.now()
          };
          await this.saveStats();
          sendResponse({ success: true, stats: this.stats });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown command' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async updateAllRules() {
    try {
      // Get existing rule IDs to remove
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map(rule => rule.id);

      // Generate new rules
      const newRules = this.generateAllRules();

      // Update rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: newRules
      });

      console.log(`Updated ${newRules.length} rules`);
    } catch (error) {
      console.error('Error updating rules:', error);
    }
  }

  generateAllRules() {
    const rules = [];
    let ruleId = 1;

    // Ad blocking rules
    if (this.settings.adBlockEnabled) {
      rules.push(...this.generateAdBlockingRules(ruleId));
      ruleId += this.getAdBlockingRules().length;
    }

    // Tracker blocking rules
    if (this.settings.trackerBlockEnabled) {
      rules.push(...this.generateTrackerBlockingRules(ruleId));
      ruleId += this.getTrackerBlockingRules().length;
    }

    // HTTPS enforcement rules
    if (this.settings.httpsEnabled) {
      rules.push(...this.generateHTTPSRules(ruleId));
      ruleId += this.getHTTPSRules().length;
    }

    // Privacy mode rules
    if (this.settings.privacyMode) {
      rules.push(...this.generatePrivacyRules(ruleId));
    }

    return rules;
  }

  generateAdBlockingRules(startId) {
    const adRules = this.getAdBlockingRules();
    return adRules.map((rule, index) => ({
      id: startId + index,
      priority: rule.priority || 1,
      action: { type: 'block' },
      condition: {
        urlFilter: rule.urlFilter,
        resourceTypes: rule.resourceTypes || ['main_frame', 'sub_frame', 'script', 'image', 'xmlhttprequest']
      }
    }));
  }

  generateTrackerBlockingRules(startId) {
    const trackerRules = this.getTrackerBlockingRules();
    return trackerRules.map((rule, index) => ({
      id: startId + index,
      priority: rule.priority || 2,
      action: { type: 'block' },
      condition: {
        urlFilter: rule.urlFilter,
        resourceTypes: ['script', 'xmlhttprequest', 'image']
      }
    }));
  }

  generateHTTPSRules(startId) {
    const httpsRules = this.getHTTPSRules();
    return httpsRules.map((rule, index) => ({
      id: startId + index,
      priority: rule.priority || 3,
      action: {
        type: 'redirect',
        redirect: { regexSubstitution: rule.redirect }
      },
      condition: {
        regexFilter: rule.regexFilter,
        resourceTypes: ['main_frame']
      }
    }));
  }

  generatePrivacyRules(startId) {
    const privacyRules = this.getPrivacyRules();
    return privacyRules.map((rule, index) => ({
      id: startId + index,
      priority: rule.priority || 4,
      action: { type: 'block' },
      condition: {
        urlFilter: rule.urlFilter,
        resourceTypes: ['script', 'xmlhttprequest']
      }
    }));
  }

  getAdBlockingRules() {
    return [
      { urlFilter: '*://*doubleclick.net/*', priority: 1 },
      { urlFilter: '*://*googleadservices.com/*', priority: 1 },
      { urlFilter: '*://*googlesyndication.com/*', priority: 1 },
      { urlFilter: '*://*amazon-adsystem.com/*', priority: 1 },
      { urlFilter: '*://*adsystem.com/*', priority: 1 },
      { urlFilter: '*://*adnxs.com/*', priority: 1 },
      { urlFilter: '*://*adsystem.com/*', priority: 1 },
      { urlFilter: '*://*ads.yahoo.com/*', priority: 1 },
      { urlFilter: '*://*facebook.com/tr/*', priority: 1 },
      { urlFilter: '*://*outbrain.com/*', priority: 1 },
      { urlFilter: '*://*taboola.com/*', priority: 1 },
      { urlFilter: '*://*scorecardresearch.com/*', priority: 1 },
      { urlFilter: '*://*adsystem.com/*', priority: 1 },
      { urlFilter: '*://*/ads/*', priority: 1 },
      { urlFilter: '*://*/advertisement/*', priority: 1 },
      { urlFilter: '*://*/advert/*', priority: 1 },
      { urlFilter: '*://*/adserver/*', priority: 1 },
      { urlFilter: '*://*/adservice/*', priority: 1 },
      { urlFilter: '*://*/adsystem/*', priority: 1 },
      { urlFilter: '*://*/advert.js', priority: 1 },
      { urlFilter: '*://*/ads.js', priority: 1 }
    ];
  }

  getTrackerBlockingRules() {
    return [
      { urlFilter: '*://*google-analytics.com/*', priority: 2 },
      { urlFilter: '*://*googletagmanager.com/*', priority: 2 },
      { urlFilter: '*://*facebook.com/tr/*', priority: 2 },
      { urlFilter: '*://*twitter.com/i/adsct*', priority: 2 },
      { urlFilter: '*://*linkedin.com/li/*', priority: 2 },
      { urlFilter: '*://*hotjar.com/*', priority: 2 },
      { urlFilter: '*://*mixpanel.com/*', priority: 2 },
      { urlFilter: '*://*segment.com/*', priority: 2 },
      { urlFilter: '*://*fullstory.com/*', priority: 2 },
      { urlFilter: '*://*crazyegg.com/*', priority: 2 },
      { urlFilter: '*://*mouseflow.com/*', priority: 2 },
      { urlFilter: '*://*inspectlet.com/*', priority: 2 },
      { urlFilter: '*://*usabilla.com/*', priority: 2 },
      { urlFilter: '*://*quantserve.com/*', priority: 2 },
      { urlFilter: '*://*scorecardresearch.com/*', priority: 2 }
    ];
  }

  getHTTPSRules() {
    return [
      {
        regexFilter: '^http://(.*)$',
        redirect: 'https://\\1',
        priority: 3
      }
    ];
  }

  getPrivacyRules() {
    return [
      { urlFilter: '*://*fingerprint*', priority: 4 },
      { urlFilter: '*://*tracking*', priority: 4 },
      { urlFilter: '*://*beacon*', priority: 4 },
      { urlFilter: '*://*analytics*', priority: 4 },
      { urlFilter: '*://*telemetry*', priority: 4 }
    ];
  }

  isBlockedRequest(url) {
    // Check if URL matches any blocking patterns
    const adPatterns = this.getAdBlockingRules();
    const trackerPatterns = this.getTrackerBlockingRules();
    const privacyPatterns = this.getPrivacyRules();
    
    const allPatterns = [
      ...(this.settings.adBlockEnabled ? adPatterns : []),
      ...(this.settings.trackerBlockEnabled ? trackerPatterns : []),
      ...(this.settings.privacyMode ? privacyPatterns : [])
    ];

    return allPatterns.some(pattern => {
      const regex = new RegExp(pattern.urlFilter.replace(/\*/g, '.*').replace(/\./g, '\\.'));
      return regex.test(url);
    });
  }

  incrementBlockedCounter(url) {
    if (this.isAdUrl(url)) {
      this.stats.adsBlocked++;
    } else if (this.isTrackerUrl(url)) {
      this.stats.trackersBlocked++;
    }
    this.saveStats();
  }

  isAdUrl(url) {
    const adPatterns = this.getAdBlockingRules();
    return adPatterns.some(pattern => {
      const regex = new RegExp(pattern.urlFilter.replace(/\*/g, '.*').replace(/\./g, '\\.'));
      return regex.test(url);
    });
  }

  isTrackerUrl(url) {
    const trackerPatterns = this.getTrackerBlockingRules();
    return trackerPatterns.some(pattern => {
      const regex = new RegExp(pattern.urlFilter.replace(/\*/g, '.*').replace(/\./g, '\\.'));
      return regex.test(url);
    });
  }

  async enforceHTTPS(tabId, url) {
    if (url.startsWith('http://') && !url.startsWith('https://')) {
      const httpsUrl = url.replace('http://', 'https://');
      try {
        await chrome.tabs.update(tabId, { url: httpsUrl });
        this.stats.httpsRedirects++;
        this.saveStats();
      } catch (error) {
        console.error('Error enforcing HTTPS:', error);
      }
    }
  }

  getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return null;
    }
  }

  isAllowlistedDomain(url) {
    const domain = this.getDomainFromUrl(url);
    return domain && this.settings.allowlist.includes(domain);
  }
}

// Initialize NimbusGuard
const nimbusGuard = new NimbusGuard();
