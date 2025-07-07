// NimbusGuard Content Script - Enhanced Privacy Protection
class NimbusGuardContent {
  constructor() {
    this.settings = null;
    this.blockedElements = new Set();
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupDOMObserver();
    this.setupCSPEnforcement();
    this.blockSocialTrackers();
    this.hideAds();
    this.protectPrivacy();
    console.log('NimbusGuard Content Script initialized');
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

  setupDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processNewElement(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processNewElement(element) {
    if (!this.settings) return;

    if (this.settings.adBlockEnabled) {
      this.blockAdsInElement(element);
    }

    if (this.settings.trackerBlockEnabled) {
      this.blockTrackersInElement(element);
    }

    if (this.settings.privacyMode) {
      this.enhancePrivacyInElement(element);
    }
  }

  blockAdsInElement(element) {
    const adSelectors = [
      '[class*="ad"]',
      '[id*="ad"]',
      '[class*="advertisement"]',
      '[id*="advertisement"]',
      '[class*="banner"]',
      '[id*="banner"]',
      '[class*="popup"]',
      '[id*="popup"]',
      '.adsbygoogle',
      '.ad-container',
      '.advertisement',
      '.banner-ad',
      '.popup-ad',
      '.sponsored',
      '.promo-box'
    ];

    adSelectors.forEach(selector => {
      const ads = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      ads.forEach(ad => this.hideElement(ad, 'ad'));
    });

    // Block specific ad networks
    const iframes = element.querySelectorAll ? element.querySelectorAll('iframe') : [];
    iframes.forEach(iframe => {
      const src = iframe.src;
      if (this.isAdUrl(src)) {
        this.hideElement(iframe, 'ad-iframe');
      }
    });
  }

  blockTrackersInElement(element) {
    const trackerSelectors = [
      'script[src*="google-analytics"]',
      'script[src*="googletagmanager"]',
      'script[src*="facebook.com/tr"]',
      'script[src*="twitter.com/i/adsct"]',
      'script[src*="linkedin.com/li"]',
      'script[src*="hotjar"]',
      'script[src*="mixpanel"]',
      'script[src*="segment"]',
      'script[src*="fullstory"]',
      'img[src*="facebook.com/tr"]',
      'img[src*="google-analytics"]',
      'img[src*="doubleclick"]'
    ];

    trackerSelectors.forEach(selector => {
      const trackers = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      trackers.forEach(tracker => this.hideElement(tracker, 'tracker'));
    });
  }

  enhancePrivacyInElement(element) {
    // Remove fingerprinting scripts
    const fingerprintingSelectors = [
      'script[src*="fingerprint"]',
      'script[src*="canvas"]',
      'script[src*="webgl"]',
      'script[src*="audiofp"]'
    ];

    fingerprintingSelectors.forEach(selector => {
      const scripts = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      scripts.forEach(script => this.hideElement(script, 'fingerprint'));
    });

    // Block social media widgets
    const socialSelectors = [
      '.fb-like',
      '.twitter-tweet',
      '.instagram-media',
      '.linkedin-share',
      '.pinterest-pin',
      '[class*="social-share"]'
    ];

    socialSelectors.forEach(selector => {
      const widgets = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      widgets.forEach(widget => this.hideElement(widget, 'social'));
    });
  }

  hideElement(element, reason) {
    if (this.blockedElements.has(element)) return;

    element.style.display = 'none !important';
    element.style.visibility = 'hidden !important';
    element.style.opacity = '0 !important';
    element.style.height = '0 !important';
    element.style.width = '0 !important';
    element.style.overflow = 'hidden !important';
    
    this.blockedElements.add(element);
    
    // Add a data attribute to track blocked elements
    element.setAttribute('data-nimbus-blocked', reason);
    
    console.log(`NimbusGuard: Blocked ${reason} element`, element);
  }

  setupCSPEnforcement() {
    // Add additional CSP headers via meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';";
    
    if (document.head) {
      document.head.appendChild(cspMeta);
    }
  }

  blockSocialTrackers() {
    // Block Facebook tracking
    window.fbAsyncInit = function() {};
    if (window.FB) {
      window.FB = undefined;
    }

    // Block Google Analytics
    window.gtag = function() {};
    window.ga = function() {};
    if (window.GoogleAnalyticsObject) {
      window[window.GoogleAnalyticsObject] = function() {};
    }

    // Block other common trackers
    window._gaq = [];
    window._gat = undefined;
    window.dataLayer = [];
  }

  hideAds() {
    if (!this.settings || !this.settings.adBlockEnabled) return;

    // CSS to hide common ad elements
    const adBlockCSS = `
      .ad, .ads, .advertisement, .banner-ad, .popup-ad,
      .adsbygoogle, .ad-container, .ad-banner, .ad-box,
      .sponsored, .promo-box, .affiliate-link,
      [class*="ad-"], [id*="ad-"], [class*="advertisement"],
      [id*="advertisement"], [class*="banner"], [id*="banner"],
      [class*="popup"], [id*="popup"], [class*="sponsored"],
      [id*="sponsored"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
    `;

    const style = document.createElement('style');
    style.textContent = adBlockCSS;
    document.head.appendChild(style);
  }

  protectPrivacy() {
    if (!this.settings || !this.settings.privacyMode) return;

    // Override canvas fingerprinting
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function() {
      const context = originalGetContext.apply(this, arguments);
      if (context && context.getImageData) {
        const originalGetImageData = context.getImageData;
        context.getImageData = function() {
          // Return slightly modified data to prevent fingerprinting
          const imageData = originalGetImageData.apply(this, arguments);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = Math.floor(Math.random() * 256);
          }
          return imageData;
        };
      }
      return context;
    };

    // Override WebGL fingerprinting
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445 || parameter === 37446) {
        return 'NimbusGuard Protection';
      }
      return originalGetParameter.apply(this, arguments);
    };

    // Override audio fingerprinting
    const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createAnalyser = function() {
      const analyser = originalCreateAnalyser.apply(this, arguments);
      const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
      analyser.getFloatFrequencyData = function(array) {
        originalGetFloatFrequencyData.apply(this, arguments);
        // Add noise to prevent fingerprinting
        for (let i = 0; i < array.length; i++) {
          array[i] += Math.random() * 0.001;
        }
      };
      return analyser;
    };

    // Block font fingerprinting
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      get() {
        const width = originalOffsetWidth.get.call(this);
        return width + Math.floor(Math.random() * 3) - 1;
      }
    });
  }

  isAdUrl(url) {
    const adDomains = [
      'doubleclick.net',
      'googleadservices.com',
      'googlesyndication.com',
      'amazon-adsystem.com',
      'adsystem.com',
      'adnxs.com',
      'ads.yahoo.com',
      'outbrain.com',
      'taboola.com',
      'scorecardresearch.com'
    ];

    return adDomains.some(domain => url.includes(domain));
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new NimbusGuardContent();
  });
} else {
  new NimbusGuardContent();
}