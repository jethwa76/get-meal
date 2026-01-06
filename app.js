// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

const CONFIG = {
  API_BASE_URL: 'https://api.foodrescue.example.com',
  ANALYTICS_ENABLED: true,
  MOTION_STORAGE_KEY: 'foodrescue_motion_preference',
  ANIMATION_DELAY: 150, // ms between scroll reveal animations
};

// ========================================
// ANALYTICS MODULE
// ========================================

const Analytics = {
  sendEvent(eventName, properties = {}) {
    if (!CONFIG.ANALYTICS_ENABLED) return;
    
    console.log('[Analytics Event]', eventName, properties);
    
    // Google Analytics 4 example
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    // Custom dataLayer push
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...properties,
      timestamp: new Date().toISOString(),
    });
  },
  
  trackPageView(pageName) {
    this.sendEvent('page_view', {
      page_title: pageName,
      page_location: window.location.href,
    });
  },
  
  trackClick(element, action) {
    this.sendEvent('button_click', {
      element_id: element.id,
      element_class: element.className,
      action: action,
    });
  },
  
  trackFormSubmit(formName, success, errorMessage = null) {
    this.sendEvent('form_submit', {
      form_name: formName,
      success: success,
      error_message: errorMessage,
    });
  },
  
  trackError(error, context) {
    this.sendEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      context: context,
    });
  }
};

// ========================================
// API MODULE
// ========================================

const API = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      Analytics.trackError(error, `API request to ${endpoint}`);
      throw error;
    }
  },
  
  // Donation endpoints
  async postDonation(data) {
    // Stub: Replace with actual endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          donationId: 'DON-' + Date.now(),
          message: 'Donation submitted successfully',
        });
      }, 1500);
    });
  },
  
  async getDonations() {
    return this.request('/donations');
  },
  
  async getOffers() {
    return this.request('/offers');
  },
  
  async acceptOffer(offerId) {
    return this.request(`/offers/${offerId}/accept`, {
      method: 'POST',
    });
  },
  
  async uploadProof(donationId, file) {
    const formData = new FormData();
    formData.append('proof', file);
    
    return this.request(`/donations/${donationId}/proof`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },
};

// ========================================
// MOTION PREFERENCES MODULE
// ========================================

const MotionPreferences = {
  init() {
    this.loadPreference();
    this.setupToggle();
    this.checkSystemPreference();
  },
  
  loadPreference() {
    const saved = localStorage.getItem(CONFIG.MOTION_STORAGE_KEY);
    if (saved) {
      document.documentElement.setAttribute('data-motion', saved);
    }
  },
  
  savePreference(preference) {
    localStorage.setItem(CONFIG.MOTION_STORAGE_KEY, preference);
    document.documentElement.setAttribute('data-motion', preference);
  },
  
  toggle() {
    const current = document.documentElement.getAttribute('data-motion');
    const newPref = current === 'reduced' ? 'full' : 'reduced';
    this.savePreference(newPref);
    
    Analytics.sendEvent('motion_preference_changed', {
      preference: newPref,
    });
  },
  
  setupToggle() {
    const toggle = document.getElementById('motion-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }
  },
  
  checkSystemPreference() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReduced.matches && !localStorage.getItem(CONFIG.MOTION_STORAGE_KEY)) {
      this.savePreference('reduced');
    }
    
    // Listen for changes
    prefersReduced.addEventListener('change', (e) => {
      if (e.matches) {
        this.savePreference('reduced');
      }
    });
  },
};

// ========================================
// SCROLL REVEAL MODULE
// ========================================

const ScrollReveal = {
  observer: null,
  
  init() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    
    if (!elements.length) return;
    
    // Check if motion is reduced
    const motionReduced = document.documentElement.getAttribute('data-motion') === 'reduced';
    
    if (motionReduced) {
      elements.forEach(el => el.classList.add('revealed'));
      return;
    }
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, index * CONFIG.ANIMATION_DELAY);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );
    
    elements.forEach(el => this.observer.observe(el));
  },
  
  refresh() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.init();
  },
};

