"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, Pause, Target } from "lucide-react"
import Link from "next/link"

export default function LimboPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bet, setBet] = useState(100)
  const [targetMultiplier, setTargetMultiplier] = useState(2.0)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoCount, setAutoCount] = useState(10)
  const [currentAuto, setCurrentAuto] = useState(0)
  const [onWin, setOnWin] = useState<"reset" | "increase" | "decrease">("reset")
  const [onLoss, setOnLoss] = useState<"reset" | "increase" | "decrease">("reset")
  const [winMultiplier, setWinMultiplier] = useState(2)
  const [lossMultiplier, setLossMultiplier] = useState(2)
  const [gameHistory, setGameHistory] = useState<
    {
      bet: number
      target: number
      result: number
      won: boolean
      payout: number
    }[]
  >([])
  const [statistics, setStatistics] = useState({
    totalGames: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    highestResult: 0,
    currentStreak: 0,
    bestStreak: 0,
  })

  const houseEdge = 1 // 1% house edge
  const winChance = (100 - houseEdge) / targetMultiplier
  const profit = bet * (targetMultiplier - 1)

  useEffect(() => {
    if (autoPlay && currentAuto < autoCount && !rolling && user && user.balance >= bet) {
      const timer = setTimeout(() => {
        playRound()
        setCurrentAuto((prev) => prev + 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (currentAuto >= autoCount) {
      setAutoPlay(false)
      setCurrentAuto(0)
    }
  }, [autoPlay, currentAuto, autoCount, rolling])

  const generateResult = (): number => {
    // Generate result using exponential distribution
    const random = Math.random()
    const result = (100 - houseEdge) / (random * 100)
    return Math.max(1, Math.min(1000000, result))
  }

  const playRound = async () => {
    if (!user || user.balance < bet || rolling) return

    setRolling(true)
    setResult(null)
    updateBalance(-bet)

    // Simulate rolling animation
    const rollAnimation = setInterval(() => {
      setResult(Math.random() * targetMultiplier * 2)
    }, 50)

    setTimeout(() => {
      clearInterval(rollAnimation)

      // Generate final result
      const finalResult = generateResult()
      setResult(finalResult)

      // Check if won
      const won = finalResult >= targetMultiplier
      const payout = won ? bet * targetMultiplier : 0

      if (won) {
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
          totalGames: prev.totalGames + 1,
          totalWagered: prev.totalWagered + bet,
          totalWon: prev.totalWon + payout,
          biggestWin: Math.max(prev.biggestWin, payout),
          highestResult: Math.max(prev.highestResult, finalResult),
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, Math.abs(newStreak)),
        }
      })

      // Add to history
      setGameHistory((prev) => [
        {
          bet,
          target: targetMultiplier,
          result: finalResult,
          won,
          payout,
        },
        ...prev.slice(0, 9),
      ])

      // Record game result
      addGameResult({
        game: "Limbo",
        bet,
        win: payout,
        multiplier: won ? targetMultiplier : 0,
        details: { target: targetMultiplier, result: finalResult },
      })

      // Auto play bet adjustment
      if (autoPlay) {
        if (won && onWin !== "reset") {
          setBet((prev) => (onWin === "increase" ? prev * winMultiplier : prev / winMultiplier))
        } else if (!won && onLoss !== "reset") {
          setBet((prev) => (onLoss === "increase" ? prev * lossMultiplier : prev / lossMultiplier))
        }
      }

      setRolling(false)
    }, 1500)
  }

  const startAutoPlay = () => {
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
          <h1 className="text-6xl font-bold text-white mb-4">🧮 LIMBO</h1>
          <p className="text-xl text-gray-300">Set your target multiplier and cross your fingers!</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Game */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400">
                <CardContent className="p-8">
                  {/* Result Display */}
                  <div className="text-center mb-8">
                    <div className="relative w-64 h-64 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-full flex items-center justify-center border-8 border-yellow-400">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-white mb-2">
                          {result !== null ? result.toFixed(2) : "0.00"}
                        </div>
                        <div className="text-lg text-gray-300">x</div>
                      </div>
                      {rolling && (
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-pulse"></div>
                      )}
                    </div>

                    {/* Result Status */}
                    {result !== null && !rolling && (
                      <div className="mb-4">
                        <Badge
                          className={`text-2xl px-6 py-3 ${result >= targetMultiplier ? "bg-green-500" : "bg-red-500"}`}
                        >
                          {result >= targetMultiplier ? "WIN!" : "LOSE"}
                        </Badge>
                        {result >= targetMultiplier && (
                          <div className="text-2xl font-bold text-green-400 mt-2">
                            +${(bet * targetMultiplier - bet).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}

                    {rolling && (
                      <Badge className="bg-blue-500 text-white text-xl px-6 py-3 animate-pulse">ROLLING...</Badge>
                    )}
                  </div>

                  {/* Game Controls */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Bet Amount</label>
                        <Input
                          type="number"
                          value={bet}
                          onChange={(e) => setBet(Math.max(1, Number.parseFloat(e.target.value) || 1))}
                          min="1"
                          max={user.balance}
                          step="0.01"
                          className="bg-gray-800 border-gray-600 text-white text-lg"
                          disabled={rolling || autoPlay}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Target Multiplier</label>
                        <Input
                          type="number"
                          value={targetMultiplier}
                          onChange={(e) =>
                            setTargetMultiplier(
                              Math.max(1.01, Math.min(1000000, Number.parseFloat(e.target.value) || 1.01)),
                            )
                          }
                          min="1.01"
                          max="1000000"
                          step="0.01"
                          className="bg-gray-800 border-gray-600 text-white text-lg"
                          disabled={rolling || autoPlay}
                        />
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Win Chance</div>
                        <div className="text-xl font-bold text-blue-400">{winChance.toFixed(2)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Payout</div>
                        <div className="text-xl font-bold text-yellow-400">{targetMultiplier.toFixed(2)}x</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Profit on Win</div>
                        <div className="text-xl font-bold text-green-400">${profit.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Quick Multipliers */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Quick Multipliers:</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1.5, 2, 5, 10, 25, 50, 100, 1000].map((mult) => (
                          <Button
                            key={mult}
                            onClick={() => setTargetMultiplier(mult)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={rolling || autoPlay}
                          >
                            {mult}x
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <Button
                        onClick={playRound}
                        disabled={user.balance < bet || rolling || autoPlay}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4"
                      >
                        {rolling ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                            ROLLING...
                          </>
                        ) : (
                          <>
                            <Play className="w-6 h-6 mr-2" />
                            ROLL - ${bet.toFixed(2)}
                          </>
                        )}
                      </Button>

                      {!autoPlay ? (
                        <Button
                          onClick={startAutoPlay}
                          disabled={user.balance < bet}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          START AUTO PLAY
                        </Button>
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
              {/* Auto Play Settings */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">AUTO PLAY SETTINGS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Bets</label>
                    <Input
                      type="number"
                      value={autoCount}
                      onChange={(e) => setAutoCount(Math.max(1, Math.min(1000, Number.parseInt(e.target.value) || 1)))}
                      min="1"
                      max="1000"
                      className="bg-gray-800 border-gray-600 text-white"
                      disabled={autoPlay}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">On Win</label>
                    <select
                      value={onWin}
                      onChange={(e) => setOnWin(e.target.value as "reset" | "increase" | "decrease")}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                      disabled={autoPlay}
                    >
                      <option value="reset">Reset</option>
                      <option value="increase">Increase</option>
                      <option value="decrease">Decrease</option>
                    </select>
                  </div>

                  {onWin !== "reset" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Win Multiplier</label>
                      <Input
                        type="number"
                        value={winMultiplier}
                        onChange={(e) => setWinMultiplier(Math.max(1.01, Number.parseFloat(e.target.value) || 2))}
                        min="1.01"
                        step="0.01"
                        className="bg-gray-800 border-gray-600 text-white"
                        disabled={autoPlay}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">On Loss</label>
                    <select
                      value={onLoss}
                      onChange={(e) => setOnLoss(e.target.value as "reset" | "increase" | "decrease")}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                      disabled={autoPlay}
                    >
                      <option value="reset">Reset</option>
                      <option value="increase">Increase</option>
                      <option value="decrease">Decrease</option>
                    </select>
                  </div>

                  {onLoss !== "reset" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Loss Multiplier</label>
                      <Input
                        type="number"
                        value={lossMultiplier}
                        onChange={(e) => setLossMultiplier(Math.max(1.01, Number.parseFloat(e.target.value) || 2))}
                        min="1.01"
                        step="0.01"
                        className="bg-gray-800 border-gray-600 text-white"
                        disabled={autoPlay}
                      />
                    </div>
                  )}
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
                    <span className="font-bold text-yellow-400">${user.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Games Played:</span>
                    <span className="text-blue-400">{statistics.totalGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Wagered:</span>
                    <span className="text-red-400">${statistics.totalWagered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Won:</span>
                    <span className="text-green-400">${statistics.totalWon.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit:</span>
                    <span
                      className={`font-bold ${
                        statistics.totalWon - statistics.totalWagered >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      ${(statistics.totalWon - statistics.totalWagered).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biggest Win:</span>
                    <span className="text-purple-400">${statistics.biggestWin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Highest Result:</span>
                    <span className="text-orange-400">{statistics.highestResult.toFixed(2)}x</span>
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
                    <span className="text-cyan-400">{statistics.bestStreak}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Results */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">RECENT RESULTS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {gameHistory.map((game, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={game.won ? "bg-green-500" : "bg-red-500"}>{game.result.toFixed(2)}x</Badge>
                          <span className="text-sm">Target: {game.target.toFixed(2)}x</span>
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

              {/* Strategy Tips */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">STRATEGY TIPS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span>Lower targets = higher win rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <span>Higher targets = bigger payouts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span>House edge is always 1%</span>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded text-red-200">
                      <strong>Warning:</strong> Each roll is independent!
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
