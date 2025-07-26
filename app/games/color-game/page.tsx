"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, Pause } from "lucide-react"
import Link from "next/link"

interface ColorResult {
  color: "red" | "green" | "blue"
  timestamp: number
}

const COLORS = {
  red: { name: "RED", bg: "bg-red-500", payout: 2.0, probability: 33.33 },
  green: { name: "GREEN", bg: "bg-green-500", payout: 2.0, probability: 33.33 },
  blue: { name: "BLUE", bg: "bg-blue-500", payout: 2.0, probability: 33.33 },
}

export default function ColorGamePage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bet, setBet] = useState(100)
  const [selectedColor, setSelectedColor] = useState<"red" | "green" | "blue" | null>(null)
  const [gameActive, setGameActive] = useState(false)
  const [result, setResult] = useState<"red" | "green" | "blue" | null>(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoCount, setAutoCount] = useState(10)
  const [currentAuto, setCurrentAuto] = useState(0)
  const [gameHistory, setGameHistory] = useState<
    {
      bet: number
      selectedColor: string
      result: string
      won: boolean
      payout: number
    }[]
  >([])
  const [statistics, setStatistics] = useState({
    totalGames: 0,
    totalWagered: 0,
    totalWon: 0,
    redWins: 0,
    greenWins: 0,
    blueWins: 0,
    currentStreak: 0,
    bestStreak: 0,
  })
  const [recentResults, setRecentResults] = useState<ColorResult[]>([])

  useEffect(() => {
    startNewRound()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (gameActive && timeLeft === 0) {
      playRound()
    }
    return () => clearTimeout(timer)
  }, [timeLeft, gameActive])

  useEffect(() => {
    if (autoPlay && !gameActive && currentAuto < autoCount) {
      const timer = setTimeout(() => {
        if (selectedColor && user && user.balance >= bet) {
          setCurrentAuto((prev) => prev + 1)
        } else {
          setAutoPlay(false)
          setCurrentAuto(0)
        }
      }, 2000)
      return () => clearTimeout(timer)
    } else if (currentAuto >= autoCount) {
      setAutoPlay(false)
      setCurrentAuto(0)
    }
  }, [autoPlay, gameActive, currentAuto, autoCount])

  const startNewRound = () => {
    setGameActive(true)
    setResult(null)
    setTimeLeft(10)
    if (!autoPlay) {
      setSelectedColor(null)
    }
  }

  const placeBet = (color: "red" | "green" | "blue") => {
    if (!user || user.balance < bet || !gameActive) return

    setSelectedColor(color)
    updateBalance(-bet)

    setStatistics((prev) => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      totalWagered: prev.totalWagered + bet,
    }))
  }

  const playRound = () => {
    setGameActive(false)

    // Generate random result
    const colors: ("red" | "green" | "blue")[] = ["red", "green", "blue"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    setResult(randomColor)

    // Add to recent results
    setRecentResults((prev) => [{ color: randomColor, timestamp: Date.now() }, ...prev.slice(0, 19)])

    // Calculate payout
    let payout = 0
    let won = false
    if (selectedColor === randomColor) {
      payout = bet * COLORS[randomColor].payout
      won = true
      updateBalance(payout)
    }

    // Update statistics
    setStatistics((prev) => {
      const newStreak = won
        ? prev.currentStreak >= 0
          ? prev.currentStreak + 1
          : 1
        : prev.currentStreak <= 0
          ? prev.currentStreak - 1
          : -1

      return {
        ...prev,
        totalWon: prev.totalWon + payout,
        redWins: prev.redWins + (randomColor === "red" ? 1 : 0),
        greenWins: prev.greenWins + (randomColor === "green" ? 1 : 0),
        blueWins: prev.blueWins + (randomColor === "blue" ? 1 : 0),
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, Math.abs(newStreak)),
      }
    })

    // Add to history
    if (selectedColor) {
      setGameHistory((prev) => [
        {
          bet,
          selectedColor: COLORS[selectedColor].name,
          result: COLORS[randomColor].name,
          won,
          payout,
        },
        ...prev.slice(0, 9),
      ])

      // Record game result
      addGameResult({
        game: "Color Game",
        bet,
        win: payout,
        multiplier: won ? COLORS[randomColor].payout : 0,
        details: { selectedColor, result: randomColor },
      })
    }

    // Start next round
    setTimeout(() => {
      startNewRound()
    }, 3000)
  }

  const startAutoPlay = () => {
    if (!selectedColor) return
    setAutoPlay(true)
    setCurrentAuto(0)
  }

  const stopAutoPlay = () => {
    setAutoPlay(false)
    setCurrentAuto(0)
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
          <h1 className="text-6xl font-bold text-white mb-4">🎱 COLOR GAME</h1>
          <p className="text-xl text-gray-300">Pick a color and win 2x your bet!</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Game */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400">
                <CardContent className="p-8">
                  {/* Game Status */}
                  <div className="text-center mb-8">
                    {gameActive ? (
                      <div className="space-y-2">
                        <Badge className="bg-green-500 text-white text-2xl px-6 py-3 animate-pulse">
                          BETTING TIME: {timeLeft}s
                        </Badge>
                        {selectedColor && (
                          <div className="text-lg text-yellow-400">
                            You bet ${bet} on {COLORS[selectedColor].name}
                          </div>
                        )}
                      </div>
                    ) : result ? (
                      <div className="space-y-4">
                        <Badge className={`${COLORS[result].bg} text-white text-3xl px-8 py-4`}>
                          RESULT: {COLORS[result].name}
                        </Badge>
                        {selectedColor === result ? (
                          <div className="text-2xl font-bold text-green-400">
                            🎉 YOU WIN ${(bet * COLORS[result].payout).toFixed(2)}! 🎉
                          </div>
                        ) : selectedColor ? (
                          <div className="text-2xl font-bold text-red-400">Better luck next time!</div>
                        ) : (
                          <div className="text-xl text-gray-400">No bet placed</div>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-blue-500 text-white text-xl px-6 py-3">WAITING FOR NEXT ROUND...</Badge>
                    )}
                  </div>

                  {/* Color Display */}
                  <div className="relative w-80 h-80 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-8 border-yellow-400 overflow-hidden">
                      <div className="grid grid-cols-1 h-full">
                        <div className="grid grid-cols-3 h-full">
                          <div className="bg-red-500 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">RED</span>
                          </div>
                          <div className="bg-green-500 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">GREEN</span>
                          </div>
                          <div className="bg-blue-500 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">BLUE</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Result Overlay */}
                    {result && (
                      <div
                        className={`absolute inset-0 rounded-full ${COLORS[result].bg} opacity-90 flex items-center justify-center animate-pulse`}
                      >
                        <div className="text-6xl font-bold text-white">{COLORS[result].name}</div>
                      </div>
                    )}
                  </div>

                  {/* Betting Controls */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Bet Amount</label>
                      <Input
                        type="number"
                        value={bet}
                        onChange={(e) => setBet(Math.max(1, Number.parseInt(e.target.value) || 1))}
                        min="1"
                        max={user.balance}
                        className="bg-gray-800 border-gray-600 text-white text-lg"
                        disabled={!gameActive || autoPlay}
                      />
                    </div>

                    {/* Color Buttons */}
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(COLORS).map(([colorKey, colorData]) => (
                        <Button
                          key={colorKey}
                          onClick={() => placeBet(colorKey as "red" | "green" | "blue")}
                          disabled={!gameActive || user.balance < bet || autoPlay}
                          className={`
                            ${colorData.bg} hover:opacity-80 text-white font-bold text-xl py-6
                            ${selectedColor === colorKey ? "ring-4 ring-yellow-400" : ""}
                          `}
                        >
                          {colorData.name}
                          <br />
                          {colorData.payout}x
                        </Button>
                      ))}
                    </div>

                    {/* Auto Play Controls */}
                    <div className="space-y-4">
                      {!autoPlay ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium mb-2">Auto Play Rounds</label>
                            <Input
                              type="number"
                              value={autoCount}
                              onChange={(e) =>
                                setAutoCount(Math.max(1, Math.min(100, Number.parseInt(e.target.value) || 1)))
                              }
                              min="1"
                              max="100"
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </div>
                          <Button
                            onClick={startAutoPlay}
                            disabled={!selectedColor || user.balance < bet}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            START AUTO PLAY
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={stopAutoPlay} className="w-full bg-red-600 hover:bg-red-700">
                          <Pause className="w-5 h-5 mr-2" />
                          STOP AUTO ({currentAuto}/{autoCount})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
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
                    <span>Games Played:</span>
                    <span className="text-blue-400">{statistics.totalGames}</span>
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
                    <span>Current Streak:</span>
                    <span
                      className={`font-bold ${
                        statistics.currentStreak > 0
                          ? "text-green-400"
                          : statistics.currentStreak < 0
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {statistics.currentStreak}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Streak:</span>
                    <span className="text-purple-400">{statistics.bestStreak}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Color Statistics */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">COLOR FREQUENCY</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      Red:
                    </span>
                    <span className="text-red-400">{statistics.redWins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      Green:
                    </span>
                    <span className="text-green-400">{statistics.greenWins}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      Blue:
                    </span>
                    <span className="text-blue-400">{statistics.blueWins}</span>
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
                    {recentResults.slice(0, 20).map((result, index) => (
                      <Badge key={index} className={`${COLORS[result.color].bg} text-white font-bold`}>
                        {result.color.charAt(0).toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Game History */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">GAME HISTORY</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {gameHistory.map((game, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={game.won ? "bg-green-500" : "bg-red-500"}>
                            {game.selectedColor} → {game.result}
                          </Badge>
                          <span className="text-sm">${game.bet}</span>
                        </div>
                        <span className={`font-bold ${game.won ? "text-green-400" : "text-red-400"}`}>
                          {game.won ? "+" : "-"}${game.won ? (game.payout - game.bet).toFixed(2) : game.bet.toFixed(2)}
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