// ========================================
// NAVIGATION MODULE
// ========================================

const Navigation = {
  init() {
    this.setupToggle();
    this.setupScrollBehavior();
    this.setupSmoothScroll();
  },
  
  setupToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    
    if (!toggle || !menu) return;
    
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isOpen);
      menu.classList.toggle('open');
      
      Analytics.sendEvent('nav_toggle', { is_open: !isOpen });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
      }
    });
    
    // Close menu on link click
    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
      });
    });
  },
  
  setupScrollBehavior() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 100) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      
      lastScroll = currentScroll;
    });
  },
  
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (!target) return;
        
        e.preventDefault();
        
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        
        // Update URL without jumping
        history.pushState(null, null, targetId);
        
        Analytics.sendEvent('smooth_scroll', { target: targetId });
      });
    });
  },
};

// ========================================
// BUTTON ANIMATIONS MODULE
// ========================================

const ButtonAnimations = {
  init() {
    this.setupRippleEffect();
    this.setupHoverEffects();
    this.setupCTATracking();
  },
  
  setupRippleEffect() {
    document.querySelectorAll('.btn-animated').forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = this.querySelector('.btn-ripple');
        if (!ripple) return;
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.classList.remove('ripple-active');
        void this.offsetWidth; // Trigger reflow
        this.classList.add('ripple-active');
        
        setTimeout(() => {
          this.classList.remove('ripple-active');
        }, 600);
      });
    });
  },
  
  setupHoverEffects() {
    // Additional hover effects can be added here
  },
  
  setupCTATracking() {
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        Analytics.trackClick(this, action);
      });
    });
  },
};

// ========================================
// FORM VALIDATION & SUBMISSION MODULE
// ========================================

const FormHandler = {
  init() {
    const form = document.getElementById('donation-form');
    if (!form) return;
    
    this.form = form;
    this.setupValidation();
    this.setupSubmission();
  },
  
  setupValidation() {
    const inputs = this.form.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
      // Real-time validation on blur
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
      
      // Clear error on input
      input.addEventListener('input', () => {
        this.clearError(input);
      });
    });
  },
  
  validateField(input) {
    const value = input.value.trim();
    const errorSpan = document.getElementById(`${input.id}-error`);
    
    if (!errorSpan) return true;
    
    // Required validation
    if (input.hasAttribute('required') && !value) {
      this.showError(input, 'This field is required');
      return false;
    }
    
    // Email validation
    if (input.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showError(input, 'Please enter a valid email address');
        return false;
      }
    }
    
    // Number validation
    if (input.type === 'number' && value) {
      const num = parseInt(value);
      const min = parseInt(input.getAttribute('min')) || 0;
      
      if (num < min) {
        this.showError(input, `Value must be at least ${min}`);
        return false;
      }
    }
    
    // Datetime validation
    if (input.type === 'datetime-local' && value) {
      const selectedDate = new Date(value);
      const now = new Date();
      
      if (selectedDate < now) {
        this.showError(input, 'Pickup time must be in the future');
        return false;
      }
    }
    
    this.clearError(input);
    return true;
  },
  
  showError(input, message) {
    const errorSpan = document.getElementById(`${input.id}-error`);
    if (errorSpan) {
      errorSpan.textContent = message;
      input.classList.add('error');
      input.setAttribute('aria-invalid', 'true');
    }
  },
  
  clearError(input) {
    const errorSpan = document.getElementById(`${input.id}-error`);
    if (errorSpan) {
      errorSpan.textContent = '';
      input.classList.remove('error');
      input.removeAttribute('aria-invalid');
    }
  },
  
  validateForm() {
    const inputs = this.form.querySelectorAll('.form-input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  },
  
  setupSubmission() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate form
      if (!this.validateForm()) {
        Analytics.sendEvent('form_validation_failed', {
          form_name: 'donation_form',
        });
        return;
      }
      
      // Get form data
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData.entries());
      
      // Sanitize inputs (basic XSS prevention)
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = data[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
      });
      
      // Show loading state
      const submitBtn = this.form.querySelector('.btn-submit');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      
      try {
        // Submit to API
        const response = await API.postDonation(data);
        
        // Hide form
        this.form.style.display = 'none';
        
        // Show success message
        const successMsg = document.getElementById('form-success');
        if (successMsg) {
          successMsg.removeAttribute('hidden');
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Track success
        Analytics.trackFormSubmit('donation_form', true);
        
        // Reset form after delay
        setTimeout(() => {
          this.form.reset();
          this.form.style.display = 'flex';
          if (successMsg) successMsg.setAttribute('hidden', '');
        }, 5000);
        
      } catch (error) {
        console.error('Form submission error:', error);
        
        // Show error message
        const errorMsg = document.getElementById('form-error');
        if (errorMsg) {
          errorMsg.removeAttribute('hidden');
          errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Track error
        Analytics.trackFormSubmit('donation_form', false, error.message);
        
        // Hide error after delay
        setTimeout(() => {
          if (errorMsg) errorMsg.setAttribute('hidden', '');
        }, 5000);
        
      } finally {
        // Remove loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  },
};

// ========================================
// COUNTER ANIMATION MODULE
// ========================================

const CounterAnimation = {
  init() {
    const counters = document.querySelectorAll('.stat-number');
    if (!counters.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    
    counters.forEach(counter => observer.observe(counter));
  },
  
  animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
      }
    };
    
    updateCounter();
  },
};

