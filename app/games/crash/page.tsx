"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, TrendingUp, DollarSign, Zap, Target } from "lucide-react"
import Link from "next/link"

interface CrashGame {
  id: string
  multiplier: number
  crashed: boolean
  players: { username: string; bet: number; cashedOut?: number }[]
}

export default function CrashPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bet, setBet] = useState(100)
  const [autoCashOut, setAutoCashOut] = useState(2.0)
  const [multiplier, setMultiplier] = useState(1.0)
  const [gameState, setGameState] = useState<"waiting" | "flying" | "crashed">("waiting")
  const [playerBet, setPlayerBet] = useState(0)
  const [cashedOut, setCashedOut] = useState(false)
  const [crashPoint, setCrashPoint] = useState(0)
  const [gameHistory, setGameHistory] = useState<number[]>([1.23, 4.56, 1.89, 12.34, 2.67, 1.45, 8.9, 3.21, 1.67, 5.43])
  const [timeLeft, setTimeLeft] = useState(5)
  const [players, setPlayers] = useState<{ username: string; bet: number; cashedOut?: number }[]>([])
  const [currentGame, setCurrentGame] = useState<CrashGame | null>(null)
  const [statistics, setStatistics] = useState({
    totalGames: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    averageMultiplier: 0,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameRef = useRef<number>(0)

  useEffect(() => {
    startCountdown()
    generatePlayers()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const generatePlayers = () => {
    const playerNames = [
      "CryptoKing",
      "DiamondHands",
      "MoonShot",
      "RocketMan",
      "LuckyPlayer",
      "HighRoller",
      "CashMaster",
      "WinnerTakesAll",
    ]
    const newPlayers = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, () => ({
      username: playerNames[Math.floor(Math.random() * playerNames.length)],
      bet: Math.floor(Math.random() * 1000) + 50,
    }))
    setPlayers(newPlayers)
  }

  const startCountdown = () => {
    setTimeLeft(5)
    setGameState("waiting")
    setCashedOut(false)
    setPlayerBet(0)

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown)
          startGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startGame = () => {
    gameRef.current++

    // Generate crash point using realistic algorithm
    const crashMultiplier = generateCrashPoint()
    setCrashPoint(crashMultiplier)
    setGameState("flying")
    setMultiplier(1.0)

    // Create new game
    const newGame: CrashGame = {
      id: `game-${gameRef.current}`,
      multiplier: crashMultiplier,
      crashed: false,
      players: [...players],
    }
    setCurrentGame(newGame)

    // Start multiplier animation
    let currentMultiplier = 1.0
    const startTime = Date.now()
    const increment = 0.01

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      // Exponential growth curve
      currentMultiplier = 1 + (elapsed / 1000) * 0.1 + Math.pow(elapsed / 1000, 1.5) * 0.05

      if (currentMultiplier >= crashMultiplier) {
        // CRASH!
        setMultiplier(crashMultiplier)
        setGameState("crashed")
        setGameHistory((prev) => [crashMultiplier, ...prev.slice(0, 19)])

        // Handle player result
        if (playerBet > 0 && !cashedOut) {
          // Player lost
          addGameResult({
            game: "Crash",
            bet: playerBet,
            win: 0,
            details: { crashPoint: crashMultiplier, cashedOut: false },
          })
        }

        // Update statistics
        setStatistics((prev) => ({
          ...prev,
          totalGames: prev.totalGames + 1,
          averageMultiplier: (prev.averageMultiplier * prev.totalGames + crashMultiplier) / (prev.totalGames + 1),
        }))

        clearInterval(intervalRef.current!)

        // Start next round
        setTimeout(() => {
          generatePlayers()
          startCountdown()
        }, 3000)
        return
      }

      setMultiplier(currentMultiplier)

      // Auto cash out
      if (playerBet > 0 && !cashedOut && autoCashOut > 0 && currentMultiplier >= autoCashOut) {
        cashOut()
      }

      // Simulate other players cashing out
      if (Math.random() < 0.02) {
        // 2% chance per tick
        const activePlayers = players.filter((p) => !p.cashedOut)
        if (activePlayers.length > 0) {
          const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)]
          randomPlayer.cashedOut = currentMultiplier
          setPlayers([...players])
        }
      }
    }, 50)
  }

  const generateCrashPoint = (): number => {
    // Realistic crash point generation (house edge ~1%)
    const random = Math.random()

    if (random < 0.33) return 1 + Math.random() * 1 // 1.00 - 2.00 (33%)
    if (random < 0.66) return 2 + Math.random() * 3 // 2.00 - 5.00 (33%)
    if (random < 0.9) return 5 + Math.random() * 10 // 5.00 - 15.00 (24%)
    if (random < 0.98) return 15 + Math.random() * 35 // 15.00 - 50.00 (8%)
    return 50 + Math.random() * 950 // 50.00 - 1000.00 (2%)
  }

  const placeBet = () => {
    if (!user || user.balance < bet || gameState !== "waiting") return

    updateBalance(-bet)
    setPlayerBet(bet)

    // Add player to current round
    setPlayers((prev) => [...prev, { username: user.username, bet }])

    setStatistics((prev) => ({
      ...prev,
      totalWagered: prev.totalWagered + bet,
    }))
  }

  const cashOut = () => {
    if (gameState !== "flying" || playerBet === 0 || cashedOut) return

    const winAmount = playerBet * multiplier
    updateBalance(winAmount)
    setCashedOut(true)

    // Update statistics
    setStatistics((prev) => ({
      ...prev,
      totalWon: prev.totalWon + winAmount,
      biggestWin: Math.max(prev.biggestWin, winAmount),
    }))

    addGameResult({
      game: "Crash",
      bet: playerBet,
      win: winAmount,
      multiplier,
      details: { crashPoint, cashedOut: true, multiplier },
    })
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

  const getMultiplierColor = () => {
    if (multiplier < 2) return "text-green-400"
    if (multiplier < 5) return "text-yellow-400"
    if (multiplier < 10) return "text-orange-400"
    return "text-red-400"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900">
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
          <h1 className="text-5xl font-orbitron font-bold text-white mb-4">🚀 EVOLUTION CRASH</h1>
          <p className="text-xl text-gray-300">Cash out before the rocket crashes!</p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Game Display */}
            <div className="lg:col-span-3">
              <Card className="casino-card border-4 border-yellow-400 text-white overflow-hidden">
                <CardContent className="p-0">
                  {/* Game Display */}
                  <div className="bg-gradient-to-b from-gray-900 to-black p-8 relative h-96">
                    <div className="absolute inset-0 crash-graph"></div>

                    <div className="relative z-10 h-full flex items-center justify-center">
                      {gameState === "waiting" ? (
                        <div className="text-center">
                          <div className="text-6xl mb-4">⏱️</div>
                          <div className="text-4xl font-orbitron font-bold">
                            {timeLeft > 0 ? `${timeLeft}s` : "TAKING OFF!"}
                          </div>
                          <div className="text-xl text-gray-300 mt-2">Next flight in...</div>
                        </div>
                      ) : gameState === "flying" ? (
                        <div className="text-center">
                          <div className="text-6xl mb-4 crash-rocket">🚀</div>
                          <div className={`text-8xl font-orbitron font-bold ${getMultiplierColor()}`}>
                            {multiplier.toFixed(2)}x
                          </div>
                          <div className="text-xl text-green-400 mt-2 animate-pulse">FLYING!</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl mb-4">💥</div>
                          <div className="text-6xl font-orbitron font-bold text-red-400">{crashPoint.toFixed(2)}x</div>
                          <div className="text-2xl text-red-300 mt-2">CRASHED!</div>
                        </div>
                      )}
                    </div>

                    {/* Players List Overlay */}
                    <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-4 max-h-80 overflow-y-auto">
                      <h4 className="font-bold mb-2">Players ({players.length})</h4>
                      <div className="space-y-1 text-sm">
                        {players.slice(0, 10).map((player, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className={player.username === user.username ? "text-yellow-400 font-bold" : ""}>
                              {player.username}
                            </span>
                            <div className="flex gap-2">
                              <span>${player.bet}</span>
                              {player.cashedOut && (
                                <Badge className="bg-green-500 text-xs">{player.cashedOut.toFixed(2)}x</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Control Panel */}
                  <div className="p-6 bg-gradient-to-r from-gray-800 to-black">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">BET AMOUNT</label>
                        <Input
                          type="number"
                          value={bet}
                          onChange={(e) => setBet(Math.max(10, Number.parseInt(e.target.value) || 10))}
                          min="10"
                          max={user.balance}
                          className="bg-white/10 border-white/20 text-white text-center font-bold"
                          disabled={gameState !== "waiting" || playerBet > 0}
                        />
                      </div>

                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">AUTO CASH OUT</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={autoCashOut}
                          onChange={(e) => setAutoCashOut(Number.parseFloat(e.target.value) || 0)}
                          min="1.1"
                          max="1000"
                          className="bg-white/10 border-white/20 text-white text-center font-bold"
                          disabled={gameState !== "waiting"}
                        />
                      </div>

                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">POTENTIAL WIN</label>
                        <div className="bg-green-600 text-white rounded-md px-3 py-2 text-center font-bold">
                          ${(playerBet * multiplier).toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">BALANCE</label>
                        <div className="bg-yellow-500 text-black rounded-md px-3 py-2 text-center font-bold">
                          ${user.balance.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                      {gameState === "waiting" && playerBet === 0 && (
                        <Button
                          onClick={placeBet}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-xl px-8 py-4"
                          disabled={user.balance < bet}
                        >
                          <DollarSign className="w-6 h-6 mr-2" />
                          BET ${bet}
                        </Button>
                      )}

                      {gameState === "waiting" && playerBet > 0 && (
                        <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                          <div className="text-lg font-bold">Bet Placed: ${playerBet}</div>
                          <div className="text-sm text-gray-300">Waiting for takeoff...</div>
                        </div>
                      )}

                      {gameState === "flying" && playerBet > 0 && !cashedOut && (
                        <Button
                          onClick={cashOut}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-xl px-8 py-4 animate-pulse"
                        >
                          <TrendingUp className="w-6 h-6 mr-2" />
                          CASH OUT ${(playerBet * multiplier).toFixed(2)}
                        </Button>
                      )}

                      {cashedOut && (
                        <div className="text-center p-4 bg-green-500/20 rounded-lg">
                          <div className="text-lg font-bold text-green-400">
                            Cashed Out! +${(playerBet * multiplier).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-300">At {multiplier.toFixed(2)}x</div>
                        </div>
                      )}
                    </div>

                    {/* Quick Bet Buttons */}
                    <div className="mt-4 flex gap-2 justify-center flex-wrap">
                      <span className="text-white font-bold self-center mr-2">QUICK BET:</span>
                      {[50, 100, 250, 500, 1000, 2500].map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => setBet(amount)}
                          size="sm"
                          variant="outline"
                          className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent"
                          disabled={gameState !== "waiting" || user.balance < amount || playerBet > 0}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Player Stats */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400 font-orbitron">YOUR STATS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <span>Biggest Win:</span>
                    <span className="text-purple-400">${statistics.biggestWin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Multiplier:</span>
                    <span className="text-orange-400">{statistics.averageMultiplier.toFixed(2)}x</span>
                  </div>
                </CardContent>
              </Card>

              {/* Game History */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400 font-orbitron">CRASH HISTORY</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {gameHistory.map((crash, index) => (
                      <Badge
                        key={index}
                        className={`text-center font-bold ${
                          crash < 2
                            ? "bg-red-500"
                            : crash < 5
                              ? "bg-yellow-500 text-black"
                              : crash < 10
                                ? "bg-green-500"
                                : "bg-purple-500"
                        }`}
                      >
                        {crash.toFixed(2)}x
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Tips */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400 font-orbitron">STRATEGY</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span>Set auto cash out for consistent wins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span>Lower multipliers = higher win rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span>Watch other players' strategies</span>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded text-red-200">
                      <strong>Warning:</strong> Past results don't predict future crashes!
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Rules */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400 font-orbitron">HOW TO PLAY</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-gray-300">
                    <li>• Place your bet before takeoff</li>
                    <li>• Watch the multiplier increase</li>
                    <li>• Cash out before the crash</li>
                    <li>• If you don't cash out in time, you lose</li>
                    <li>• Use auto cash out for safety</li>
                    <li>• Higher risk = higher reward</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
