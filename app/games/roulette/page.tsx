"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"

// European Roulette Numbers (Evolution Gaming style)
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

// Betting areas with proper payouts
const BET_TYPES = {
  straight: { payout: 35, name: "Straight Up" },
  split: { payout: 17, name: "Split" },
  street: { payout: 11, name: "Street" },
  corner: { payout: 8, name: "Corner" },
  line: { payout: 5, name: "Line" },
  dozen: { payout: 2, name: "Dozen" },
  column: { payout: 2, name: "Column" },
  red: { payout: 1, name: "Red" },
  black: { payout: 1, name: "Black" },
  even: { payout: 1, name: "Even" },
  odd: { payout: 1, name: "Odd" },
  low: { payout: 1, name: "1-18" },
  high: { payout: 1, name: "19-36" },
}

export default function RoulettePage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bets, setBets] = useState<{ [key: string]: number }>({})
  const [spinning, setSpinning] = useState(false)
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [lastNumbers, setLastNumbers] = useState<number[]>([7, 23, 14, 31, 2])
  const [wheelRotation, setWheelRotation] = useState(0)
  const [ballRotation, setBallRotation] = useState(0)
  const [gamePhase, setGamePhase] = useState<"betting" | "spinning" | "result">("betting")
  const [timeLeft, setTimeLeft] = useState(30)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [statistics, setStatistics] = useState({
    red: 0,
    black: 0,
    even: 0,
    odd: 0,
    low: 0,
    high: 0,
  })

  const wheelRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Betting timer
    let timer: NodeJS.Timeout
    if (gamePhase === "betting" && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (gamePhase === "betting" && timeLeft === 0) {
      if (Object.keys(bets).length > 0) {
        spin()
      } else {
        setTimeLeft(30) // Reset if no bets
      }
    }
    return () => clearTimeout(timer)
  }, [timeLeft, gamePhase, bets])

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

  const spin = async () => {
    if (spinning || Object.keys(bets).length === 0) return

    setSpinning(true)
    setGamePhase("spinning")
    setTimeLeft(0)

    // Generate winning number
    const winNumber = Math.floor(Math.random() * 37)
    const winData = ROULETTE_NUMBERS.find((n) => n.number === winNumber)!

    // Calculate rotations for realistic animation
    const spins = 5 + Math.random() * 3 // 5-8 full rotations
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

    // Wait for animation to complete
    setTimeout(() => {
      setWinningNumber(winNumber)
      setLastNumbers((prev) => [winNumber, ...prev.slice(0, 9)])
      setGamePhase("result")

      // Calculate winnings
      let totalWin = 0
      const winningBets: string[] = []

      Object.entries(bets).forEach(([betType, betAmount]) => {
        let won = false

        // Check each bet type
        if (betType === `straight-${winNumber}`) won = true
        else if (betType === winData.color && winNumber !== 0) won = true
        else if (betType === "even" && winNumber % 2 === 0 && winNumber !== 0) won = true
        else if (betType === "odd" && winNumber % 2 === 1) won = true
        else if (betType === "low" && winNumber >= 1 && winNumber <= 18) won = true
        else if (betType === "high" && winNumber >= 19 && winNumber <= 36) won = true
        else if (betType === "dozen1" && winNumber >= 1 && winNumber <= 12) won = true
        else if (betType === "dozen2" && winNumber >= 13 && winNumber <= 24) won = true
        else if (betType === "dozen3" && winNumber >= 25 && winNumber <= 36) won = true
        else if (betType === "column1" && winNumber > 0 && winNumber % 3 === 1) won = true
        else if (betType === "column2" && winNumber > 0 && winNumber % 3 === 2) won = true
        else if (betType === "column3" && winNumber > 0 && winNumber % 3 === 0) won = true

        if (won) {
          const payout = getBetPayout(betType)
          const winAmount = betAmount * (payout + 1)
          totalWin += winAmount
          winningBets.push(betType)
        }
      })

      if (totalWin > 0) {
        updateBalance(totalWin)
      }

      // Update statistics
      if (winNumber !== 0) {
        setStatistics((prev) => ({
          ...prev,
          red: prev.red + (winData.color === "red" ? 1 : 0),
          black: prev.black + (winData.color === "black" ? 1 : 0),
          even: prev.even + (winNumber % 2 === 0 ? 1 : 0),
          odd: prev.odd + (winNumber % 2 === 1 ? 1 : 0),
          low: prev.low + (winNumber <= 18 ? 1 : 0),
          high: prev.high + (winNumber >= 19 ? 1 : 0),
        }))
      }

      // Record game result
      const totalBet = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
      addGameResult({
        game: "European Roulette",
        bet: totalBet,
        win: totalWin,
        details: { winningNumber: winNumber, winningBets, bets },
      })

      // Reset for next round
      setTimeout(() => {
        setBets({})
        setWinningNumber(null)
        setGamePhase("betting")
        setTimeLeft(30)
        setSpinning(false)
      }, 5000)
    }, 4000)
  }

  const getBetPayout = (betType: string): number => {
    if (betType.startsWith("straight-")) return BET_TYPES.straight.payout
    if (["red", "black", "even", "odd", "low", "high"].includes(betType)) return BET_TYPES.red.payout
    if (betType.startsWith("dozen") || betType.startsWith("column")) return BET_TYPES.dozen.payout
    return 1
  }

  if (!user) {
    return (
      <div className="min-h-screen premium-gradient">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Login Required</h1>
        </div>
      </div>
    )
  }

  const totalBets = Object.values(bets).reduce((sum, bet) => sum + bet, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
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
          <h1 className="text-5xl font-orbitron font-bold text-white mb-4">🎯 EVOLUTION ROULETTE</h1>
          <div className="flex justify-center gap-4 flex-wrap mb-4">
            <Badge
              className={`text-lg px-4 py-2 ${
                gamePhase === "betting"
                  ? "bg-green-500"
                  : gamePhase === "spinning"
                    ? "bg-yellow-500 text-black animate-pulse"
                    : "bg-red-500"
              }`}
            >
              {gamePhase === "betting"
                ? `PLACE BETS - ${timeLeft}s`
                : gamePhase === "spinning"
                  ? "SPINNING..."
                  : `WINNING NUMBER: ${winningNumber}`}
            </Badge>
          </div>

          {/* Last Numbers */}
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-white font-bold mr-2">LAST NUMBERS:</span>
            {lastNumbers.map((num, idx) => {
              const numData = ROULETTE_NUMBERS.find((n) => n.number === num)
              return (
                <Badge
                  key={idx}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    num === 0 ? "bg-green-500" : numData?.color === "red" ? "bg-red-500" : "bg-black"
                  } text-white`}
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
              <Card className="casino-card border-4 border-yellow-400 text-white">
                <CardContent className="p-8">
                  <div className="relative w-96 h-96 mx-auto mb-8 overflow-hidden">
                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="absolute inset-0 rounded-full roulette-wheel"
                    >
                      {/* Numbers on wheel */}
                      {ROULETTE_NUMBERS.map((num, idx) => (
                        <div
                          key={num.number}
                          className="absolute text-white font-bold text-sm"
                          style={{
                            transform: `rotate(${idx * (360 / 37)}deg) translateY(-170px) rotate(-${idx * (360 / 37)}deg)`,
                            transformOrigin: "center 170px",
                          }}
                        >
                          {num.number}
                        </div>
                      ))}
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
                        {winningNumber !== null ? winningNumber : "🎯"}
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
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                    >
                      CLEAR BETS
                    </Button>
                    <Button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                    >
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Betting Panel */}
            <div className="space-y-6">
              {/* Quick Bets */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">QUICK BETS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[1, 5, 10, 25, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                        disabled={user.balance < amount || gamePhase !== "betting"}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Outside Bets */}
              <Card className="casino-card text-white">
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
                      className="bg-gray-800 hover:bg-gray-900 relative"
                      disabled={gamePhase !== "betting" || user.balance < 10}
                    >
                      BLACK (1:1)
                      {bets.black && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.black}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => placeBet("even", 10)}
                      className="bg-blue-600 hover:bg-blue-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 10}
                    >
                      EVEN (1:1)
                      {bets.even && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.even}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => placeBet("odd", 10)}
                      className="bg-purple-600 hover:bg-purple-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 10}
                    >
                      ODD (1:1)
                      {bets.odd && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.odd}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => placeBet("low", 10)}
                      className="bg-green-600 hover:bg-green-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 10}
                    >
                      1-18 (1:1)
                      {bets.low && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.low}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => placeBet("high", 10)}
                      className="bg-orange-600 hover:bg-orange-700 relative"
                      disabled={gamePhase !== "betting" || user.balance < 10}
                    >
                      19-36 (1:1)
                      {bets.high && (
                        <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.high}</Badge>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dozens & Columns */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">DOZENS & COLUMNS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => placeBet("dozen1", 20)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 relative"
                    disabled={gamePhase !== "betting" || user.balance < 20}
                  >
                    1st DOZEN (1-12) 2:1
                    {bets.dozen1 && (
                      <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.dozen1}</Badge>
                    )}
                  </Button>
                  <Button
                    onClick={() => placeBet("dozen2", 20)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 relative"
                    disabled={gamePhase !== "betting" || user.balance < 20}
                  >
                    2nd DOZEN (13-24) 2:1
                    {bets.dozen2 && (
                      <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.dozen2}</Badge>
                    )}
                  </Button>
                  <Button
                    onClick={() => placeBet("dozen3", 20)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 relative"
                    disabled={gamePhase !== "betting" || user.balance < 20}
                  >
                    3rd DOZEN (25-36) 2:1
                    {bets.dozen3 && (
                      <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">${bets.dozen3}</Badge>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">STATISTICS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Red:</span>
                      <span className="text-red-400">{statistics.red}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Black:</span>
                      <span className="text-gray-400">{statistics.black}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Even:</span>
                      <span className="text-blue-400">{statistics.even}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Odd:</span>
                      <span className="text-purple-400">{statistics.odd}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low (1-18):</span>
                      <span className="text-green-400">{statistics.low}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High (19-36):</span>
                      <span className="text-orange-400">{statistics.high}</span>
                    </div>
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
