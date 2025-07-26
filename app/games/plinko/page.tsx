import React, { useRef, useState, useEffect } from "react"

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  finished: boolean
  resultSlot?: number
}

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 500
const PEG_RADIUS = 4
const BALL_RADIUS = 6
const ROWS = 12
const MULTIPLIERS = [33, 8, 4, 2, 1, 0.5, 0.2, 0.1, 0.2, 0.5, 1, 2, 4, 8, 33]

const getPegs = () => {
  const pegs: { x: number; y: number }[] = []
  const rowSpacing = (CANVAS_HEIGHT - 100) / ROWS

  for (let row = 0; row < ROWS; row++) {
    const pegsInRow = row + 3
    const spacing = CANVAS_WIDTH / (pegsInRow + 1)
    const y = 60 + row * rowSpacing
    for (let i = 0; i < pegsInRow; i++) {
      const x = spacing * (i + 1)
      pegs.push({ x, y })
    }
  }
  return pegs
}

const PlinkoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ball, setBall] = useState<Ball | null>(null)
  const [lastResult, setLastResult] = useState<number | null>(null)
  const pegs = getPegs()

  const dropBall = () => {
    if (ball) return // Evita múltiples bolas activas
    setBall({
      x: CANVAS_WIDTH / 2,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      finished: false,
    })
    setLastResult(null)
  }

  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Dibujar pines
    ctx.fillStyle = "#aaa"
    pegs.forEach((peg) => {
      ctx.beginPath()
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    })

    // Dibujar slots
    const slotWidth = CANVAS_WIDTH / MULTIPLIERS.length
    MULTIPLIERS.forEach((multi, i) => {
      ctx.fillStyle =
        multi >= 10 ? "#8b5cf6" : multi >= 5 ? "#facc15" : multi >= 1 ? "#10b981" : "#ef4444"
      ctx.fillRect(i * slotWidth, CANVAS_HEIGHT - 40, slotWidth - 2, 40)
      ctx.fillStyle = "#fff"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`${multi}x`, i * slotWidth + slotWidth / 2, CANVAS_HEIGHT - 15)
    })

    // Simulación física
    if (ball && !ball.finished) {
      const newBall = { ...ball }

      newBall.vy += 0.4
      newBall.x += newBall.vx
      newBall.y += newBall.vy

      // Rebotes con pegs
      pegs.forEach((peg) => {
        const dx = newBall.x - peg.x
        const dy = newBall.y - peg.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < BALL_RADIUS + PEG_RADIUS) {
          const angle = Math.atan2(dy, dx)
          newBall.vx = Math.cos(angle) * 2 + (Math.random() - 0.5)
          newBall.vy = Math.abs(Math.sin(angle)) * 2
          newBall.x = peg.x + Math.cos(angle) * (BALL_RADIUS + PEG_RADIUS)
          newBall.y = peg.y + Math.sin(angle) * (BALL_RADIUS + PEG_RADIUS)
        }
      })

      // Bordes
      if (newBall.x < BALL_RADIUS) {
        newBall.x = BALL_RADIUS
        newBall.vx *= -1
      }
      if (newBall.x > CANVAS_WIDTH - BALL_RADIUS) {
        newBall.x = CANVAS_WIDTH - BALL_RADIUS
        newBall.vx *= -1
      }

      // Llega al fondo
      if (newBall.y > CANVAS_HEIGHT - 50) {
        newBall.finished = true
        const index = Math.floor(newBall.x / slotWidth)
        const clamped = Math.max(0, Math.min(MULTIPLIERS.length - 1, index))
        newBall.resultSlot = clamped
        setLastResult(clamped)
        setTimeout(() => setBall(null), 1500)
      }

      setBall(newBall)
    }

    // Dibujar bola
    if (ball) {
      ctx.fillStyle = "#fbbf24"
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      if (ball.finished && ball.resultSlot !== undefined) {
        ctx.fillStyle = "#fff"
        ctx.font = "18px Arial"
        ctx.textAlign = "center"
        ctx.fillText(`${MULTIPLIERS[ball.resultSlot]}x`, ball.x, ball.y - 15)
      }
    }

    requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT
    }
    requestAnimationFrame(animate)
  }, [ball])

  return (
    <div className="flex flex-col items-center bg-black text-white min-h-screen pt-8 space-y-6">
      <h1 className="text-4xl font-bold text-yellow-400">🎯 PLINKO</h1>
      <button
        onClick={dropBall}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded text-white font-bold"
      >
        DROP BALL
      </button>
      <canvas ref={canvasRef} className="rounded border border-gray-700" />
      {lastResult !== null && (
        <div className="text-xl text-white mt-4">
          You won:{" "}
          <span
            className={`font-bold ${
              MULTIPLIERS[lastResult] >= 1 ? "text-green-400" : "text-red-400"
            }`}
          >
            {MULTIPLIERS[lastResult]}x
          </span>
        </div>
      )}
    </div>
  )
}

export default PlinkoGame
