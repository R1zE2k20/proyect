"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, Pause, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

interface DiceResult {
  id: string
  roll: number
  target: number
  isOver: boolean
  won: boolean
  payout: number
  bet: number
}

export default function DicePage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bet, setBet] = useState(100)
  const [winChance, setWinChance] = useState(50)
  const [isOver, setIsOver] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [currentRoll, setCurrentRoll] = useState<number | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoCount, setAutoCount] = useState(10)
  const [currentAuto, setCurrentAuto] = useState(0)
  const [onWin, setOnWin] = useState<"reset" | "increase" | "decrease">("reset")
  const [onLoss, setOnLoss] = useState<"reset" | "increase" | "decrease">("reset")
  const [winMultiplier, setWinMultiplier] = useState(2)
  const [lossMultiplier, setLossMultiplier] = useState(2)
  const [stopOnProfit, setStopOnProfit] = useState(0)
  const [stopOnLoss, setStopOnLoss] = useState(0)
  const [recentResults, setRecentResults] = useState<DiceResult[]>([])
  const [statistics, setStatistics] = useState({
    totalBets: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    currentStreak: 0,
    bestStreak: 0,
    worstStreak: 0,
  })

  const houseEdge = 1 // 1% house edge
  const payout = (100 - houseEdge) / winChance
  const profit = bet * (payout - 1)

  useEffect(() => {
    if (autoPlay && currentAuto < autoCount && user && user.balance >= bet) {
      const timer = setTimeout(() => {
        rollDice()
        setCurrentAuto((prev) => prev + 1)
      }, 500)
      return () => clearTimeout(timer)
    } else if (currentAuto >= autoCount) {
      setAutoPlay(false)
      setCurrentAuto(0)
    }
  }, [autoPlay, currentAuto, autoCount, rolling])

  const rollDice = async () => {
    if (!user || user.balance < bet || rolling) return

    setRolling(true)
    updateBalance(-bet)

    // Simulate rolling animation
    const rollAnimation = setInterval(() => {
      setCurrentRoll(Math.random() * 100)
    }, 50)

    setTimeout(() => {
      clearInterval(rollAnimation)

      // Generate final result
      const roll = Math.random() * 100
      const target = isOver ? winChance : 100 - winChance
      const won = isOver ? roll > 100 - winChance : roll < winChance

      setCurrentRoll(roll)

      const result: DiceResult = {
        id: Date.now().toString(),
        roll,
        target,
        isOver,
        won,
        payout: won ? bet * payout : 0,
        bet,
      }

      // Handle payout
      if (won) {
        updateBalance(result.payout)
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
          totalBets: prev.totalBets + 1,
          totalWagered: prev.totalWagered + bet,
          totalWon: prev.totalWon + result.payout,
          biggestWin: Math.max(prev.biggestWin, result.payout),
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          worstStreak: Math.min(prev.worstStreak, newStreak),
        }
      })

      // Add to recent results
      setRecentResults((prev) => [result, ...prev.slice(0, 9)])

      // Record game result
      addGameResult({
        game: "Dice",
        bet,
        win: result.payout,
        multiplier: won ? payout : 0,
        details: { roll, target, isOver, winChance },
      })

      // Auto play bet adjustment
      if (autoPlay) {
        if (won && onWin !== "reset") {
          setBet((prev) => (onWin === "increase" ? prev * winMultiplier : prev / winMultiplier))
        } else if (!won && onLoss !== "reset") {
          setBet((prev) => (onLoss === "increase" ? prev * lossMultiplier : prev / lossMultiplier))
        }

        // Check stop conditions
        const profit = statistics.totalWon - statistics.totalWagered
        if ((stopOnProfit > 0 && profit >= stopOnProfit) || (stopOnLoss > 0 && profit <= -stopOnLoss)) {
          setAutoPlay(false)
          setCurrentAuto(0)
        }
      }

      setRolling(false)
    }, 1000)
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
          <h1 className="text-6xl font-bold text-white mb-4">🎲 DICE</h1>
          <p className="text-xl text-gray-300">Predict if the roll will be over or under your target</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Game */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400">
                <CardContent className="p-8">
                  {/* Dice Display */}
                  <div className="text-center mb-8">
                    <div className="relative w-48 h-48 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                      <div className="text-6xl font-bold text-black">
                        {currentRoll !== null ? currentRoll.toFixed(2) : "00.00"}
                      </div>
                      {rolling && (
                        <div className="absolute inset-0 rounded-2xl border-4 border-yellow-400 animate-pulse"></div>
                      )}
                    </div>

                    {/* Result Display */}
                    {currentRoll !== null && !rolling && (
                      <div className="mb-4">
                        <Badge
                          className={`text-2xl px-6 py-3 ${recentResults[0]?.won ? "bg-green-500" : "bg-red-500"}`}
                        >
                          {recentResults[0]?.won ? "WIN" : "LOSE"}
                        </Badge>
                        {recentResults[0]?.won && (
                          <div className="text-2xl font-bold text-green-400 mt-2">
                            +${recentResults[0].payout.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Game Controls */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
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
                        disabled={autoPlay}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Win Chance (%)</label>
                      <Input
                        type="number"
                        value={winChance}
                        onChange={(e) =>
                          setWinChance(Math.max(0.01, Math.min(98, Number.parseFloat(e.target.value) || 50)))
                        }
                        min="0.01"
                        max="98"
                        step="0.01"
                        className="bg-gray-800 border-gray-600 text-white text-lg"
                        disabled={autoPlay}
                      />
                    </div>
                  </div>

                  {/* Win Chance Slider */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Win Chance</span>
                      <span className="text-sm text-gray-400">{winChance.toFixed(2)}%</span>
                    </div>
                    <Slider
                      value={[winChance]}
                      onValueChange={(value) => setWinChance(value[0])}
                      min={0.01}
                      max={98}
                      step={0.01}
                      className="w-full"
                      disabled={autoPlay}
                    />
                  </div>

                  {/* Over/Under Toggle */}
                  <div className="flex gap-4 mb-6">
                    <Button
                      onClick={() => setIsOver(false)}
                      className={`flex-1 py-4 text-lg font-bold ${
                        !isOver ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"
                      }`}
                      disabled={autoPlay}
                    >
                      <TrendingDown className="w-5 h-5 mr-2" />
                      ROLL UNDER {(100 - winChance).toFixed(2)}
                    </Button>
                    <Button
                      onClick={() => setIsOver(true)}
                      className={`flex-1 py-4 text-lg font-bold ${
                        isOver ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
                      }`}
                      disabled={autoPlay}
                    >
                      <TrendingUp className="w-5 h-5 mr-2" />
                      ROLL OVER {(100 - winChance).toFixed(2)}
                    </Button>
                  </div>

                  {/* Payout Info */}
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Payout</div>
                      <div className="text-xl font-bold text-yellow-400">{payout.toFixed(4)}x</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Profit on Win</div>
                      <div className="text-xl font-bold text-green-400">${profit.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">House Edge</div>
                      <div className="text-xl font-bold text-red-400">{houseEdge}%</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <Button
                      onClick={rollDice}
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
                          ROLL DICE - ${bet.toFixed(2)}
                        </>
                      )}
                    </Button>

                    {!autoPlay ? (
                      <Button
                        onClick={startAutoPlay}
                        disabled={user.balance < bet}
                        className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        START AUTO PLAY
                      </Button>
                    ) : (
                      <Button onClick={stopAutoPlay} className="w-full bg-red-600 hover:bg-red-700 font-bold py-3">
                        <Pause className="w-5 h-5 mr-2" />
                        STOP AUTO ({currentAuto}/{autoCount})
                      </Button>
                    )}
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

                  <div>
                    <label className="block text-sm font-medium mb-2">Stop on Profit ($)</label>
                    <Input
                      type="number"
                      value={stopOnProfit}
                      onChange={(e) => setStopOnProfit(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                      min="0"
                      step="0.01"
                      className="bg-gray-800 border-gray-600 text-white"
                      disabled={autoPlay}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Stop on Loss ($)</label>
                    <Input
                      type="number"
                      value={stopOnLoss}
                      onChange={(e) => setStopOnLoss(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                      min="0"
                      step="0.01"
                      className="bg-gray-800 border-gray-600 text-white"
                      disabled={autoPlay}
                    />
                  </div>
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
                    <span>Total Bets:</span>
                    <span className="text-blue-400">{statistics.totalBets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wagered:</span>
                    <span className="text-red-400">${statistics.totalWagered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Won:</span>
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
                    <span className="text-green-400">{statistics.bestStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Worst Streak:</span>
                    <span className="text-red-400">{statistics.worstStreak}</span>
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
                    {recentResults.map((result, index) => (
                      <div key={result.id} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={result.won ? "bg-green-500" : "bg-red-500"}>{result.roll.toFixed(2)}</Badge>
                          <span className="text-sm">
                            {result.isOver ? ">" : "<"} {result.target.toFixed(2)}
                          </span>
                        </div>
                        <span className={`font-bold ${result.won ? "text-green-400" : "text-red-400"}`}>
                          {result.won ? "+" : "-"}$
                          {result.won ? (result.payout - result.bet).toFixed(2) : result.bet.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {recentResults.length === 0 && (
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
