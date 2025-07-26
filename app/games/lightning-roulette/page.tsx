"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Zap, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"

// European Roulette Numbers
const ROULETTE_NUMBERS = [
  { number: 0, color: "green", position: 0 },
  { number: 32, color: "red", position: 1 },
  { number: 15, color: "black", position: 2 },
  { number: 19, color: "red", position: 3 },
  { number: 4, color: "black", position: 4 },
  { number: 21, color: "red", position: 5 },
  { number: 2, color: "black", position: 6 },
  { number: 25, color: "red", position: 7 },
  { number: 17, color: "black", position: 8 },
  { number: 34, color: "red", position: 9 },
  { number: 6, color: "black", position: 10 },
  { number: 27, color: "red", position: 11 },
  { number: 13, color: "black", position: 12 },
  { number: 36, color: "red", position: 13 },
  { number: 11, color: "black", position: 14 },
  { number: 30, color: "red", position: 15 },
  { number: 8, color: "black", position: 16 },
  { number: 23, color: "red", position: 17 },
  { number: 10, color: "black", position: 18 },
  { number: 5, color: "red", position: 19 },
  { number: 24, color: "black", position: 20 },
  { number: 16, color: "red", position: 21 },
  { number: 33, color: "black", position: 22 },
  { number: 1, color: "red", position: 23 },
  { number: 20, color: "black", position: 24 },
  { number: 14, color: "red", position: 25 },
  { number: 31, color: "black", position: 26 },
  { number: 9, color: "red", position: 27 },
  { number: 22, color: "black", position: 28 },
  { number: 18, color: "red", position: 29 },
  { number: 29, color: "black", position: 30 },
  { number: 7, color: "red", position: 31 },
  { number: 28, color: "black", position: 32 },
  { number: 12, color: "red", position: 33 },
  { number: 35, color: "black", position: 34 },
  { number: 3, color: "red", position: 35 },
  { number: 26, color: "black", position: 36 },
]

interface LightningNumber {
  number: number
  multiplier: number
}

