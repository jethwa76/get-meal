/**
 * Main Application Logic
 * Navigation, scroll effects, stat counters, intersection observers
 * Handles all interactive features and UI enhancements
 */

(function() {
  'use strict';
  
  // ========== MOBILE NAVIGATION ==========
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const body = document.body;
  
  if (mobileMenuToggle && navMenu) {
    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', () => {
      const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
      
      // Prevent body scroll when menu is open
      body.style.overflow = !isExpanded ? 'hidden' : '';
      
      // Trap focus when menu is open
      if (!isExpanded) {
        trapFocus(navMenu);
      } else {
        releaseFocus();
      }
    });
    
    // Close menu when clicking nav links
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        body.style.overflow = '';
        releaseFocus();
      });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        body.style.overflow = '';
        mobileMenuToggle.focus();
        releaseFocus();
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') && 
          !navMenu.contains(e.target) && 
          !mobileMenuToggle.contains(e.target)) {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        body.style.overflow = '';
        releaseFocus();
      }
    });
  }
  
  // ========== FOCUS TRAP FOR MOBILE MENU ==========
  let focusableElements = [];
  let firstFocusable = null;
  let lastFocusable = null;
  
  function trapFocus(element) {
    focusableElements = Array.from(
      element.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    
    firstFocusable = focusableElements[0];
    lastFocusable = focusableElements[focusableElements.length - 1];
    
    document.addEventListener('keydown', handleFocusTrap);
    
    // Focus first element
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
  }
  
  function releaseFocus() {
    document.removeEventListener('keydown', handleFocusTrap);
  }
  
  function handleFocusTrap(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }
  
  // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        
        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains('open')) {
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('open');
          body.style.overflow = '';
          releaseFocus();
        }
        
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        const motionEnabled = window.motionUtils && window.motionUtils.isMotionEnabled();
        
        window.scrollTo({
          top: offsetPosition,
          behavior: motionEnabled ? 'smooth' : 'auto'
        });
        
        // Set focus to target for keyboard users
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        
        // Remove tabindex after focus (so it doesn't stay in tab order)
        target.addEventListener('blur', function() {
          target.removeAttribute('tabindex');
        }, { once: true });
      }
    });
  });
  
  // ========== STAT COUNTER ANIMATION ==========
  const statValues = document.querySelectorAll('.stat-value[data-count]');
  let hasCounted = false;
  
  function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'), 10);
    const duration = 2000; // 2 seconds
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const motionScale = window.motionUtils ? window.motionUtils.getMotionScale() : 1;
    
    // If motion is disabled, show final value immediately
    if (motionScale === 0) {
      element.textContent = target.toLocaleString();
      return;
    }
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current).toLocaleString();
    }, 16);
  }
  
  // Intersection Observer for stat counters
  if (statValues.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasCounted) {
          hasCounted = true;
          statValues.forEach(stat => {
            animateCounter(stat);
          });
        }
      });
    }, {
      threshold: 0.5
    });
    
    const statsSection = document.querySelector('.section-impact');
    if (statsSection) {
      statsObserver.observe(statsSection);
    }
  }
  
  // ========== FADE-IN ANIMATION ON SCROLL ==========
  const fadeElements = document.querySelectorAll('.step-card, .stat-card');
  
  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger animation
          setTimeout(() => {
            entry.target.classList.add('fade-in');
          }, index * 100);
          fadeObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    fadeElements.forEach(el => fadeObserver.observe(el));
  } else {
    // Fallback: show all elements immediately
    fadeElements.forEach(el => el.classList.add('fade-in'));
  }
  
  // ========== HEADER SHADOW ON SCROLL ==========
  const header = document.querySelector('.site-header');
  let lastScrollY = window.pageYOffset;
  let ticking = false;
  
  function updateHeader() {
    const scrollY = window.pageYOffset;
    
    if (scrollY > 10) {
      header.style.boxShadow = 'var(--shadow-md)';
    } else {
      header.style.boxShadow = 'none';
    }
    
    lastScrollY = scrollY;
    ticking = false;
  }
  
  function requestHeaderUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
  updateHeader(); // Initial check
  
  // ========== CTA BUTTON ACTIONS ==========
  document.querySelectorAll('.btn[data-action]').forEach(button => {
    button.addEventListener('click', (e) => {
      const action = button.getAttribute('data-action');
      
      if (action === 'donate') {
        const donateSection = document.getElementById('donate');
        if (donateSection) {
          e.preventDefault();
          
          const headerOffset = 80;
          const elementPosition = donateSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          const motionEnabled = window.motionUtils && window.motionUtils.isMotionEnabled();
          
          window.scrollTo({
            top: offsetPosition,
            behavior: motionEnabled ? 'smooth' : 'auto'
          });
          
          // Focus first form field
          const firstInput = donateSection.querySelector('input');
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 500);
          }
        }
      } else if (action === 'volunteer') {
        // Replace with actual volunteer form/page
        // For now, show alert (replace with modal or navigation)
        alert('Volunteer registration coming soon! For now, please contact us directly at volunteer@foodrescue.org');
      }
    });
  });
  
  // ========== RIPPLE EFFECT FOR BUTTONS ==========
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
      
      // Reset animation
      ripple.style.animation = 'none';
      // Trigger reflow to restart animation
      void ripple.offsetWidth;
      ripple.style.animation = '';
    });
  });
  
  // ========== PERFORMANCE MONITORING (Development Only) ==========
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const connectTime = perfData.responseEnd - perfData.requestStart;
        const renderTime = perfData.domComplete - perfData.domLoading;
        
        console.log('Performance Metrics:');
        console.log(`Page Load Time: ${pageLoadTime}ms`);
        console.log(`Connect Time: ${connectTime}ms`);
        console.log(`Render Time: ${renderTime}ms`);
        
        // Log Core Web Vitals if available
        if ('PerformanceObserver' in window) {
          try {
            // LCP (Largest Contentful Paint)
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              const lcp = lastEntry.renderTime || lastEntry.loadTime;
              console.log(`LCP: ${lcp.toFixed(2)}ms`);
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            // FID (First Input Delay)
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach(entry => {
                const fid = entry.processingStart - entry.startTime;
                console.log(`FID: ${fid.toFixed(2)}ms`);
              });
            }).observe({ entryTypes: ['first-input'] });
            
            // CLS (Cumulative Layout Shift)
            let clsScore = 0;
            new PerformanceObserver((list) => {
              list.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) {
                  clsScore += entry.value;
                }
              });
              console.log(`CLS: ${clsScore.toFixed(4)}`);
            }).observe({ entryTypes: ['layout-shift'] });
          } catch (e) {
            console.log('Performance Observer not fully supported');
          }
        }
      }, 0);
    });
  }
  
  // ========== LAZY LOAD IMAGES (if any added later) ==========
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  // ========== PREVENT FOUC (Flash of Unstyled Content) ==========
  document.documentElement.classList.add('js-loaded');
  
  // ========== ERROR BOUNDARY (Global error handling) ==========
  window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Optional: Send to error tracking service
    // if (window.gtag) {
    //   gtag('event', 'exception', {
    //     description: e.error.message,
    //     fatal: true
    //   });
    // }
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    // Optional: Send to error tracking service
  });
  
  // ========== INITIALIZE APP ==========
  console.log('Food Rescue Network initialized successfully');
  
})();