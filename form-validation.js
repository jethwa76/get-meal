/**
 * Form Validation & Submission
 * Inline validation with accessible error messages
 * Real-time feedback, optimistic UI, robust error handling
 */

(function() {
  'use strict';
  
  const form = document.getElementById('donation-form');
  if (!form) return;
  
  const submitButton = form.querySelector('.btn-submit');
  const successMessage = document.getElementById('form-success');
  const errorMessage = document.getElementById('form-error');
  const errorText = document.getElementById('form-error-text');
  const liveRegion = document.getElementById('form-status');
  
  // Validation rules
  const validators = {
    businessName: {
      test: (value) => value.trim().length >= 2,
      message: 'Business name must be at least 2 characters'
    },
    contactName: {
      test: (value) => value.trim().length >= 2,
      message: 'Contact name must be at least 2 characters'
    },
    email: {
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Please enter a valid email address'
    },
    phone: {
      test: (value) => /^[\d\s\-\+\(\)]{10,}$/.test(value),
      message: 'Please enter a valid phone number (at least 10 digits)'
    },
    foodType: {
      test: (value) => value !== '',
      message: 'Please select a food type'
    },
    quantity: {
      test: (value) => {
        const num = parseInt(value, 10);
        return !isNaN(num) && num > 0;
      },
      message: 'Quantity must be greater than 0'
    },
    pickupTime: {
      test: (value) => {
        if (!value) return false;
        const selectedDate = new Date(value);
        const now = new Date();
        return selectedDate > now;
      },
      message: 'Pickup time must be in the future'
    },
    terms: {
      test: (value) => value === true,
      message: 'You must agree to the terms and conditions'
    }
  };
  
  /**
   * Validate single field
   * @param {HTMLElement} field - Form field to validate
   * @returns {boolean} - True if valid
   */
  function validateField(field) {
    const name = field.name;
    const value = field.type === 'checkbox' ? field.checked : field.value;
    const errorElement = document.getElementById(`${field.id}-error`);
    
    // Skip if no validator for this field
    if (!validators[name]) return true;
    
    const isValid = validators[name].test(value);
    
    if (!isValid) {
      field.classList.add('error');
      if (errorElement) {
        errorElement.textContent = validators[name].message;
      }
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.classList.remove('error');
      if (errorElement) {
        errorElement.textContent = '';
      }
      field.setAttribute('aria-invalid', 'false');
    }
    
    return isValid;
  }
  
  /**
   * Validate entire form
   * @returns {boolean} - True if all fields valid
   */
  function validateForm() {
    let isValid = true;
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  /**
   * Clear all form errors
   */
  function clearErrors() {
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    form.querySelectorAll('[aria-invalid="true"]').forEach(el => {
      el.setAttribute('aria-invalid', 'false');
    });
  }
  
  /**
   * Announce to screen readers
   * @param {string} message - Message to announce
   */
  function announceToScreenReader(message) {
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  }
  
  /**
   * Show success message
   */
  function showSuccess() {
    successMessage.hidden = false;
    errorMessage.hidden = true;
    announceToScreenReader('Thank you! Your donation has been submitted successfully.');
    
    // Scroll to success message
    successMessage.scrollIntoView({ 
      behavior: window.motionUtils && window.motionUtils.isMotionEnabled() ? 'smooth' : 'auto',
      block: 'nearest' 
    });
  }
  
  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  function showError(message) {
    errorText.textContent = message || 'An error occurred. Please try again.';
    errorMessage.hidden = false;
    successMessage.hidden = true;
    announceToScreenReader('An error occurred. Please try again.');
    
    // Scroll to error message
    errorMessage.scrollIntoView({ 
      behavior: window.motionUtils && window.motionUtils.isMotionEnabled() ? 'smooth' : 'auto',
      block: 'nearest' 
    });
  }
  
  /**
   * Set button loading state
   * @param {boolean} loading - Whether button is loading
   */
  function setLoading(loading) {
    if (loading) {
      submitButton.classList.add('loading');
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    } else {
      submitButton.classList.remove('loading');
      submitButton.disabled = false;
      submitButton.setAttribute('aria-busy', 'false');
    }
  }
  
  // Add real-time validation on blur
  form.addEventListener('blur', (e) => {
    if (e.target.matches('input, select, textarea')) {
      validateField(e.target);
    }
  }, true); // Use capture phase
  
  // Clear errors on input (immediate feedback)
  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('error')) {
      validateField(e.target);
    }
  });
  
  // Clear errors on change (for select/checkbox)
  form.addEventListener('change', (e) => {
    if (e.target.matches('select, input[type="checkbox"]')) {
      if (e.target.classList.contains('error')) {
        validateField(e.target);
      }
    }
  });
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous messages
    successMessage.hidden = true;
    errorMessage.hidden = true;
    
    // Validate
    if (!validateForm()) {
      announceToScreenReader('Form has errors. Please correct them and try again.');
      
      // Focus first error
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.focus();
        
        // Scroll to first error
        firstError.scrollIntoView({ 
          behavior: window.motionUtils && window.motionUtils.isMotionEnabled() ? 'smooth' : 'auto',
          block: 'center' 
        });
      }
      return;
    }
    
    // Show loading state
    setLoading(true);
    
    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Add timestamp
    data.submittedAt = new Date().toISOString();
    
    try {
      // Call API (replace mockAPICall with real implementation)
      const response = await submitDonation(data);
      
      if (response.success) {
        // Show success message
        showSuccess();
        
        // Reset form
        form.reset();
        clearErrors();
        
        // Optional: track conversion
        if (window.gtag) {
          window.gtag('event', 'donation_submitted', {
            event_category: 'form',
            event_label: data.foodType
          });
        }
      } else {
        throw new Error(response.error || 'Submission failed');
      }
    } catch (error) {
      // Show error message
      showError(error.message);
      
      // Log error for debugging
      console.error('Form submission error:', error);
      
      // Optional: track error
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false
        });
      }
    } finally {
      // Remove loading state
      setLoading(false);
    }
  });
  
  /**
   * Submit donation to API
   * @param {Object} data - Form data
   * @returns {Promise<Object>} - Response object
   */
  async function submitDonation(data) {
    // MOCK API CALL - Replace with real implementation
    return mockAPICall(data);
    
    /* REAL API IMPLEMENTATION:
    
    const response = await fetch('/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': 'Bearer ' + getAuthToken()
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid form data');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
    
    return await response.json();
    */
  }
  
  /**
   * Mock API call for development
   * @param {Object} data - Form data
   * @returns {Promise<Object>} - Mock response
   */
  function mockAPICall(data) {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate 90% success rate
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            id: 'DON-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            message: 'Donation received successfully'
          });
        } else {
          // Simulate random errors
          const errors = [
            'Server error. Please try again later.',
            'Network timeout. Please check your connection.',
            'Unable to process donation. Please contact support.'
          ];
          reject(new Error(errors[Math.floor(Math.random() * errors.length)]));
        }
      }, 1500);
    });
  }
  
  /**
   * Initialize datetime-local input with minimum time (now + 1 hour)
   */
  function initializePickupTime() {
    const pickupInput = document.getElementById('pickup-time');
    if (!pickupInput) return;
    
    const now = new Date();
    now.setHours(now.getHours() + 1); // Minimum 1 hour from now
    now.setMinutes(0, 0, 0); // Round to nearest hour
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    pickupInput.setAttribute('min', minDateTime);
  }
  
  // Initialize on load
  initializePickupTime();
  
})();