// ========================================
// PAGE VISIBILITY API
// ========================================

const PageVisibility = {
  init() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });
  },
  
  pauseAnimations() {
    // Pause CSS animations
    document.querySelectorAll('.gradient-orb, .impact-icon').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
    
    Analytics.sendEvent('page_hidden');
  },
  
  resumeAnimations() {
    // Resume CSS animations
    document.querySelectorAll('.gradient-orb, .impact-icon').forEach(el => {
      el.style.animationPlayState = 'running';
    });
    
    Analytics.sendEvent('page_visible');
  },
};

// ========================================
// LOADING SCREEN MODULE
// ========================================

const LoadingScreen = {
  init() {
    window.addEventListener('load', () => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 2000);
      }
    });
  },
};

// ========================================
// PERFORMANCE MONITORING
// ========================================

const PerformanceMonitoring = {
  init() {
    if ('PerformanceObserver' in window) {
      this.observeLCP();
      this.observeCLS();
      this.observeFID();
    }
  },
  
  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      Analytics.sendEvent('lcp', {
        value: lastEntry.renderTime || lastEntry.loadTime,
        element: lastEntry.element?.tagName,
      });
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  },
  
  observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      Analytics.sendEvent('cls', { value: clsValue });
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  },
  
  observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0];
      
      Analytics.sendEvent('fid', {
        value: firstInput.processingStart - firstInput.startTime,
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  },
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🍽️ FoodRescue Platform Initialized');
  
  // Initialize all modules
  MotionPreferences.init();
  Navigation.init();
  ScrollReveal.init();
  ButtonAnimations.init();
  FormHandler.init();
  CounterAnimation.init();
  PageVisibility.init();
  LoadingScreen.init();
  PerformanceMonitoring.init();
  
  // Track page view
  Analytics.trackPageView('Landing Page');
  
  // Log performance metrics
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('⚡ Performance Metrics:', {
      domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
      loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart),
      domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
    });
  });
});

// Error handling
window.addEventListener('error', (e) => {
  Analytics.trackError(e.error || new Error(e.message), 'Global error handler');
});

window.addEventListener('unhandledrejection', (e) => {
  Analytics.trackError(e.reason, 'Unhandled promise rejection');
  console.error('Unhandled promise rejection:', e.reason);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Analytics,
    API,
    MotionPreferences,
    ScrollReveal,
    Navigation,
    FormHandler,
  };
}