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

export default function CoinFlipPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bet, setBet] = useState(100)
  const [selectedSide, setSelectedSide] = useState<"heads" | "tails" | null>(null)
  const [flipping, setFlipping] = useState(false)
  const [result, setResult] = useState<"heads" | "tails" | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoCount, setAutoCount] = useState(10)
  const [currentAuto, setCurrentAuto] = useState(0)
  const [coinRotation, setCoinRotation] = useState(0)
  const [gameHistory, setGameHistory] = useState<
    {
      bet: number
      selectedSide: string
      result: string
      won: boolean
      payout: number
    }[]
  >([])
  const [statistics, setStatistics] = useState({
    totalFlips: 0,
    totalWagered: 0,
    totalWon: 0,
    headsCount: 0,
    tailsCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    biggestWin: 0,
  })

  const payout = 1.95 // 2.5% house edge

  useEffect(() => {
    if (autoPlay && currentAuto < autoCount && !flipping && selectedSide && user && user.balance >= bet) {
      const timer = setTimeout(() => {
        flipCoin()
        setCurrentAuto((prev) => prev + 1)
      }, 1500)
      return () => clearTimeout(timer)
    } else if (currentAuto >= autoCount) {
      setAutoPlay(false)
      setCurrentAuto(0)
    }
  }, [autoPlay, currentAuto, autoCount, flipping])

  const flipCoin = async () => {
    if (!user || user.balance < bet || flipping || !selectedSide) return

    setFlipping(true)
    setResult(null)
    updateBalance(-bet)

    // Animate coin flip
    const spins = 10 + Math.random() * 10 // 10-20 spins
    const finalRotation = coinRotation + spins * 180
    setCoinRotation(finalRotation)

    // Generate result
    const coinResult: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails"

    // Wait for animation
    setTimeout(() => {
      setResult(coinResult)

      // Calculate payout
      const won = selectedSide === coinResult
      const winAmount = won ? bet * payout : 0

      if (won) {
        updateBalance(winAmount)
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
          totalFlips: prev.totalFlips + 1,
          totalWagered: prev.totalWagered + bet,
          totalWon: prev.totalWon + winAmount,
          headsCount: prev.headsCount + (coinResult === "heads" ? 1 : 0),
          tailsCount: prev.tailsCount + (coinResult === "tails" ? 1 : 0),
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, Math.abs(newStreak)),
          biggestWin: Math.max(prev.biggestWin, winAmount),
        }
      })

      // Add to history
      setGameHistory((prev) => [
        {
          bet,
          selectedSide: selectedSide.toUpperCase(),
          result: coinResult.toUpperCase(),
          won,
          payout: winAmount,
        },
        ...prev.slice(0, 9),
      ])

      // Record game result
      addGameResult({
        game: "Coin Flip",
        bet,
        win: winAmount,
        multiplier: won ? payout : 0,
        details: { selectedSide, result: coinResult },
      })

      setFlipping(false)

      // Reset selection if not auto playing
      if (!autoPlay) {
        setTimeout(() => {
          setSelectedSide(null)
          setResult(null)
        }, 2000)
      }
    }, 2000)
  }

  const startAutoPlay = () => {
    if (!selectedSide) return
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
          <h1 className="text-6xl font-bold text-white mb-4">🎇 COIN FLIP</h1>
          <p className="text-xl text-gray-300">The simplest game - Heads or Tails!</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Game */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400">
                <CardContent className="p-8">
                  {/* Coin Display */}
                  <div className="text-center mb-8">
                    <div className="relative w-48 h-48 mx-auto mb-6">
                      <div
                        className={`
                          w-full h-full rounded-full border-8 border-yellow-400 flex items-center justify-center text-6xl font-bold
                          transition-transform duration-2000 ease-out
                          ${flipping ? "animate-spin" : ""}
                          ${
                            result === "heads"
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                              : result === "tails"
                                ? "bg-gradient-to-br from-gray-400 to-gray-600 text-white"
                                : "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                          }
                        `}
                        style={{
                          transform: `rotateY(${coinRotation}deg)`,
                        }}
                      >
                        {flipping ? "🪙" : result === "heads" ? "👑" : result === "tails" ? "🦅" : "🪙"}
                      </div>
                    </div>

                    {/* Result Display */}
                    {result && !flipping && (
                      <div className="mb-4">
                        <Badge
                          className={`text-2xl px-6 py-3 ${selectedSide === result ? "bg-green-500" : "bg-red-500"}`}
                        >
                          {result.toUpperCase()} - {selectedSide === result ? "YOU WIN!" : "YOU LOSE"}
                        </Badge>
                        {selectedSide === result && (
                          <div className="text-2xl font-bold text-green-400 mt-2">
                            +${(bet * payout - bet).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}

                    {flipping && (
                      <Badge className="bg-blue-500 text-white text-xl px-6 py-3 animate-pulse">FLIPPING...</Badge>
                    )}
                  </div>

                  {/* Game Controls */}
                  <div className="space-y-6">
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
                        disabled={flipping || autoPlay}
                      />
                    </div>

                    {/* Side Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => setSelectedSide("heads")}
                        disabled={flipping || autoPlay}
                        className={`
                          bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-xl py-6
                          ${selectedSide === "heads" ? "ring-4 ring-yellow-400" : ""}
                        `}
                      >
                        👑 HEADS
                        <br />
                        {payout}x
                      </Button>
                      <Button
                        onClick={() => setSelectedSide("tails")}
                        disabled={flipping || autoPlay}
                        className={`
                          bg-gray-600 hover:bg-gray-700 text-white font-bold text-xl py-6
                          ${selectedSide === "tails" ? "ring-4 ring-yellow-400" : ""}
                        `}
                      >
                        🦅 TAILS
                        <br />
                        {payout}x
                      </Button>
                    </div>

                    {/* Payout Info */}
                    <div className="p-4 bg-gray-800 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm text-gray-400">Bet Amount</div>
                          <div className="text-xl font-bold text-yellow-400">${bet.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Payout</div>
                          <div className="text-xl font-bold text-green-400">{payout}x</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Profit on Win</div>
                          <div className="text-xl font-bold text-green-400">${(bet * payout - bet).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <Button
                        onClick={flipCoin}
                        disabled={!selectedSide || user.balance < bet || flipping || autoPlay}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4"
                      >
                        {flipping ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                            FLIPPING...
                          </>
                        ) : (
                          <>
                            <Play className="w-6 h-6 mr-2" />
                            FLIP COIN - ${bet.toFixed(2)}
                          </>
                        )}
                      </Button>

                      {/* Auto Play Controls */}
                      {!autoPlay ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium mb-2">Auto Play Count</label>
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
                            disabled={!selectedSide || user.balance < bet}
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
                    <span className="font-bold text-yellow-400">${user.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Flips:</span>
                    <span className="text-blue-400">{statistics.totalFlips}</span>
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
                  <div className="flex justify-between">
                    <span>Biggest Win:</span>
                    <span className="text-orange-400">${statistics.biggestWin.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Heads vs Tails */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">HEADS VS TAILS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">👑</span>
                      Heads:
                    </span>
                    <span className="text-yellow-400 font-bold">{statistics.headsCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">🦅</span>
                      Tails:
                    </span>
                    <span className="text-gray-400 font-bold">{statistics.tailsCount}</span>
                  </div>
                  {statistics.totalFlips > 0 && (
                    <div className="pt-2 border-t border-gray-600">
                      <div className="text-sm text-gray-400">
                        Heads: {((statistics.headsCount / statistics.totalFlips) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">
                        Tails: {((statistics.tailsCount / statistics.totalFlips) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Game History */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">RECENT FLIPS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {gameHistory.map((game, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={game.won ? "bg-green-500" : "bg-red-500"}>
                            {game.selectedSide} → {game.result}
                          </Badge>
                          <span className="text-sm">${game.bet.toFixed(2)}</span>
                        </div>
                        <span className={`font-bold ${game.won ? "text-green-400" : "text-red-400"}`}>
                          {game.won ? "+" : "-"}${game.won ? (game.payout - game.bet).toFixed(2) : game.bet.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {gameHistory.length === 0 && <div className="text-center text-gray-400 py-4">No flips yet</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .duration-2000 {
          transition-duration: 2000ms;
        }
      `}</style>
    </div>
  )
}
