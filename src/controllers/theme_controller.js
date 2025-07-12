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
  }

  disconnect() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener('resize', this.handleResize)
  }




  initializeGalaxy() {
    const canvas = document.getElementById('galaxy-canvas')
    if (!canvas) return

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.particles = []
    this.mouse = { x: 0, y: 0 }
    
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
    const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000)
    this.particles = []
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle())
    }
  }

  createParticle() {
    const isDark = document.documentElement.classList.contains('dark')
    const colors = isDark 
      ? ['#ffffff', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
      : ['#1f2937', '#7c3aed', '#be185d', '#1d4ed8', '#047857']
    
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: isDark ? Math.random() * 0.8 + 0.2 : Math.random() * 0.9 + 0.4,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulsePhase: Math.random() * Math.PI * 2
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
    this.particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx
      particle.y += particle.vy
      
      // Update pulse animation
      particle.pulsePhase += particle.pulseSpeed
      const pulseFactor = Math.sin(particle.pulsePhase) * 0.3 + 0.7
      particle.currentOpacity = particle.opacity * pulseFactor
      
      // Wrap around screen edges
      if (particle.x < 0) particle.x = this.canvas.width
      if (particle.x > this.canvas.width) particle.x = 0
      if (particle.y < 0) particle.y = this.canvas.height
      if (particle.y > this.canvas.height) particle.y = 0
      
      // Remove excess particles (keep performance good)
      if (this.particles.length > 200 && Math.random() < 0.001) {
        this.particles.splice(index, 1)
      }
    })
  }

  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.save()
      this.ctx.globalAlpha = particle.currentOpacity
      this.ctx.fillStyle = particle.color
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      this.ctx.fill()
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
    this.drawConnections()
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
}