"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import Link from "next/link"

interface PlayingCard {
  suit: "♠️" | "♥️" | "♦️" | "♣️"
  rank: string
  value: number
  color: "red" | "black"
}

const SUITS: PlayingCard["suit"][] = ["♠️", "♥️", "♦️", "♣️"]
const RANKS = [
  { rank: "A", value: 1 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 11 },
  { rank: "Q", value: 12 },
  { rank: "K", value: 13 },
]

export default function HiLoPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bet, setBet] = useState(100)
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [currentCard, setCurrentCard] = useState<PlayingCard | null>(null)
  const [nextCard, setNextCard] = useState<PlayingCard | null>(null)
  const [gameActive, setGameActive] = useState(false)
  const [streak, setStreak] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [showResult, setShowResult] = useState(false)
  const [lastGuess, setLastGuess] = useState<"higher" | "lower" | null>(null)
  const [gameHistory, setGameHistory] = useState<
    {
      bet: number
      streak: number
      payout: number
      multiplier: number
    }[]
  >([])
  const [statistics, setStatistics] = useState({
    totalGames: 0,
    totalWagered: 0,
    totalWon: 0,
    bestStreak: 0,
    biggestWin: 0,
  })

  useEffect(() => {
    initializeDeck()
  }, [])

  const initializeDeck = () => {
    const newDeck: PlayingCard[] = []
    SUITS.forEach((suit) => {
      RANKS.forEach(({ rank, value }) => {
        newDeck.push({
          suit,
          rank,
          value,
          color: suit === "♥️" || suit === "♦️" ? "red" : "black",
        })
      })
    })

    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }

    setDeck(newDeck)
  }

  const startGame = () => {
    if (!user || user.balance < bet || deck.length < 2) return

    updateBalance(-bet)
    setGameActive(true)
    setStreak(0)
    setMultiplier(1)
    setShowResult(false)
    setLastGuess(null)

    // Draw first card
    const firstCard = deck[0]
    setCurrentCard(firstCard)
    setDeck((prev) => prev.slice(1))

    setStatistics((prev) => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      totalWagered: prev.totalWagered + bet,
    }))
  }

  const makeGuess = (guess: "higher" | "lower") => {
    if (!gameActive || !currentCard || deck.length === 0) return

    setLastGuess(guess)

    // Draw next card
    const drawnCard = deck[0]
    setNextCard(drawnCard)
    setDeck((prev) => prev.slice(1))
    setShowResult(true)

    // Check if guess was correct
    let correct = false
    if (guess === "higher" && drawnCard.value > currentCard.value) correct = true
    if (guess === "lower" && drawnCard.value < currentCard.value) correct = true
    if (drawnCard.value === currentCard.value) {
      // Tie - player loses
      correct = false
    }

    if (correct) {
      // Correct guess - increase streak and multiplier
      const newStreak = streak + 1
      const newMultiplier = calculateMultiplier(newStreak)

      setStreak(newStreak)
      setMultiplier(newMultiplier)

      // Update statistics
      setStatistics((prev) => ({
        ...prev,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      }))

      // Continue with next card after delay
      setTimeout(() => {
        setCurrentCard(drawnCard)
        setNextCard(null)
        setShowResult(false)
        setLastGuess(null)

        // Check if deck is running low
        if (deck.length <= 5) {
          initializeDeck()
        }
      }, 2000)
    } else {
      // Wrong guess - game over
      setTimeout(() => {
        endGame(false)
      }, 2000)
    }
  }

  const calculateMultiplier = (streakCount: number) => {
    // Progressive multiplier: 1.5x, 2x, 3x, 5x, 8x, 13x, 21x, etc.
    const multipliers = [1, 1.5, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610]
    return multipliers[Math.min(streakCount, multipliers.length - 1)] || 1000
  }

  const cashOut = () => {
    if (!gameActive || streak === 0) return
    endGame(true)
  }

  const endGame = (cashedOut: boolean) => {
    setGameActive(false)

    const finalPayout = cashedOut ? bet * multiplier : 0
    if (finalPayout > 0) {
      updateBalance(finalPayout)
    }

    // Update statistics
    setStatistics((prev) => ({
      ...prev,
      totalWon: prev.totalWon + finalPayout,
      biggestWin: Math.max(prev.biggestWin, finalPayout),
    }))

    // Add to history
    setGameHistory((prev) => [
      {
        bet,
        streak,
        payout: finalPayout,
        multiplier,
      },
      ...prev.slice(0, 9),
    ])

    // Record game result
    addGameResult({
      game: "Hi-Lo",
      bet,
      win: finalPayout,
      multiplier: cashedOut ? multiplier : 0,
      details: { streak, cashedOut },
    })

    // Reset for next game
    setTimeout(() => {
      setCurrentCard(null)
      setNextCard(null)
      setShowResult(false)
      setStreak(0)
      setMultiplier(1)
      setLastGuess(null)
    }, 3000)
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

  const nextMultiplier = calculateMultiplier(streak + 1)

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
          <h1 className="text-6xl font-bold text-white mb-4">🧠 HI-LO CARDS</h1>
          <p className="text-xl text-gray-300">Guess if the next card will be higher or lower!</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Game */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400">
                <CardContent className="p-8">
                  {/* Game Status */}
                  <div className="text-center mb-8">
                    {gameActive && (
                      <div className="space-y-2">
                        <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                          STREAK: {streak} | MULTIPLIER: {multiplier.toFixed(2)}x
                        </Badge>
                        <div className="text-2xl font-bold text-yellow-400">
                          Current Win: ${(bet * multiplier).toFixed(2)}
                        </div>
                        {streak > 0 && <div className="text-lg text-green-400">Next: {nextMultiplier.toFixed(2)}x</div>}
                      </div>
                    )}
                  </div>

                  {/* Cards Display */}
                  <div className="flex justify-center items-center gap-8 mb-8">
                    {/* Current Card */}
                    <div className="text-center">
                      <div className="text-lg font-bold mb-2">CURRENT CARD</div>
                      {currentCard ? (
                        <div
                          className={`
                          w-32 h-44 rounded-lg border-2 border-white flex flex-col items-center justify-center text-4xl font-bold
                          ${currentCard.color === "red" ? "bg-white text-red-500" : "bg-white text-black"}
                        `}
                        >
                          <div>{currentCard.rank}</div>
                          <div className="text-5xl">{currentCard.suit}</div>
                        </div>
                      ) : (
                        <div className="w-32 h-44 rounded-lg border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
                          <div className="text-6xl">🂠</div>
                        </div>
                      )}
                    </div>

                    {/* VS */}
                    <div className="text-4xl font-bold text-yellow-400">VS</div>

                    {/* Next Card */}
                    <div className="text-center">
                      <div className="text-lg font-bold mb-2">NEXT CARD</div>
                      {showResult && nextCard ? (
                        <div
                          className={`
                          w-32 h-44 rounded-lg border-2 border-white flex flex-col items-center justify-center text-4xl font-bold
                          ${nextCard.color === "red" ? "bg-white text-red-500" : "bg-white text-black"}
                        `}
                        >
                          <div>{nextCard.rank}</div>
                          <div className="text-5xl">{nextCard.suit}</div>
                        </div>
                      ) : (
                        <div className="w-32 h-44 rounded-lg border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
                          <div className="text-6xl">🂠</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Result Display */}
                  {showResult && nextCard && currentCard && (
                    <div className="text-center mb-6">
                      <Badge
                        className={`text-2xl px-6 py-3 ${
                          (lastGuess === "higher" && nextCard.value > currentCard.value) ||
                          (lastGuess === "lower" && nextCard.value < currentCard.value)
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {(lastGuess === "higher" && nextCard.value > currentCard.value) ||
                        (lastGuess === "lower" && nextCard.value < currentCard.value)
                          ? "CORRECT!"
                          : nextCard.value === currentCard.value
                            ? "TIE - YOU LOSE"
                            : "WRONG!"}
                      </Badge>
                    </div>
                  )}

                  {/* Game Controls */}
                  <div className="space-y-6">
                    {!gameActive && !showResult && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Bet Amount</label>
                          <Input
                            type="number"
                            value={bet}
                            onChange={(e) => setBet(Math.max(1, Number.parseInt(e.target.value) || 1))}
                            min="1"
                            max={user.balance}
                            className="bg-gray-800 border-gray-600 text-white text-lg"
                          />
                        </div>
                        <Button
                          onClick={startGame}
                          disabled={user.balance < bet}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4"
                        >
                          START GAME - ${bet}
                        </Button>
                      </div>
                    )}

                    {gameActive && !showResult && currentCard && (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <div className="text-lg text-gray-300">
                            Will the next card be higher or lower than {currentCard.rank}?
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            onClick={() => makeGuess("higher")}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-6"
                          >
                            <TrendingUp className="w-6 h-6 mr-2" />
                            HIGHER
                          </Button>
                          <Button
                            onClick={() => makeGuess("lower")}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-6"
                          >
                            <TrendingDown className="w-6 h-6 mr-2" />
                            LOWER
                          </Button>
                        </div>

                        {streak > 0 && (
                          <Button
                            onClick={cashOut}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl py-4"
                          >
                            <DollarSign className="w-6 h-6 mr-2" />
                            CASH OUT ${(bet * multiplier).toFixed(2)}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Multiplier Table */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">MULTIPLIER TABLE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((streakNum) => (
                      <div
                        key={streakNum}
                        className={`flex justify-between p-2 rounded ${
                          streak === streakNum ? "bg-yellow-500 text-black" : "bg-gray-800"
                        }`}
                      >
                        <span>Streak {streakNum}:</span>
                        <span className="font-bold">{calculateMultiplier(streakNum).toFixed(2)}x</span>
                      </div>
                    ))}
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
                    <span>Best Streak:</span>
                    <span className="text-purple-400">{statistics.bestStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biggest Win:</span>
                    <span className="text-orange-400">${statistics.biggestWin.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Games */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">RECENT GAMES</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {gameHistory.map((game, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={game.payout > 0 ? "bg-green-500" : "bg-red-500"}>
                            Streak: {game.streak}
                          </Badge>
                          {game.multiplier > 0 && (
                            <Badge className="bg-yellow-500 text-black text-xs">{game.multiplier.toFixed(2)}x</Badge>
                          )}
                        </div>
                        <span className={`font-bold ${game.payout > game.bet ? "text-green-400" : "text-red-400"}`}>
                          {game.payout > game.bet ? "+" : ""}${(game.payout - game.bet).toFixed(2)}
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
