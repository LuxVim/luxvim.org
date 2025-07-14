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

    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  createParticles() {
    const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 8000)
    this.particles = []

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  createParticle() {
    const isDark = document.documentElement.classList.contains('dark')
    const colors = isDark
      ? ['#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1', '#fbbf24', '#fde047']
      : ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a', '#1e40af']

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
      baseOpacity = isDark ? 0.9 : 0.8
      twinkleSpeed = 0.03
    } else if (starType < 0.3) {
      // Medium stars (20%)
      baseRadius = brightness * 1.5 + 0.8
      baseOpacity = isDark ? 0.7 : 0.6
      twinkleSpeed = 0.02
    } else {
      // Dim stars (70%)
      baseRadius = brightness * 0.8 + 0.3
      baseOpacity = isDark ? 0.4 : 0.3
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
      opacity: baseOpacity * (0.7 + Math.random() * 0.3),
      baseOpacity: baseOpacity * (0.7 + Math.random() * 0.3),
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

    this.particles.forEach((particle, index) => {
      // Gentle drifting motion
      particle.x += particle.vx
      particle.y += particle.vy

      // Subtle random movement for atmospheric effect
      particle.x += (Math.random() - 0.5) * 0.05
      particle.y += (Math.random() - 0.5) * 0.05

      // Twinkling effect
      particle.twinklePhase += particle.twinkleSpeed
      const twinkleFactor = Math.sin(particle.twinklePhase) * 0.3 + 0.7
      particle.currentOpacity = particle.baseOpacity * twinkleFactor

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
      if (particle.starType < 0.1) {
        this.ctx.shadowColor = particle.color
        this.ctx.shadowBlur = particle.radius * 4
        this.ctx.shadowOffsetX = 0
        this.ctx.shadowOffsetY = 0
      } else if (particle.starType < 0.3) {
        this.ctx.shadowColor = particle.color
        this.ctx.shadowBlur = particle.radius * 2
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.updateParticles()
    this.drawParticles()

    this.animationId = requestAnimationFrame(() => this.animate())
  }

  updateParticleColors() {
    // Update existing particles with new theme colors
    this.particles.forEach(particle => {
      const isDark = document.documentElement.classList.contains('dark')
      const colors = isDark
        ? ['#ffffff', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
        : ['#1f2937', '#7c3aed', '#be185d', '#1d4ed8', '#047857']

      particle.color = colors[Math.floor(Math.random() * colors.length)]
      particle.opacity = isDark ? Math.random() * 0.8 + 0.2 : Math.random() * 0.9 + 0.4
    })
  }

  handleResize() {
    this.resizeCanvas()
    this.createParticles()
  }

  handleThemeChange() {
    // Update particle colors when theme changes
    this.updateParticleColors()
  }
}