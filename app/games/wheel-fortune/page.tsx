"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play } from "lucide-react"
import Link from "next/link"

interface WheelSegment {
  id: number
  multiplier: number
  color: string
  probability: number
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: 1, multiplier: 1, color: "#ef4444", probability: 25 }, // Red
  { id: 2, multiplier: 2, color: "#3b82f6", probability: 20 }, // Blue
  { id: 3, multiplier: 1, color: "#ef4444", probability: 25 }, // Red
  { id: 4, multiplier: 5, color: "#10b981", probability: 10 }, // Green
  { id: 5, multiplier: 1, color: "#ef4444", probability: 25 }, // Red
  { id: 6, multiplier: 2, color: "#3b82f6", probability: 20 }, // Blue
  { id: 7, multiplier: 1, color: "#ef4444", probability: 25 }, // Red
  { id: 8, multiplier: 10, color: "#f59e0b", probability: 5 }, // Yellow
  { id: 9, multiplier: 1, color: "#ef4444", probability: 25 }, // Red
  { id: 10, multiplier: 2, color: "#3b82f6", probability: 20 }, // Blue
  { id: 11, multiplier: 1, color: "#ef4444", probability: 25 }, // Red
  { id: 12, multiplier: 50, color: "#8b5cf6", probability: 1 }, // Purple
]

