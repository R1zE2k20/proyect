"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, RotateCcw, Volume2, VolumeX, Zap, Crown } from "lucide-react"
import Link from "next/link"

// Símbolos con valores reales de slots profesionales
const SYMBOLS = [
  { symbol: "🍒", value: 5, weight: 100, name: "Cherry" },
  { symbol: "🍋", value: 10, weight: 80, name: "Lemon" },
  { symbol: "🍊", value: 15, weight: 70, name: "Orange" },
  { symbol: "🍇", value: 20, weight: 60, name: "Grape" },
  { symbol: "🔔", value: 50, weight: 40, name: "Bell" },
  { symbol: "💰", value: 100, weight: 25, name: "Money Bag" },
  { symbol: "⭐", value: 200, weight: 15, name: "Star" },
  { symbol: "💎", value: 500, weight: 8, name: "Diamond" },
  { symbol: "🎰", value: 1000, weight: 3, name: "Jackpot" },
  { symbol: "🃏", value: 0, weight: 20, name: "Wild" }, // Wild symbol
]

// Líneas de pago profesionales (25 líneas)
const PAYLINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2], // Horizontales
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2], // V shapes
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1], // Zigzag
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0], // Diagonales
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1], // W shapes
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], // Inverse V
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2], // Picos
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1], // Valles
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2], // Alternados
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2], // Saltos
  [1, 0, 2, 0, 1],
  [1, 2, 0, 2, 1], // Diagonales complejas
  [0, 1, 2, 2, 1], // Línea especial
]