export default function LightningRoulettePage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bets, setBets] = useState<{ [key: string]: number }>({})
  const [spinning, setSpinning] = useState(false)
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [lastNumbers, setLastNumbers] = useState<number[]>([7, 23, 14, 31, 2])
  const [wheelRotation, setWheelRotation] = useState(0)
  const [ballRotation, setBallRotation] = useState(0)
  const [gamePhase, setGamePhase] = useState<"betting" | "lightning" | "spinning" | "result">("betting")
  const [timeLeft, setTimeLeft] = useState(20)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lightningNumbers, setLightningNumbers] = useState<LightningNumber[]>([])
  const [showLightning, setShowLightning] = useState(false)

  const wheelRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gamePhase === "betting" && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (gamePhase === "betting" && timeLeft === 0) {
      startLightningPhase()
    }
    return () => clearTimeout(timer)
  }, [timeLeft, gamePhase])

  const placeBet = (betType: string, amount: number) => {
    if (!user || user.balance < amount || gamePhase !== "betting") return

    setBets((prev) => ({
      ...prev,
      [betType]: (prev[betType] || 0) + amount,
    }))
    updateBalance(-amount)
  }

  const clearBets = () => {
    const totalBets = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
    setBets({})
    updateBalance(totalBets)
  }

  const startLightningPhase = () => {
    setGamePhase("lightning")
    setShowLightning(true)

    // Generate 1-5 lightning numbers with multipliers
    const numLightning = Math.floor(Math.random() * 5) + 1
    const availableNumbers = Array.from({ length: 37 }, (_, i) => i)
    const selectedNumbers: LightningNumber[] = []

    for (let i = 0; i < numLightning; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length)
      const number = availableNumbers.splice(randomIndex, 1)[0]

      // Generate multiplier (50x to 500x)
      const multipliers = [50, 100, 150, 200, 250, 300, 400, 500]
      const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)]

      selectedNumbers.push({ number, multiplier })
    }

    setLightningNumbers(selectedNumbers)

    // Lightning animation duration
    setTimeout(() => {
      setShowLightning(false)
      spin()
    }, 3000)
  }

  const spin = async () => {
    if (spinning) return

    setSpinning(true)
    setGamePhase("spinning")

    // Generate winning number
    const winNumber = Math.floor(Math.random() * 37)
    const winData = ROULETTE_NUMBERS.find((n) => n.number === winNumber)!

    // Calculate rotations
    const spins = 5 + Math.random() * 3
    const finalPosition = winData.position * (360 / 37)
    const newWheelRotation = wheelRotation + spins * 360 + finalPosition
    const newBallRotation = ballRotation - spins * 360 - finalPosition + 180

    setWheelRotation(newWheelRotation)
    setBallRotation(newBallRotation)

    // Animate wheel and ball
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${newWheelRotation}deg)`
      wheelRef.current.style.transition = "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)"
    }

    if (ballRef.current) {
      ballRef.current.style.transform = `rotate(${newBallRotation}deg)`
      ballRef.current.style.transition = "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)"
    }

    setTimeout(() => {
      setWinningNumber(winNumber)
      setLastNumbers((prev) => [winNumber, ...prev.slice(0, 9)])
      setGamePhase("result")

      // Calculate winnings
      let totalWin = 0
      const winningBets: string[] = []

      Object.entries(bets).forEach(([betType, betAmount]) => {
        let won = false
        let payout = 0

        // Check straight up bets for lightning multipliers
        if (betType === `straight-${winNumber}`) {
          const lightningNum = lightningNumbers.find((ln) => ln.number === winNumber)
          if (lightningNum) {
            payout = lightningNum.multiplier // Lightning payout
          } else {
            payout = 35 // Normal straight up payout
          }
          won = true
        }
        // Other bet types (normal payouts)
        else if (betType === winData.color && winNumber !== 0) {
          payout = 1
          won = true
        } else if (betType === "even" && winNumber % 2 === 0 && winNumber !== 0) {
          payout = 1
          won = true
        } else if (betType === "odd" && winNumber % 2 === 1) {
          payout = 1
          won = true
        } else if (betType === "low" && winNumber >= 1 && winNumber <= 18) {
          payout = 1
          won = true
        } else if (betType === "high" && winNumber >= 19 && winNumber <= 36) {
          payout = 1
          won = true
        } else if (betType === "dozen1" && winNumber >= 1 && winNumber <= 12) {
          payout = 2
          won = true
        } else if (betType === "dozen2" && winNumber >= 13 && winNumber <= 24) {
          payout = 2
          won = true
        } else if (betType === "dozen3" && winNumber >= 25 && winNumber <= 36) {
          payout = 2
          won = true
        }

        if (won) {
          const winAmount = betAmount * (payout + 1)
          totalWin += winAmount
          winningBets.push(betType)
        }
      })

      if (totalWin > 0) {
        updateBalance(totalWin)
      }

      // Record game result
      const totalBet = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
      addGameResult({
        game: "Lightning Roulette",
        bet: totalBet,
        win: totalWin,
        details: { winningNumber: winNumber, lightningNumbers, winningBets },
      })

      // Reset for next round
      setTimeout(() => {
        setBets({})
        setWinningNumber(null)
        setLightningNumbers([])
        setGamePhase("betting")
        setTimeLeft(20)
        setSpinning(false)
      }, 8000)
    }, 4000)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Login Required</h1>
        </div>
      </div>
    )
  }

  const totalBets = Object.values(bets).reduce((sum, bet) => sum + bet, 0)

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/games">
            <Button variant="ghost" className="text-white hover:text-yellow-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </Link>
        </div>

        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            <Zap className="inline w-16 h-16 mr-4 text-yellow-400" />
            XXXtreme Lightning Roulette
          </h1>
          <div className="flex justify-center gap-4 flex-wrap mb-4">
            <Badge
              className={`text-lg px-4 py-2 ${
                gamePhase === "betting"
                  ? "bg-green-500"
                  : gamePhase === "lightning"
                    ? "bg-yellow-500 text-black animate-pulse"
                    : gamePhase === "spinning"
                      ? "bg-blue-500 animate-pulse"
                      : "bg-red-500"
              }`}
            >
              {gamePhase === "betting"
                ? `PLACE BETS - ${timeLeft}s`
                : gamePhase === "lightning"
                  ? "⚡ LIGHTNING ROUND ⚡"
                  : gamePhase === "spinning"
                    ? "SPINNING..."
                    : `WINNING NUMBER: ${winningNumber}`}
            </Badge>
          </div>

          {/* Lightning Numbers Display */}
          {lightningNumbers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">⚡ LIGHTNING NUMBERS ⚡</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {lightningNumbers.map((ln, idx) => (
                  <div
                    key={idx}
                    className={`
                    relative p-4 rounded-full border-4 border-yellow-400 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-xl
                    ${showLightning ? "animate-pulse lightning-glow" : ""}
                  `}
                  >
                    <div className="text-2xl">{ln.number}</div>
                    <div className="text-lg">{ln.multiplier}x</div>
                    {showLightning && (
                      <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Numbers */}
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-white font-bold mr-2">RECENT:</span>
            {lastNumbers.map((num, idx) => {
              const numData = ROULETTE_NUMBERS.find((n) => n.number === num)
              const wasLightning = idx === 0 && lightningNumbers.some((ln) => ln.number === num)
              return (
                <Badge
                  key={idx}
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${num === 0 ? "bg-green-500" : numData?.color === "red" ? "bg-red-500" : "bg-gray-800"}
                  ${wasLightning ? "ring-2 ring-yellow-400 lightning-glow" : ""}
                `}
                >
                  {num}
                </Badge>
              )
            })}
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Roulette Wheel */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400 text-white">
                <CardContent className="p-8">
                  <div className="relative w-96 h-96 mx-auto mb-8 overflow-hidden">
                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="absolute inset-0 rounded-full roulette-wheel"
                    >
                      {/* Numbers on wheel */}
                      {ROULETTE_NUMBERS.map((num, idx) => {
                        const isLightning = lightningNumbers.some((ln) => ln.number === num.number)
                        return (
                          <div
                            key={num.number}
                            className={`absolute text-white font-bold text-sm ${isLightning ? "lightning-number" : ""}`}
                            style={{
                              transform: `rotate(${idx * (360 / 37)}deg) translateY(-170px) rotate(-${idx * (360 / 37)}deg)`,
                              transformOrigin: "center 170px",
                            }}
                          >
                            {num.number}
                          </div>
                        )
                      })}
                    </div>

                    {/* Ball */}
                    <div ref={ballRef} className="absolute inset-0">
                      <div
                        className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
                        style={{
                          top: "20px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          boxShadow: "0 0 10px rgba(255,255,255,0.8)",
                        }}
                      />
                    </div>

                    {/* Center */}
                    <div className="absolute inset-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <div className="text-2xl font-bold text-black">
                        {winningNumber !== null ? winningNumber : "⚡"}
                      </div>
                    </div>
                  </div>

                  {/* Game Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-300">Total Bets</div>
                      <div className="text-2xl font-bold text-yellow-400">${totalBets}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">Balance</div>
                      <div className="text-2xl font-bold text-yellow-400">${user.balance.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex gap-4 justify-center mt-6">
                    <Button
                      onClick={clearBets}
                      disabled={spinning || totalBets === 0 || gamePhase !== "betting"}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      CLEAR BETS
                    </Button>
                    <Button onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-600 hover:bg-gray-700">
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Betting Panel */}
            <div className="space-y-6">
              {/* Straight Up Numbers */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">STRAIGHT UP (35:1 or Lightning)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: 37 }, (_, i) => i).map((num) => {
                      const numData = ROULETTE_NUMBERS.find((n) => n.number === num)
                      const isLightning = lightningNumbers.some((ln) => ln.number === num)
                      const lightningMultiplier = lightningNumbers.find((ln) => ln.number === num)?.multiplier

                      return (
                        <Button
                          key={num}
                          onClick={() => placeBet(`straight-${num}`, 10)}
                          className={`
                            relative h-12 text-xs font-bold
                            ${
                              num === 0
                                ? "bg-green-600 hover:bg-green-700"
                                : numData?.color === "red"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-gray-800 hover:bg-gray-700"
                            }
                            ${isLightning ? "lightning-border" : ""}
                          `}
                          disabled={gamePhase !== "betting" || user.balance < 10}
                        >
                          {num}
                          {bets[`straight-${num}`] && (
                            <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs">
                              ${bets[`straight-${num}`]}
                            </Badge>
                          )}
                          {isLightning && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs">
                              {lightningMultiplier}x
                            </div>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Outside Bets */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">OUTSIDE BETS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => placeBet("red", 10)}
                      className="bg-red-600 hover:bg-red-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 10}
                    >
                      RED (1:1)
                      {bets.red && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.red}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => placeBet("black", 10)}
                      className="bg-gray-800 hover:bg-gray-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 10}
                    >
                      BLACK (1:1)
                      {bets.black && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.black}</Badge>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => placeBet("dozen1", 20)}
                      className="bg-blue-600 hover:bg-blue-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 20}
                    >
                      1-12 (2:1)
                      {bets.dozen1 && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.dozen1}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => placeBet("dozen2", 20)}
                      className="bg-blue-600 hover:bg-blue-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 20}
                    >
                      13-24 (2:1)
                      {bets.dozen2 && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.dozen2}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => placeBet("dozen3", 20)}
                      className="bg-blue-600 hover:bg-blue-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 20}
                    >
                      25-36 (2:1)
                      {bets.dozen3 && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.dozen3}</Badge>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Bets */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">QUICK BETS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 25, 50, 100, 250].map((amount) => (
                      <Button
                        key={amount}
                        className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                        disabled={user.balance < amount || gamePhase !== "betting"}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .lightning-glow {
          box-shadow: 0 0 20px #fbbf24, 0 0 40px #fbbf24, 0 0 60px #fbbf24;
          animation: lightning-pulse 0.5s infinite alternate;
        }
        
        .lightning-border {
          border: 2px solid #fbbf24 !important;
          box-shadow: 0 0 10px #fbbf24;
        }
        
        .lightning-number {
          color: #fbbf24 !important;
          text-shadow: 0 0 10px #fbbf24;
        }
        
        @keyframes lightning-pulse {
          from { box-shadow: 0 0 20px #fbbf24, 0 0 40px #fbbf24, 0 0 60px #fbbf24; }
          to { box-shadow: 0 0 30px #fbbf24, 0 0 60px #fbbf24, 0 0 90px #fbbf24; }
        }
      `}</style>
    </div>
  )
}
