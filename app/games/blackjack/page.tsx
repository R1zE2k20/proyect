"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, Plus, Minus, Split, Shield } from "lucide-react"
import Link from "next/link"

interface PlayingCard {
  suit: "♠️" | "♥️" | "♦️" | "♣️"
  rank: string
  value: number
  hidden?: boolean
}

const SUITS: PlayingCard["suit"][] = ["♠️", "♥️", "♦️", "♣️"]
const RANKS = [
  { rank: "A", value: 11 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 10 },
  { rank: "Q", value: 10 },
  { rank: "K", value: 10 },
]

export default function BlackjackPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [playerHands, setPlayerHands] = useState<PlayingCard[][]>([[]])
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([])
  const [currentHand, setCurrentHand] = useState(0)
  const [bet, setBet] = useState(25)
  const [gameState, setGameState] = useState<"betting" | "playing" | "dealer" | "finished">("betting")
  const [message, setMessage] = useState("")
  const [canDouble, setCanDouble] = useState(false)
  const [canSplit, setCanSplit] = useState(false)
  const [canSurrender, setCanSurrender] = useState(false)
  const [insurance, setInsurance] = useState(false)
  const [handResults, setHandResults] = useState<string[]>([])
  const [dealerRevealed, setDealerRevealed] = useState(false)
  const [cardCount, setCardCount] = useState(0) // Basic card counting
  const [deckPenetration, setDeckPenetration] = useState(100)

  useEffect(() => {
    initializeDeck()
  }, [])

  const initializeDeck = () => {
    // Use 6 decks like real casinos
    const newDeck: PlayingCard[] = []
    for (let d = 0; d < 6; d++) {
      SUITS.forEach((suit) => {
        RANKS.forEach(({ rank, value }) => {
          newDeck.push({ suit, rank, value })
        })
      })
    }

    // Shuffle deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }

    setDeck(newDeck)
    setDeckPenetration(100)
    setCardCount(0)
  }

  const calculateHandValue = (hand: PlayingCard[]) => {
    let value = 0
    let aces = 0

    hand
      .filter((card) => !card.hidden)
      .forEach((card) => {
        if (card.rank === "A") {
          aces++
          value += 11
        } else {
          value += card.value
        }
      })

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10
      aces--
    }

    return { value, soft: aces > 0 && value <= 21 }
  }

  const dealCard = (hidden = false): PlayingCard => {
    if (deck.length < 52) {
      // Reshuffle when deck gets low
      initializeDeck()
    }

    const card = deck[0]
    setDeck((prev) => prev.slice(1))
    setDeckPenetration((prev) => prev - 100 / (6 * 52))

    // Basic card counting (Hi-Lo system)
    if (!hidden) {
      const cardValue = card.value === 10 || card.rank === "A" ? -1 : card.value >= 2 && card.value <= 6 ? 1 : 0
      setCardCount((prev) => prev + cardValue)
    }

    return { ...card, hidden }
  }

  const startGame = () => {
    if (!user || user.balance < bet) return

    updateBalance(-bet)
    setGameState("playing")
    setMessage("")
    setCurrentHand(0)
    setHandResults([])
    setDealerRevealed(false)
    setInsurance(false)

    // Deal initial cards
    const newPlayerHand = [dealCard(), dealCard()]
    const newDealerHand = [dealCard(), dealCard(true)] // Second card hidden

    setPlayerHands([newPlayerHand])
    setDealerHand(newDealerHand)

    // Check for blackjack
    const playerValue = calculateHandValue(newPlayerHand).value
    const dealerUpCard = newDealerHand[0]

    if (playerValue === 21) {
      // Player blackjack
      setDealerRevealed(true)
      const dealerValue = calculateHandValue([...newDealerHand.map((c) => ({ ...c, hidden: false }))])

      if (dealerValue.value === 21) {
        setMessage("Push - Both have Blackjack")
        updateBalance(bet) // Return bet
        setHandResults(["push"])
      } else {
        setMessage("Blackjack! You win!")
        updateBalance(bet * 2.5) // 3:2 payout
        setHandResults(["blackjack"])
      }
      setGameState("finished")
      return
    }

    // Check for insurance
    if (dealerUpCard.rank === "A") {
      setInsurance(true)
    }

    // Set available actions
    setCanDouble(newPlayerHand.length === 2 && user.balance >= bet)
    setCanSplit(newPlayerHand.length === 2 && newPlayerHand[0].rank === newPlayerHand[1].rank && user.balance >= bet)
    setCanSurrender(newPlayerHand.length === 2)
  }

  const hit = () => {
    if (gameState !== "playing") return

    const newCard = dealCard()
    const newHands = [...playerHands]
    newHands[currentHand] = [...newHands[currentHand], newCard]
    setPlayerHands(newHands)

    const handValue = calculateHandValue(newHands[currentHand]).value

    if (handValue > 21) {
      // Bust
      const newResults = [...handResults]
      newResults[currentHand] = "bust"
      setHandResults(newResults)

      if (currentHand < playerHands.length - 1) {
        setCurrentHand((prev) => prev + 1)
      } else {
        finishGame()
      }
    }

    setCanDouble(false)
    setCanSplit(false)
    setCanSurrender(false)
  }

  const stand = () => {
    if (gameState !== "playing") return

    if (currentHand < playerHands.length - 1) {
      setCurrentHand((prev) => prev + 1)
    } else {
      dealerPlay()
    }
  }

  const doubleDown = () => {
    if (!canDouble || !user || user.balance < bet) return

    updateBalance(-bet)
    hit()

    if (currentHand < playerHands.length - 1) {
      setCurrentHand((prev) => prev + 1)
    } else {
      dealerPlay()
    }
  }

  const split = () => {
    if (!canSplit || !user || user.balance < bet) return

    updateBalance(-bet)

    const originalHand = playerHands[currentHand]
    const newHands = [...playerHands]

    // Split into two hands
    newHands[currentHand] = [originalHand[0], dealCard()]
    newHands.splice(currentHand + 1, 0, [originalHand[1], dealCard()])

    setPlayerHands(newHands)
    setCanSplit(false)
    setCanDouble(true)
  }

  const surrender = () => {
    if (!canSurrender) return

    updateBalance(bet * 0.5) // Get half bet back
    setMessage("Surrendered")
    setHandResults(["surrender"])
    setGameState("finished")

    addGameResult({
      game: "Blackjack",
      bet,
      win: bet * 0.5,
      details: { action: "surrender" },
    })
  }

  const buyInsurance = () => {
    if (!user || user.balance < bet * 0.5) return

    updateBalance(-bet * 0.5)
    setInsurance(false)

    // Check if dealer has blackjack
    const dealerValue = calculateHandValue([...dealerHand.map((c) => ({ ...c, hidden: false }))])
    if (dealerValue.value === 21) {
      updateBalance(bet * 1.5) // Insurance pays 2:1
      setMessage("Insurance wins!")
    }
  }

  const dealerPlay = () => {
    setGameState("dealer")
    setDealerRevealed(true)

    let currentDealerHand = [...dealerHand.map((c) => ({ ...c, hidden: false }))]
    setDealerHand(currentDealerHand)

    const dealerTurn = () => {
      const dealerValue = calculateHandValue(currentDealerHand)

      if (dealerValue.value < 17 || (dealerValue.value === 17 && dealerValue.soft)) {
        setTimeout(() => {
          const newCard = dealCard()
          currentDealerHand = [...currentDealerHand, newCard]
          setDealerHand([...currentDealerHand])
          dealerTurn()
        }, 1000)
      } else {
        finishGame()
      }
    }

    setTimeout(dealerTurn, 1000)
  }

  const finishGame = () => {
    setGameState("finished")

    const dealerValue = calculateHandValue(dealerHand.map((c) => ({ ...c, hidden: false }))).value
    let totalWin = 0
    const results: string[] = []

    playerHands.forEach((hand, index) => {
      if (handResults[index]) {
        results[index] = handResults[index]
        return
      }

      const playerValue = calculateHandValue(hand).value

      if (playerValue > 21) {
        results[index] = "bust"
      } else if (dealerValue > 21) {
        results[index] = "win"
        totalWin += bet * 2
      } else if (playerValue > dealerValue) {
        results[index] = "win"
        totalWin += bet * 2
      } else if (playerValue < dealerValue) {
        results[index] = "lose"
      } else {
        results[index] = "push"
        totalWin += bet
      }
    })

    setHandResults(results)

    if (totalWin > 0) {
      updateBalance(totalWin)
    }

    // Set result message
    const wins = results.filter((r) => r === "win" || r === "blackjack").length
    const losses = results.filter((r) => r === "lose" || r === "bust").length
    const pushes = results.filter((r) => r === "push").length

    if (wins > losses) {
      setMessage("You win!")
    } else if (losses > wins) {
      setMessage("Dealer wins")
    } else {
      setMessage("Push")
    }

    addGameResult({
      game: "Blackjack",
      bet: bet * playerHands.length,
      win: totalWin,
      details: { hands: playerHands.length, results },
    })
  }

  const newGame = () => {
    setPlayerHands([[]])
    setDealerHand([])
    setCurrentHand(0)
    setGameState("betting")
    setMessage("")
    setHandResults([])
    setCanDouble(false)
    setCanSplit(false)
    setCanSurrender(false)
    setInsurance(false)
    setDealerRevealed(false)
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

  const currentHandValue = playerHands[currentHand]
    ? calculateHandValue(playerHands[currentHand])
    : { value: 0, soft: false }
  const dealerValue = calculateHandValue(dealerHand.filter((c) => !c.hidden))
  const trueCount = Math.round(cardCount / Math.max(1, (deckPenetration / 100) * 6))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
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
          <h1 className="text-5xl font-orbitron font-bold text-white mb-4">🃏 EVOLUTION BLACKJACK</h1>
          <div className="flex justify-center gap-4 flex-wrap">
            <Badge className="bg-blue-600 text-white">6 Decks</Badge>
            <Badge className="bg-green-600 text-white">3:2 Blackjack</Badge>
            <Badge className="bg-purple-600 text-white">Dealer Stands Soft 17</Badge>
            <Badge className="bg-yellow-600 text-black">
              Count: {trueCount > 0 ? "+" : ""}
              {trueCount}
            </Badge>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Game Table */}
          <Card className="casino-card border-4 border-yellow-400 text-white mb-6">
            <CardContent className="p-8">
              {/* Dealer Hand */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">DEALER</h3>
                  <Badge className="bg-red-500 text-white text-xl px-4 py-2">
                    {dealerRevealed ? dealerValue.value : dealerValue.value}
                    {dealerRevealed && dealerValue.soft && dealerValue.value <= 21 ? " (Soft)" : ""}
                  </Badge>
                </div>
                <div className="flex gap-2 justify-center min-h-[120px] items-center">
                  {dealerHand.map((card, index) => (
                    <div
                      key={index}
                      className={`w-20 h-28 rounded-lg border-2 border-white flex flex-col items-center justify-center text-lg font-bold transition-transform duration-500 ${
                        card.hidden
                          ? "bg-blue-800 text-white"
                          : card.suit === "♥️" || card.suit === "♦️"
                            ? "bg-white text-red-500"
                            : "bg-white text-black"
                      } ${!card.hidden ? "hover:scale-105" : ""}`}
                    >
                      {card.hidden ? (
                        <div className="text-2xl">🂠</div>
                      ) : (
                        <>
                          <div>{card.rank}</div>
                          <div className="text-2xl">{card.suit}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Insurance Offer */}
              {insurance && (
                <div className="text-center mb-6">
                  <div className="bg-yellow-500 text-black p-4 rounded-lg inline-block">
                    <div className="font-bold mb-2">INSURANCE?</div>
                    <div className="flex gap-2">
                      <Button onClick={buyInsurance} className="bg-green-600 hover:bg-green-700">
                        YES (${(bet * 0.5).toFixed(2)})
                      </Button>
                      <Button onClick={() => setInsurance(false)} className="bg-red-600 hover:bg-red-700">
                        NO
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className="text-center mb-6">
                  <Badge
                    className={`text-xl px-6 py-2 ${
                      message.includes("win") || message.includes("Blackjack")
                        ? "bg-green-500"
                        : message.includes("lose") || message.includes("Bust")
                          ? "bg-red-500"
                          : "bg-yellow-500 text-black"
                    }`}
                  >
                    {message}
                  </Badge>
                </div>
              )}

              {/* Player Hands */}
              <div className="space-y-6">
                {playerHands.map((hand, handIndex) => (
                  <div
                    key={handIndex}
                    className={`${handIndex === currentHand && gameState === "playing" ? "ring-2 ring-yellow-400 rounded-lg p-4" : ""}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold">
                        HAND {handIndex + 1}
                        {handIndex === currentHand && gameState === "playing" && (
                          <span className="text-yellow-400 ml-2">← ACTIVE</span>
                        )}
                      </h3>
                      <div className="flex gap-2">
                        <Badge className="bg-blue-500 text-white text-xl px-4 py-2">
                          {calculateHandValue(hand).value}
                          {calculateHandValue(hand).soft && calculateHandValue(hand).value <= 21 ? " (Soft)" : ""}
                        </Badge>
                        {handResults[handIndex] && (
                          <Badge
                            className={`text-white text-lg px-3 py-1 ${
                              handResults[handIndex] === "win" || handResults[handIndex] === "blackjack"
                                ? "bg-green-500"
                                : handResults[handIndex] === "lose" || handResults[handIndex] === "bust"
                                  ? "bg-red-500"
                                  : "bg-yellow-500 text-black"
                            }`}
                          >
                            {handResults[handIndex].toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      {hand.map((card, cardIndex) => (
                        <div
                          key={cardIndex}
                          className={`w-20 h-28 rounded-lg border-2 border-white flex flex-col items-center justify-center text-lg font-bold hover:scale-105 transition-transform ${
                            card.suit === "♥️" || card.suit === "♦️" ? "bg-white text-red-500" : "bg-white text-black"
                          }`}
                        >
                          <div>{card.rank}</div>
                          <div className="text-2xl">{card.suit}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="casino-card text-white">
              <CardHeader>
                <CardTitle className="text-yellow-400">GAME CONTROLS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameState === "betting" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bet Amount</label>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setBet(Math.max(5, bet - 5))}
                          size="sm"
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={bet}
                          onChange={(e) => setBet(Math.max(5, Number.parseInt(e.target.value) || 5))}
                          className="bg-white/10 border-white/20 text-white text-center"
                          min="5"
                          max={user.balance}
                        />
                        <Button
                          onClick={() => setBet(Math.min(user.balance, bet + 5))}
                          size="sm"
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={startGame}
                      className="w-full bg-yellow-500 text-black hover:bg-yellow-600 text-xl py-6"
                      disabled={user.balance < bet}
                    >
                      <Play className="w-6 h-6 mr-2" />
                      DEAL - ${bet}
                    </Button>
                  </>
                )}

                {gameState === "playing" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={hit} className="bg-green-600 hover:bg-green-700">
                        HIT
                      </Button>
                      <Button onClick={stand} className="bg-red-600 hover:bg-red-700">
                        STAND
                      </Button>
                    </div>

                    {canDouble && (
                      <Button
                        onClick={doubleDown}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={user.balance < bet}
                      >
                        DOUBLE DOWN
                      </Button>
                    )}

                    {canSplit && (
                      <Button
                        onClick={split}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={user.balance < bet}
                      >
                        <Split className="w-4 h-4 mr-2" />
                        SPLIT
                      </Button>
                    )}

                    {canSurrender && (
                      <Button onClick={surrender} className="w-full bg-orange-600 hover:bg-orange-700">
                        <Shield className="w-4 h-4 mr-2" />
                        SURRENDER
                      </Button>
                    )}
                  </div>
                )}

                {gameState === "finished" && (
                  <Button onClick={newGame} className="w-full bg-green-600 hover:bg-green-700 text-xl py-6">
                    NEW GAME
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="casino-card text-white">
              <CardHeader>
                <CardTitle className="text-yellow-400">GAME INFO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Balance:</span>
                  <span className="font-bold text-yellow-400">${user.balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Bet:</span>
                  <span className="font-bold">${bet}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deck Penetration:</span>
                  <span className="font-bold">{deckPenetration.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Running Count:</span>
                  <span className="font-bold">
                    {cardCount > 0 ? "+" : ""}
                    {cardCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>True Count:</span>
                  <span className="font-bold">
                    {trueCount > 0 ? "+" : ""}
                    {trueCount}
                  </span>
                </div>

                <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
                  <h4 className="font-bold mb-2">Basic Strategy Tips:</h4>
                  <ul className="text-sm space-y-1 text-blue-200">
                    <li>• Always split Aces and 8s</li>
                    <li>• Never split 5s and 10s</li>
                    <li>• Double on 11 vs dealer 2-10</li>
                    <li>• Hit soft 17, stand hard 17+</li>
                    <li>• Insurance is generally bad bet</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
