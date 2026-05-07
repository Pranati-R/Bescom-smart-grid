import React, { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    const particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 1.5 + 0.3
        this.speedX = (Math.random() - 0.5) * 0.4
        this.speedY = (Math.random() - 0.5) * 0.4
        this.opacity = Math.random() * 0.5 + 0.1
        this.color = Math.random() > 0.7 ? '#00d4ff' : Math.random() > 0.5 ? '#00ff88' : '#ffffff'
      }
      update() {
        this.x += this.speedX; this.y += this.speedY
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset()
      }
      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color
        ctx.shadowBlur = 6
        ctx.shadowColor = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    for (let i = 0; i < 120; i++) particles.push(new Particle())

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y)
          if (dist < 100) {
            ctx.save()
            ctx.globalAlpha = (1 - dist / 100) * 0.12
            ctx.strokeStyle = '#00d4ff'
            ctx.lineWidth = 0.5
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
            ctx.restore()
          }
        })
      })

      particles.forEach(p => { p.update(); p.draw() })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.6 }}
    />
  )
}
