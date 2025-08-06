// src/scripts/controllers/theme_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["canvas"]

  connect() {
    // Initialize galaxy animation
    this.initializeGalaxy()

    // Handle window resize
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)

    // Handle scroll events for performance
    this.isScrolling = false
    this.scrollTimeout = null
    this.handleScroll = this.handleScroll.bind(this)
    window.addEventListener('scroll', this.handleScroll, { passive: true })

    // Handle theme changes
    this.handleThemeChange = this.handleThemeChange.bind(this)
    const observer = new MutationObserver(this.handleThemeChange)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    this.themeObserver = observer
  }

  disconnect() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('scroll', this.handleScroll)
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect()
    }
  }

  initializeGalaxy() {
    // Find canvas within this controller's scope
    const canvas = this.element.querySelector('canvas')
    if (!canvas) return

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.particles = []
    this.mouse = { x: 0, y: 0 }
    this.time = 0

    this.resizeCanvas()
    this.createParticles()
    this.animate()

    // Add mouse interaction
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      this.mouse.x = e.clientX - rect.left
      this.mouse.y = e.clientY - rect.top
    })

    canvas.addEventListener('click', () => {
      this.addParticles(3)
    })
  }

  resizeCanvas() {
    if (!this.canvas) return

    // Use container dimensions but ensure they don't exceed viewport
    const container = this.canvas.parentElement
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // On mobile, ensure canvas doesn't exceed viewport width
    const isMobile = window.innerWidth <= 768
    const width = isMobile ? Math.min(containerWidth, window.innerWidth) : containerWidth
    const height = containerHeight
    
    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.ctx.scale(dpr, dpr)
    
    // Set CSS size to maintain proper display
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'

  }

  createParticles() {
    // Reduce particle count on mobile devices for better performance
    const isMobile = window.innerWidth <= 768
    const baseArea = this.canvas.width * this.canvas.height
    const divisor = isMobile ? 12000 : 8000
    const particleCount = Math.floor(baseArea / divisor)
    
    this.particles = []

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  createParticle() {
    const isDark = document.documentElement.classList.contains('dark')
    const colors = isDark
      ? ['#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1', '#fbbf24', '#fde047']
      : ['#7c3aed', '#ec4899', '#f59e0b', '#ef4444', '#8b5cf6', '#d946ef']

    // Random distribution across the sky
    const x = Math.random() * this.canvas.width
    const y = Math.random() * this.canvas.height

    // Gentle drift motion
    const driftSpeed = 0.1
    const driftAngle = Math.random() * Math.PI * 2
    const vx = Math.cos(driftAngle) * driftSpeed * (Math.random() - 0.5)
    const vy = Math.sin(driftAngle) * driftSpeed * (Math.random() - 0.5)

    // Star characteristics - some are brighter/bigger than others
    const brightness = Math.random()
    const starType = Math.random()
    let baseRadius, baseOpacity, twinkleSpeed

    if (starType < 0.1) {
      // Bright stars (10%)
      baseRadius = brightness * 2.5 + 1.5
      baseOpacity = isDark ? 0.9 : 1.0
      twinkleSpeed = 0.03
    } else if (starType < 0.3) {
      // Medium stars (20%)
      baseRadius = brightness * 1.5 + 0.8
      baseOpacity = isDark ? 0.7 : 1.0
      twinkleSpeed = 0.02
    } else {
      // Dim stars (70%)
      baseRadius = brightness * 0.8 + 0.3
      baseOpacity = isDark ? 0.4 : 0.9
      twinkleSpeed = 0.015
    }

    return {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      radius: baseRadius,
      baseRadius: baseRadius,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: isDark ? baseOpacity * (0.7 + Math.random() * 0.3) : 1.0,
      baseOpacity: isDark ? baseOpacity * (0.7 + Math.random() * 0.3) : 1.0,
      twinkleSpeed: twinkleSpeed + (Math.random() - 0.5) * 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
      brightness: brightness,
      starType: starType
    }
  }

  addParticles(count) {
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle()
      particle.x = this.mouse.x + (Math.random() - 0.5) * 100
      particle.y = this.mouse.y + (Math.random() - 0.5) * 100
      this.particles.push(particle)
    }
  }

  updateParticles() {
    this.time += 0.01

    this.particles.forEach((particle) => {
      // Gentle drifting motion
      particle.x += particle.vx
      particle.y += particle.vy

      // Subtle random movement for atmospheric effect
      particle.x += (Math.random() - 0.5) * 0.05
      particle.y += (Math.random() - 0.5) * 0.05

      // Twinkling effect
      particle.twinklePhase += particle.twinkleSpeed
      const twinkleFactor = Math.sin(particle.twinklePhase) * 0.3 + 0.7
      const isDark = document.documentElement.classList.contains('dark')
      particle.currentOpacity = isDark ? particle.baseOpacity * twinkleFactor : 1.0

      // Size twinkling for brighter stars
      if (particle.starType < 0.1) {
        const sizeTwinkle = Math.sin(particle.twinklePhase * 0.7) * 0.3 + 1
        particle.radius = particle.baseRadius * sizeTwinkle
      } else {
        const sizeTwinkle = Math.sin(particle.twinklePhase * 0.5) * 0.1 + 1
        particle.radius = particle.baseRadius * sizeTwinkle
      }

      // Wrap around screen edges for infinite sky feel
      if (particle.x < -10) particle.x = this.canvas.width + 10
      if (particle.x > this.canvas.width + 10) particle.x = -10
      if (particle.y < -10) particle.y = this.canvas.height + 10
      if (particle.y > this.canvas.height + 10) particle.y = -10

      // Occasionally change drift direction slightly
      if (Math.random() < 0.001) {
        particle.vx += (Math.random() - 0.5) * 0.02
        particle.vy += (Math.random() - 0.5) * 0.02
        // Keep drift speed reasonable
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
        if (speed > 0.2) {
          particle.vx = (particle.vx / speed) * 0.2
          particle.vy = (particle.vy / speed) * 0.2
        }
      }
    })
  }

  drawParticles() {
    // Sort particles by brightness for proper layering
    const sortedParticles = [...this.particles].sort((a, b) => a.brightness - b.brightness)

    sortedParticles.forEach(particle => {
      this.ctx.save()

      // Create glow effect for bright stars
      const isDark = document.documentElement.classList.contains('dark')
      if (particle.starType < 0.1) {
        this.ctx.shadowColor = particle.color
        this.ctx.shadowBlur = isDark ? particle.radius * 4 : particle.radius * 6
        this.ctx.shadowOffsetX = 0
        this.ctx.shadowOffsetY = 0
      } else if (particle.starType < 0.3) {
        this.ctx.shadowColor = particle.color
        this.ctx.shadowBlur = isDark ? particle.radius * 2 : particle.radius * 4
        this.ctx.shadowOffsetX = 0
        this.ctx.shadowOffsetY = 0
      } else if (!isDark) {
        // Add glow to all particles in light mode for visibility
        this.ctx.shadowColor = particle.color
        this.ctx.shadowBlur = particle.radius * 3
        this.ctx.shadowOffsetX = 0
        this.ctx.shadowOffsetY = 0
      }

      this.ctx.globalAlpha = particle.currentOpacity
      this.ctx.fillStyle = particle.color
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      this.ctx.fill()

      // Add bright center for prominent stars
      if (particle.starType < 0.3) {
        this.ctx.globalAlpha = particle.currentOpacity * 0.8
        this.ctx.fillStyle = '#ffffff'
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, particle.radius * 0.4, 0, Math.PI * 2)
        this.ctx.fill()
      }

      this.ctx.restore()
    })
  }

  drawConnections() {
    const isDark = document.documentElement.classList.contains('dark')
    const connectionColor = isDark ? '#a855f7' : '#7c3aed'
    const maxDistance = 150

    this.particles.forEach((particle, i) => {
      // Connect to nearby particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j]
        const dx = particle.x - other.x
        const dy = particle.y - other.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const opacity = isDark
            ? (1 - distance / maxDistance) * 0.2
            : (1 - distance / maxDistance) * 0.4
          this.ctx.save()
          this.ctx.globalAlpha = opacity
          this.ctx.strokeStyle = connectionColor
          this.ctx.lineWidth = isDark ? 0.5 : 1
          this.ctx.beginPath()
          this.ctx.moveTo(particle.x, particle.y)
          this.ctx.lineTo(other.x, other.y)
          this.ctx.stroke()
          this.ctx.restore()
        }
      }

      // Connect to mouse
      const dx = particle.x - this.mouse.x
      const dy = particle.y - this.mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 100) {
        const opacity = isDark
          ? (1 - distance / 100) * 0.3
          : (1 - distance / 100) * 0.6
        this.ctx.save()
        this.ctx.globalAlpha = opacity
        this.ctx.strokeStyle = connectionColor
        this.ctx.lineWidth = isDark ? 1 : 1.5
        this.ctx.beginPath()
        this.ctx.moveTo(particle.x, particle.y)
        this.ctx.lineTo(this.mouse.x, this.mouse.y)
        this.ctx.stroke()
        this.ctx.restore()
      }
    })
  }

  animate() {
    // Skip animation during scroll for better performance
    if (this.isScrolling) {
      this.animationId = requestAnimationFrame(() => this.animate())
      return
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Reduce update frequency during scroll for better performance
    const shouldUpdate = !this.isScrolling || (performance.now() - (this.lastScrollUpdate || 0)) > 100
    
    if (shouldUpdate) {
      this.updateParticles()
      if (this.isScrolling) {
        this.lastScrollUpdate = performance.now()
      }
    }
    
    this.drawParticles()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  updateParticleColors() {
    // Update existing particles with new theme colors
    this.particles.forEach(particle => {
      const isDark = document.documentElement.classList.contains('dark')
      const colors = isDark
        ? ['#ffffff', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
        : ['#7c3aed', '#ec4899', '#f59e0b', '#ef4444', '#8b5cf6']

      particle.color = colors[Math.floor(Math.random() * colors.length)]
      particle.opacity = isDark ? Math.random() * 0.8 + 0.2 : 1.0
      particle.baseOpacity = isDark ? Math.random() * 0.8 + 0.2 : 1.0
    })
  }

  handleResize() {
    this.resizeCanvas()
    this.createParticles()
  }

  handleScroll() {

    // Don't pause animation completely - instead reduce update frequency
    if (!this.isScrolling) {
      this.isScrolling = true
      this.scrollStartTime = performance.now()
    }

    
    // Clear previous timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
    

    // Resume normal animation after scroll ends
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false
    }, 100)

  }

  handleThemeChange() {
    // Update particle colors when theme changes
    this.updateParticleColors()
  }
}