export default function SlotsPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [reels, setReels] = useState<string[][]>([
    ["🍒", "🍋", "🍊"],
    ["🍇", "🔔", "💰"],
    ["⭐", "💎", "🎰"],
    ["🃏", "🍒", "🍋"],
    ["🍊", "🍇", "🔔"]
  ])
  
  const [bet, setBet] = useState(1)
  const [lines, setLines] = useState(25)
  const [spinning, setSpinning] = useState(false)
  const [lastWin, setLastWin] = useState(0)
  const [jackpot, setJackpot] = useState(2847392)
  const [winningLines, setWinningLines] = useState<number[]>([])
  const [autoSpin, setAutoSpin] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [freeSpins, setFreeSpins] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [bonusGame, setBonusGame] = useState(false)
  const [rtp, setRtp] = useState(96.5)
  const [volatility] = useState("High")
  const [maxWin] = useState(5000)
  
  const spinCountRef = useRef(0)
  const autoSpinRef = useRef<NodeJS.Timeout | null>(null)
  const reelRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    // Jackpot increment simulation
    const interval = setInterval(() => {
      setJackpot(prev => prev + Math.floor(Math.random() * 100) + 25)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Auto spin logic
    if (autoSpin > 0 && !spinning && user && user.balance >= bet * lines) {
      autoSpinRef.current = setTimeout(() => {
        spin()
        setAutoSpin(prev => prev - 1)
      }, 1500)
    }
    return () => {
      if (autoSpinRef.current) clearTimeout(autoSpinRef.current)
    }
  }, [autoSpin, spinning, bet, lines])

  const getWeightedSymbol = () => {
    const totalWeight = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const symbol of SYMBOLS) {
      random -= symbol.weight
      if (random <= 0) return symbol.symbol
    }
    return SYMBOLS[0].symbol
  }

  const generateReels = () => {
    return Array.from({ length: 5 }, () => 
      Array.from({ length: 3 }, () => getWeightedSymbol())
    )
  }

  const checkWinningCombinations = (reelsData: string[][]) => {
    const wins: any[] = []
    const winningLineNumbers: number[] = []
    let totalWin = 0

    PAYLINES.slice(0, lines).forEach((line, lineIndex) => {
      const lineSymbols = line.map((row, col) => reelsData[col][row])
      
      // Check for winning combinations
      let consecutiveCount = 1
      let winSymbol = lineSymbols[0]
      
      // Handle wild symbols
      if (winSymbol === "🃏") {
        winSymbol = lineSymbols.find(s => s !== "🃏") || "🃏"
      }
      
      for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i] === winSymbol || lineSymbols[i] === "🃏" || winSymbol === "🃏") {
          consecutiveCount++
        } else {
          break
        }
      }
      
      if (consecutiveCount >= 3) {
        const symbolData = SYMBOLS.find(s => s.symbol === winSymbol)
        if (symbolData && symbolData.symbol !== "🃏") {
          const baseWin = symbolData.value * bet * consecutiveCount * multiplier
          const lineWin = Math.floor(baseWin * (consecutiveCount === 5 ? 2 : consecutiveCount === 4 ? 1.5 : 1))
          
          wins.push({
            line: lineIndex,
            symbol: winSymbol,
            count: consecutiveCount,
            amount: lineWin
          })
          
          winningLineNumbers.push(lineIndex)
          totalWin += lineWin
        }
      }
    })

    // Check for scatter bonuses (⭐)
    const scatterCount = reelsData.flat().filter(symbol => symbol === "⭐").length
    if (scatterCount >= 3) {
      const scatterWin = bet * lines * scatterCount * 2
      totalWin += scatterWin
      setFreeSpins(prev => prev + scatterCount * 3)
    }

    // Jackpot check (5 🎰 symbols)
    const jackpotSymbols = reelsData.flat().filter(symbol => symbol === "🎰").length
    if (jackpotSymbols === 5 && bet >= 5) {
      totalWin += jackpot * 0.1 // 10% of jackpot
    }

    return { wins, winningLineNumbers, totalWin }
  }

  const spin = async () => {
    if (!user || (user.balance < bet * lines && freeSpins === 0) || spinning) return

    setSpinning(true)
    setLastWin(0)
    setWinningLines([])
    spinCountRef.current++

    // Deduct bet (unless free spin)
    if (freeSpins === 0) {
      updateBalance(-(bet * lines))
    } else {
      setFreeSpins(prev => prev - 1)
    }

    // Realistic reel animation
    const spinDuration = 2000
    const reelDelays = [0, 150, 300, 450, 600]
    
    // Start spinning animation
    reelRefs.current.forEach((reel, index) => {
      if (reel) {
        reel.style.animation = `reelSpin ${spinDuration + reelDelays[index]}ms cubic-bezier(0.23, 1, 0.32, 1)`
      }
    })

    // Generate final result
    const finalReels = generateReels()
    
    // Stop reels one by one
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, spinDuration + reelDelays[i]))
      setReels(prev => {
        const newReels = [...prev]
        newReels[i] = finalReels[i]
        return newReels
      })
    }

    // Calculate wins
    const { wins, winningLineNumbers, totalWin } = checkWinningCombinations(finalReels)
    
    setWinningLines(winningLineNumbers)
    setLastWin(totalWin)

    if (totalWin > 0) {
      updateBalance(totalWin)
      
      // Play win animation
      if (totalWin > bet * lines * 10) {
        // Big win animation
        setTimeout(() => {
          // Trigger big win celebration
        }, 500)
      }
    }

    // Record game result
    addGameResult({
      game: "Mega Slots",
      bet: freeSpins > 0 ? 0 : bet * lines,
      win: totalWin,
      multiplier: totalWin > 0 ? totalWin / (bet * lines) : 0,
      details: { wins, reels: finalReels, freeSpins: freeSpins > 0 }
    })

    setSpinning(false)
  }

  const stopAutoSpin = () => {
    setAutoSpin(0)
    if (autoSpinRef.current) {
      clearTimeout(autoSpinRef.current)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen premium-gradient">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Card className="casino-card text-white max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">🎰</div>
              <h1 className="text-3xl font-orbitron font-bold mb-4">Login Required</h1>
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                  LOGIN TO PLAY
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalBet = bet * lines
  const canSpin = user.balance >= totalBet || freeSpins > 0

  return (
    <div className="min-h-screen premium-gradient">
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
          <h1 className="text-6xl font-orbitron font-black text-white mb-4 neon-text">
            🎰 EVOLUTION SLOTS
          </h1>
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-lg px-4 py-2">
              <Crown className="w-4 h-4 mr-2" />
              PROGRESSIVE JACKPOT: ${jackpot.toLocaleString()}
            </Badge>
            {freeSpins > 0 && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg px-4 py-2 animate-pulse">
                <Zap className="w-4 h-4 mr-2" />
                FREE SPINS: {freeSpins}
              </Badge>
            )}
            <Badge className="bg-blue-600 text-white">RTP: {rtp}%</Badge>
            <Badge className="bg-red-600 text-white">Volatility: {volatility}</Badge>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Slot Machine */}
            <div className="lg:col-span-3">
              <Card className="casino-card border-4 border-yellow-400 text-white overflow-hidden">
                <CardContent className="p-0">
                  {/* Slot Display */}
                  <div className="bg-gradient-to-b from-gray-900 to-black p-8 relative">
                    {/* Reels Container */}
                    <div className="grid grid-cols-5 gap-4 mb-6 relative">
                      {reels.map((reel, reelIndex) => (
                        <div 
                          key={reelIndex}
                          ref={el => reelRefs.current[reelIndex] = el!}
                          className="slot-reel rounded-lg p-4 relative overflow-hidden"
                        >
                          <div className="space-y-2">
                            {reel.map((symbol, symbolIndex) => (
                              <div
                                key={`${reelIndex}-${symbolIndex}`}
                                className={`
                                  text-5xl text-center transition-all duration-500
                                  ${spinning ? 'blur-sm' : ''}
                                  ${winningLines.some(line => 
                                    PAYLINES[line] && PAYLINES[line][reelIndex] === symbolIndex
                                  ) ? 'win-animation scale-110 text-yellow-400' : ''}
                                `}
                              >
                                {symbol}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Win Lines Overlay */}
                    {winningLines.length > 0 && (
                      <div className="absolute inset-0 pointer-events-none">
                        {winningLines.map(lineIndex => (
                          <div
                            key={lineIndex}
                            className="absolute inset-0 border-2 border-yellow-400 rounded-lg animate-pulse"
                            style={{
                              background: 'linear-gradient(90deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.1) 50%, rgba(255,215,0,0.2) 100%)'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Control Panel */}
                  <div className="p-6 bg-gradient-to-r from-gray-800 to-black">
                    {/* Bet Controls */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">BET PER LINE</label>
                        <Input
                          type="number"
                          value={bet}
                          onChange={(e) => setBet(Math.max(0.1, Math.min(100, Number.parseFloat(e.target.value) || 0.1))}
                          min={0.1}
                          max={100}\
                          step={0.1}\
                          className=\"bg-white/10 border-white/20 text-white text-center font-bold"\
                          disabled={spinning || autoSpin > 0}
                        />\
                      </div>
\
                      <div>\
                        <label className="text-white font-bold text-sm mb-2 block">LINES</label>
                        <Input
                          type="number"
                          value={lines}
                          onChange={(e) => setLines(Math.max(1, Math.min(25, Number.parseInt(e.target.value) || 1)))}
                          min={1}
                          max={25}
                          className="bg-white/10 border-white/20 text-white text-center font-bold"
                          disabled={spinning || autoSpin > 0}
                        />
                      </div>

                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">TOTAL BET</label>
                        <div className="bg-yellow-500 text-black rounded-md px-3 py-2 text-center font-bold">
                          ${totalBet.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">BALANCE</label>
                        <div className="bg-green-600 text-white rounded-md px-3 py-2 text-center font-bold">
                          ${user.balance.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <label className="text-white font-bold text-sm mb-2 block">LAST WIN</label>
                        <div className={`rounded-md px-3 py-2 text-center font-bold ${
                          lastWin > 0 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'
                        }`}>
                          ${lastWin.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center flex-wrap mb-4">
                      <Button
                        onClick={spin}
                        disabled={spinning || !canSpin || autoSpin > 0}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-xl px-8 py-4 disabled:opacity-50"
                      >
                        {spinning ? (
                          <>
                            <RotateCcw className="w-6 h-6 mr-2 animate-spin" />
                            SPINNING...
                          </>
                        ) : freeSpins > 0 ? (
                          <>
                            <Zap className="w-6 h-6 mr-2" />
                            FREE SPIN
                          </>
                        ) : (
                          <>
                            <Play className="w-6 h-6 mr-2" />
                            SPIN - ${totalBet.toFixed(2)}
                          </>
                        )}
                      </Button>

                      {autoSpin === 0 ? (
                        <>
                          <Button
                            onClick={() => setAutoSpin(10)}
                            disabled={spinning || !canSpin}
                            className="bg-blue-600 hover:bg-blue-700 font-bold px-6 py-4"
                          >
                            AUTO 10
                          </Button>
                          <Button
                            onClick={() => setAutoSpin(50)}
                            disabled={spinning || !canSpin}
                            className="bg-purple-600 hover:bg-purple-700 font-bold px-6 py-4"
                          >
                            AUTO 50
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={stopAutoSpin}
                          className="bg-red-600 hover:bg-red-700 font-bold px-6 py-4"
                        >
                          STOP AUTO ({autoSpin})
                        </Button>
                      )}

                      <Button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        variant="outline"
                        className="border-white text-white hover:bg-white hover:text-black bg-transparent px-4 py-4"
                      >
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </Button>
                    </div>

                    {/* Quick Bet Buttons */}
                    <div className="flex gap-2 justify-center flex-wrap">
                      <span className="text-white font-bold self-center mr-2">QUICK BET:</span>
                      {[0.5, 1, 2.5, 5, 10, 25].map(amount => (
                        <Button
                          key={amount}
                          onClick={() => setBet(amount)}
                          size="sm"
                          variant="outline"
                          className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent"
                          disabled={spinning || autoSpin > 0}
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
                  <CardTitle className="text-yellow-400 font-orbitron">PLAYER STATS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className="font-bold text-yellow-400">${user.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <Badge className="bg-purple-500">{user.level}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Spins:</span>
                    <span className="text-blue-400">{spinCountRef.current}</span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Next Level:</span>
                      <span className="text-sm">{user.xp % 1000}/1000 XP</span>
                    </div>
                    <Progress value={(user.xp % 1000) / 10} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Paytable */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400 font-orbitron">PAYTABLE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {SYMBOLS.filter(s => s.symbol !== "🃏").map(symbol => (
                      <div key={symbol.symbol} className="flex justify-between items-center p-2 bg-white/5 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{symbol.symbol}</span>
                          <span className="text-sm">{symbol.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-400">{symbol.value}x</div>
                          <div className="text-xs text-gray-400">3+ symbols</div>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 bg-purple-500/20 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🃏</span>
                        <span className="text-sm font-bold">WILD</span>
                      </div>
                      <div className="text-xs text-purple-200">Substitutes for all symbols</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Features */}
              <Card className="casino-card text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400 font-orbitron">FEATURES</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <span>3+ Scatters = Free Spins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🃏</span>
                      <span>Wild substitutes all symbols</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎰</span>
                      <span>5 Jackpot symbols = Progressive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span>Max Win: {maxWin}x bet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span>25 Paylines</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes reelSpin {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-100px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  )\
}
