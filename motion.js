/**
 * Motion Control & Accessibility
 * Manages motion preferences and --motion-scale CSS variable
 * Respects prefers-reduced-motion and provides user toggle
 */

(function() {
  'use strict';
  
  const STORAGE_KEY = 'motionEnabled';
  const root = document.documentElement;
  const motionToggleBtn = document.querySelector('.motion-toggle-btn');
  
  // Check system preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Get stored preference or use system preference
  let motionEnabled = localStorage.getItem(STORAGE_KEY);
  if (motionEnabled === null) {
    // No stored preference, use system preference (invert because we want motion enabled by default)
    motionEnabled = !prefersReducedMotion;
  } else {
    motionEnabled = motionEnabled === 'true';
  }
  
  /**
   * Set motion scale CSS variable
   * @param {boolean} enabled - Whether motion is enabled
   */
  function setMotionScale(enabled) {
    // Set CSS variable: 1 for full motion, 0 for no motion
    root.style.setProperty('--motion-scale', enabled ? '1' : '0');
    
    // Update button state
    if (motionToggleBtn) {
      motionToggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      motionToggleBtn.title = enabled ? 'Disable animations' : 'Enable animations';
      
      // Update icon (optional visual feedback)
      const icon = motionToggleBtn.querySelector('.toggle-icon');
      if (icon) {
        icon.textContent = enabled ? '🎬' : '⏸️';
      }
    }
    
    // Add class to body for additional CSS hooks
    document.body.classList.toggle('motion-reduced', !enabled);
  }
  
  /**
   * Announce to screen readers
   * @param {string} message - Message to announce
   */
  function announceToScreenReader(message) {
    const liveRegion = document.getElementById('form-status');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }
  
  // Initialize motion scale
  setMotionScale(motionEnabled);
  
  // Toggle button handler
  if (motionToggleBtn) {
    motionToggleBtn.addEventListener('click', () => {
      motionEnabled = !motionEnabled;
      localStorage.setItem(STORAGE_KEY, motionEnabled);
      setMotionScale(motionEnabled);
      
      // Announce to screen readers
      const announcement = motionEnabled ? 'Animations enabled' : 'Animations disabled';
      announceToScreenReader(announcement);
    });
  }
  
  // Listen for system preference changes
  const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  // Modern browsers
  if (motionMediaQuery.addEventListener) {
    motionMediaQuery.addEventListener('change', (e) => {
      // Only update if user hasn't set manual preference
      if (localStorage.getItem(STORAGE_KEY) === null) {
        motionEnabled = !e.matches;
        setMotionScale(motionEnabled);
      }
    });
  } 
  // Older browsers
  else if (motionMediaQuery.addListener) {
    motionMediaQuery.addListener((e) => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        motionEnabled = !e.matches;
        setMotionScale(motionEnabled);
      }
    });
  }
  
  // Export utilities for use in other scripts
  window.motionUtils = {
    /**
     * Check if motion is currently enabled
     * @returns {boolean}
     */
    isMotionEnabled: function() {
      return motionEnabled;
    },
    
    /**
     * Get current motion scale value
     * @returns {number} 0 or 1
     */
    getMotionScale: function() {
      const value = getComputedStyle(root).getPropertyValue('--motion-scale').trim();
      return parseFloat(value) || 0;
    },
    
    /**
     * Manually set motion enabled state
     * @param {boolean} enabled
     */
    setMotionEnabled: function(enabled) {
      motionEnabled = enabled;
      localStorage.setItem(STORAGE_KEY, enabled);
      setMotionScale(enabled);
    }
  };
  
  // Log initialization (development only - remove in production)
  if (console && console.log) {
    console.log('Motion initialized:', {
      enabled: motionEnabled,
      systemPreference: prefersReducedMotion ? 'reduce' : 'no-preference',
      scale: window.motionUtils.getMotionScale()
    });
  }
  
})();