export default function WheelFortunePage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bets, setBets] = useState<{ [key: number]: number }>({})
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [gameHistory, setGameHistory] = useState<
    {
      bets: { [key: number]: number }
      result: number
      totalBet: number
      totalWin: number
    }[]
  >([])
  const [statistics, setStatistics] = useState({
    totalSpins: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    lastResults: [] as number[],
  })

  const wheelRef = useRef<HTMLDivElement>(null)

  const placeBet = (multiplier: number, amount: number) => {
    if (!user || user.balance < amount || spinning) return

    setBets((prev) => ({
      ...prev,
      [multiplier]: (prev[multiplier] || 0) + amount,
    }))
    updateBalance(-amount)
  }

  const clearBets = () => {
    const totalBets = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
    setBets({})
    updateBalance(totalBets)
  }

  const spin = async () => {
    if (spinning || Object.keys(bets).length === 0) return

    setSpinning(true)
    setResult(null)

    // Generate weighted random result
    const random = Math.random() * 100
    let cumulative = 0
    let winningSegment = WHEEL_SEGMENTS[0]

    for (const segment of WHEEL_SEGMENTS) {
      cumulative += segment.probability
      if (random <= cumulative) {
        winningSegment = segment
        break
      }
    }

    // Calculate rotation
    const segmentAngle = 360 / WHEEL_SEGMENTS.length
    const targetAngle = (winningSegment.id - 1) * segmentAngle
    const spins = 5 + Math.random() * 3 // 5-8 full rotations
    const finalRotation = wheelRotation + spins * 360 + (360 - targetAngle)

    setWheelRotation(finalRotation)

    // Animate wheel
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`
      wheelRef.current.style.transition = "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)"
    }

    // Wait for animation
    setTimeout(() => {
      setResult(winningSegment.multiplier)

      // Calculate winnings
      let totalWin = 0
      const totalBet = Object.values(bets).reduce((sum, bet) => sum + bet, 0)

      if (bets[winningSegment.multiplier]) {
        totalWin = bets[winningSegment.multiplier] * winningSegment.multiplier
        updateBalance(totalWin)
      }

      // Update statistics
      setStatistics((prev) => ({
        ...prev,
        totalSpins: prev.totalSpins + 1,
        totalWagered: prev.totalWagered + totalBet,
        totalWon: prev.totalWon + totalWin,
        biggestWin: Math.max(prev.biggestWin, totalWin),
        lastResults: [winningSegment.multiplier, ...prev.lastResults.slice(0, 9)],
      }))

      // Add to history
      setGameHistory((prev) => [
        {
          bets: { ...bets },
          result: winningSegment.multiplier,
          totalBet,
          totalWin,
        },
        ...prev.slice(0, 9),
      ])

      // Record game result
      addGameResult({
        game: "Wheel of Fortune",
        bet: totalBet,
        win: totalWin,
        multiplier: totalWin > 0 ? totalWin / totalBet : 0,
        details: { result: winningSegment.multiplier, bets },
      })

      // Reset for next spin
      setTimeout(() => {
        setBets({})
        setResult(null)
        setSpinning(false)
      }, 3000)
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
          <h1 className="text-6xl font-bold text-white mb-4">🎯 WHEEL OF FORTUNE</h1>
          <p className="text-xl text-gray-300">Spin the wheel and win big!</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Wheel */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400">
                <CardContent className="p-8">
                  <div className="relative w-96 h-96 mx-auto mb-8">
                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="absolute inset-0 rounded-full border-8 border-yellow-400"
                      style={{
                        background: `conic-gradient(${WHEEL_SEGMENTS.map(
                          (segment, index) =>
                            `${segment.color} ${index * (360 / WHEEL_SEGMENTS.length)}deg ${(index + 1) * (360 / WHEEL_SEGMENTS.length)}deg`,
                        ).join(", ")})`,
                      }}
                    >
                      {/* Segments with numbers */}
                      {WHEEL_SEGMENTS.map((segment, index) => (
                        <div
                          key={segment.id}
                          className="absolute text-white font-bold text-xl"
                          style={{
                            transform: `rotate(${index * (360 / WHEEL_SEGMENTS.length) + 180 / WHEEL_SEGMENTS.length}deg) translateY(-160px) rotate(-${index * (360 / WHEEL_SEGMENTS.length) + 180 / WHEEL_SEGMENTS.length}deg)`,
                            transformOrigin: "center 160px",
                          }}
                        >
                          {segment.multiplier}x
                        </div>
                      ))}
                    </div>

                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"></div>
                    </div>

                    {/* Center */}
                    <div className="absolute inset-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <div className="text-3xl font-bold text-black">{result !== null ? `${result}x` : "🎯"}</div>
                    </div>
                  </div>

                  {/* Result Display */}
                  {result !== null && (
                    <div className="text-center mb-6">
                      <Badge className="bg-yellow-500 text-black text-2xl px-6 py-3">RESULT: {result}x</Badge>
                      {bets[result] && (
                        <div className="text-2xl font-bold text-green-400 mt-2">
                          WIN: ${(bets[result] * result).toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Game Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center mb-6">
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
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={spin}
                      disabled={spinning || totalBets === 0}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-8 py-4"
                    >
                      {spinning ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                          SPINNING...
                        </>
                      ) : (
                        <>
                          <Play className="w-6 h-6 mr-2" />
                          SPIN WHEEL
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={clearBets}
                      disabled={spinning || totalBets === 0}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      CLEAR BETS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Betting Panel */}
            <div className="space-y-6">
              {/* Betting Options */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">PLACE BETS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 5, 10, 50].map((multiplier) => {
                    const segment = WHEEL_SEGMENTS.find((s) => s.multiplier === multiplier)
                    const betAmount = bets[multiplier] || 0

                    return (
                      <div key={multiplier} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{multiplier}x Multiplier</span>
                          <Badge className="bg-gray-700">{segment?.probability}% chance</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[10, 25, 50, 100].map((amount) => (
                            <Button
                              key={amount}
                              onClick={() => placeBet(multiplier, amount)}
                              disabled={user.balance < amount || spinning}
                              className="bg-blue-600 hover:bg-blue-700 text-xs relative"
                              style={{ backgroundColor: segment?.color }}
                            >
                              ${amount}
                            </Button>
                          ))}
                        </div>
                        {betAmount > 0 && (
                          <div className="text-center">
                            <Badge className="bg-yellow-500 text-black">
                              Bet: ${betAmount} | Potential Win: ${betAmount * multiplier}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">STATISTICS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className="font-bold text-yellow-400">${user.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Spins:</span>
                    <span className="text-blue-400">{statistics.totalSpins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Wagered:</span>
                    <span className="text-red-400">${statistics.totalWagered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Won:</span>
                    <span className="text-green-400">${statistics.totalWon.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biggest Win:</span>
                    <span className="text-purple-400">${statistics.biggestWin.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Results */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">RECENT RESULTS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {statistics.lastResults.map((result, index) => {
                      const segment = WHEEL_SEGMENTS.find((s) => s.multiplier === result)
                      return (
                        <Badge key={index} className="text-white font-bold" style={{ backgroundColor: segment?.color }}>
                          {result}x
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Games */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">GAME HISTORY</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {gameHistory.map((game, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <Badge
                            className="text-white"
                            style={{
                              backgroundColor: WHEEL_SEGMENTS.find((s) => s.multiplier === game.result)?.color,
                            }}
                          >
                            {game.result}x
                          </Badge>
                          <span className="text-sm">${game.totalBet}</span>
                        </div>
                        <span
                          className={`font-bold ${game.totalWin > game.totalBet ? "text-green-400" : "text-red-400"}`}
                        >
                          {game.totalWin > game.totalBet ? "+" : ""}${(game.totalWin - game.totalBet).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {gameHistory.length === 0 && (
                      <div className="text-center text-gray-400 py-4">No games played yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
