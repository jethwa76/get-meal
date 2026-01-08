/**
 * Particles Background Animation
 * Lightweight particle system using Canvas API
 * GPU-accelerated, performant, responsive
 * Alternative to particles-lazy.js (non-lazy version)
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    // Particle settings
    particleCount: 50,
    maxParticleSize: 3,
    minParticleSize: 1,
    maxSpeed: 0.5,
    minSpeed: 0.1,
    
    // Connection settings
    connectionDistance: 120,
    maxConnections: 3,
    
    // Colors
    particleColor: {
      r: 22,
      g: 163,
      b: 74,
      a: 0.6
    },
    lineColor: {
      r: 22,
      g: 163,
      b: 74,
      a: 0.2
    },
    
    // Performance
    fps: 60,
    pauseWhenHidden: true
  };
  
  const container = document.getElementById('particles-container');
  if (!container) {
    console.warn('Particles container not found');
    return;
  }
  
  // Check if motion is enabled
  const motionScale = window.motionUtils ? window.motionUtils.getMotionScale() : 1;
  if (motionScale === 0) {
    console.log('Particles disabled: motion is off');
    return;
  }
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d', { 
    alpha: true,
    desynchronized: true // Performance hint
  });
  
  let particles = [];
  let animationFrame = null;
  let isVisible = true;
  let lastFrameTime = Date.now();
  let fps = CONFIG.fps;
  
  /**
   * Resize canvas to match container
   */
  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled for retina displays)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Set display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Scale context for retina displays
    ctx.scale(dpr, dpr);
    
    return { width: rect.width, height: rect.height };
  }
  
  /**
   * Particle class
   */
  class Particle {
    constructor(canvasWidth, canvasHeight) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * this.canvasWidth;
      this.y = Math.random() * this.canvasHeight;
      this.size = Math.random() * (CONFIG.maxParticleSize - CONFIG.minParticleSize) + CONFIG.minParticleSize;
      
      const speed = Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed) + CONFIG.minSpeed;
      const angle = Math.random() * Math.PI * 2;
      
      this.speedX = Math.cos(angle) * speed;
      this.speedY = Math.sin(angle) * speed;
      this.opacity = Math.random() * 0.4 + 0.3;
      this.connections = 0;
    }
    
    update(deltaTime) {
      // Update position
      this.x += this.speedX * motionScale * deltaTime;
      this.y += this.speedY * motionScale * deltaTime;
      
      // Wrap around edges
      if (this.x > this.canvasWidth) this.x = 0;
      if (this.x < 0) this.x = this.canvasWidth;
      if (this.y > this.canvasHeight) this.y = 0;
      if (this.y < 0) this.y = this.canvasHeight;
      
      // Reset connections counter
      this.connections = 0;
    }
    
    draw() {
      const color = CONFIG.particleColor;
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  /**
   * Initialize particles
   */
  function init() {
    const dimensions = resizeCanvas();
    particles = [];
    
    // Scale particle count with screen size (but cap at max)
    const particleCount = Math.min(
      Math.floor(dimensions.width * dimensions.height / 15000),
      CONFIG.particleCount
    );
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(dimensions.width, dimensions.height));
    }
    
    console.log(`Particles initialized: ${particles.length} particles`);
  }
  
  /**
   * Calculate distance between two points
   */
  function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Draw connections between nearby particles
   */
  function drawConnections() {
    const color = CONFIG.lineColor;
    const maxDistance = CONFIG.connectionDistance;
    
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      
      // Limit connections per particle for performance
      if (p1.connections >= CONFIG.maxConnections) continue;
      
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        
        if (p2.connections >= CONFIG.maxConnections) continue;
        
        const distance = getDistance(p1.x, p1.y, p2.x, p2.y);
        
        if (distance < maxDistance) {
          const opacity = color.a * (1 - distance / maxDistance);
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          
          p1.connections++;
          p2.connections++;
        }
      }
    }
  }
  
  /**
   * Animation loop
   */
  function animate(currentTime) {
    if (!isVisible) return;
    
    // Calculate delta time for frame-independent animation
    const deltaTime = Math.min((currentTime - lastFrameTime) / 16.67, 2); // Cap at 2x normal speed
    lastFrameTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles.forEach(particle => {
      particle.update(deltaTime);
      particle.draw();
    });
    
    // Draw connections
    drawConnections();
    
    // Continue animation
    animationFrame = requestAnimationFrame(animate);
  }
  
  /**
   * Start animation
   */
  function start() {
    if (animationFrame) return;
    isVisible = true;
    lastFrameTime = Date.now();
    animationFrame = requestAnimationFrame(animate);
  }
  
  /**
   * Stop animation
   */
  function stop() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    isVisible = false;
  }
  
  /**
   * Destroy particles system
   */
  function destroy() {
    stop();
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    particles = [];
  }
  
  // Initialize
  init();
  start();
  
  // Resize handler (debounced)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      stop();
      init();
      start();
    }, 250);
  });
  
  // Pause animation when tab is not visible (performance optimization)
  if (CONFIG.pauseWhenHidden) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });
  }
  
  // Listen for motion preference changes
  if (window.motionUtils) {
    const checkMotion = setInterval(() => {
      const currentMotionScale = window.motionUtils.getMotionScale();
      if (currentMotionScale === 0 && isVisible) {
        destroy();
        clearInterval(checkMotion);
      }
    }, 1000);
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    destroy();
  });
  
  // Expose API for external control
  window.particlesAPI = {
    start: start,
    stop: stop,
    destroy: destroy,
    reinit: function() {
      stop();
      init();
      start();
    },
    getParticleCount: function() {
      return particles.length;
    },
    setConfig: function(newConfig) {
      Object.assign(CONFIG, newConfig);
      this.reinit();
    }
  };
  
})();