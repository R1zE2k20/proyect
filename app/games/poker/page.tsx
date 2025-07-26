"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, Plus, Minus } from "lucide-react"
import Link from "next/link"

interface PokerCard {
  suit: string
  value: string
  numValue: number
}

const SUITS = ["♠️", "♥️", "♦️", "♣️"]
const VALUES = [
  { value: "2", numValue: 2 },
  { value: "3", numValue: 3 },
  { value: "4", numValue: 4 },
  { value: "5", numValue: 5 },
  { value: "6", numValue: 6 },
  { value: "7", numValue: 7 },
  { value: "8", numValue: 8 },
  { value: "9", numValue: 9 },
  { value: "10", numValue: 10 },
  { value: "J", numValue: 11 },
  { value: "Q", numValue: 12 },
  { value: "K", numValue: 13 },
  { value: "A", numValue: 14 },
]

const HAND_RANKINGS = [
  "Carta Alta",
  "Par",
  "Doble Par",
  "Trío",
  "Escalera",
  "Color",
  "Full House",
  "Poker",
  "Escalera Color",
  "Escalera Real",
]

export default function PokerPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [deck, setDeck] = useState<PokerCard[]>([])
  const [playerHand, setPlayerHand] = useState<PokerCard[]>([])
  const [communityCards, setCommunityCards] = useState<PokerCard[]>([])
  const [dealerHand, setDealerHand] = useState<PokerCard[]>([])
  const [bet, setBet] = useState(100)
  const [pot, setPot] = useState(0)
  const [gameState, setGameState] = useState<"betting" | "preflop" | "flop" | "turn" | "river" | "showdown">("betting")
  const [playerAction, setPlayerAction] = useState<"" | "fold" | "call" | "raise">("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    initializeDeck()
  }, [])

  const initializeDeck = () => {
    const newDeck: PokerCard[] = []
    SUITS.forEach((suit) => {
      VALUES.forEach(({ value, numValue }) => {
        newDeck.push({ suit, value, numValue })
      })
    })
    // Mezclar el mazo
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }
    setDeck(newDeck)
  }

  const evaluateHand = (cards: PokerCard[]) => {
    if (cards.length < 5) return { rank: 0, name: "Incompleta" }

    // Ordenar cartas por valor
    const sortedCards = [...cards].sort((a, b) => b.numValue - a.numValue)

    // Verificar flush
    const suits = cards.map((c) => c.suit)
    const isFlush = suits.every((suit) => suit === suits[0])

    // Verificar straight
    const values = sortedCards.map((c) => c.numValue)
    const isStraight = values.every((val, i) => i === 0 || val === values[i - 1] - 1)

    // Contar valores
    const valueCounts: { [key: number]: number } = {}
    values.forEach((val) => {
      valueCounts[val] = (valueCounts[val] || 0) + 1
    })

    const counts = Object.values(valueCounts).sort((a, b) => b - a)

    // Evaluar mano
    if (isStraight && isFlush && values[0] === 14) return { rank: 9, name: "Escalera Real" }
    if (isStraight && isFlush) return { rank: 8, name: "Escalera Color" }
    if (counts[0] === 4) return { rank: 7, name: "Poker" }
    if (counts[0] === 3 && counts[1] === 2) return { rank: 6, name: "Full House" }
    if (isFlush) return { rank: 5, name: "Color" }
    if (isStraight) return { rank: 4, name: "Escalera" }
    if (counts[0] === 3) return { rank: 3, name: "Trío" }
    if (counts[0] === 2 && counts[1] === 2) return { rank: 2, name: "Doble Par" }
    if (counts[0] === 2) return { rank: 1, name: "Par" }

    return { rank: 0, name: "Carta Alta" }
  }

  const dealCard = (currentDeck: PokerCard[]) => {
    if (currentDeck.length === 0) {
      initializeDeck()
      return { card: deck[0], newDeck: deck.slice(1) }
    }
    return { card: currentDeck[0], newDeck: currentDeck.slice(1) }
  }

  const startGame = () => {
    if (!user || user.balance < bet) return

    updateBalance(-bet)
    setPot(bet * 2) // Player + dealer ante
    setGameState("preflop")
    setMessage("")
    setPlayerAction("")

    let currentDeck = [...deck]
    const newPlayerHand: PokerCard[] = []
    const newDealerHand: PokerCard[] = []

    // Repartir 2 cartas a cada jugador
    for (let i = 0; i < 2; i++) {
      const { card: playerCard, newDeck: deckAfterPlayer } = dealCard(currentDeck)
      newPlayerHand.push(playerCard)
      currentDeck = deckAfterPlayer

      const { card: dealerCard, newDeck: deckAfterDealer } = dealCard(currentDeck)
      newDealerHand.push(dealerCard)
      currentDeck = deckAfterDealer
    }

    setPlayerHand(newPlayerHand)
    setDealerHand(newDealerHand)
    setCommunityCards([])
    setDeck(currentDeck)
  }

  const dealCommunityCards = (count: number) => {
    let currentDeck = [...deck]
    const newCommunityCards = [...communityCards]

    for (let i = 0; i < count; i++) {
      const { card, newDeck } = dealCard(currentDeck)
      newCommunityCards.push(card)
      currentDeck = newDeck
    }

    setCommunityCards(newCommunityCards)
    setDeck(currentDeck)
  }

  const playerCall = () => {
    setPlayerAction("call")
    nextRound()
  }

  const playerFold = () => {
    setPlayerAction("fold")
    setMessage("Te retiraste - Perdiste")
    setGameState("betting")
    setPot(0)

    addGameResult({
      game: "Poker",
      bet,
      win: 0,
    })
  }

  const playerRaise = () => {
    if (user && user.balance >= bet) {
      updateBalance(-bet)
      setPot((prev) => prev + bet)
      setPlayerAction("raise")
      nextRound()
    }
  }

  const nextRound = () => {
    switch (gameState) {
      case "preflop":
        dealCommunityCards(3) // Flop
        setGameState("flop")
        break
      case "flop":
        // Flop
        setGameState("flop")
        break
      case "flop":
        dealCommunityCards(1) // Turn
        setGameState("turn")
        break
      case "turn":
        dealCommunityCards(1) // River
        setGameState("river")
        break
      case "river":
        setGameState("showdown")
        showdown()
        break
    }
  }

  const showdown = () => {
    const playerBestHand = evaluateHand([...playerHand, ...communityCards])
    const dealerBestHand = evaluateHand([...dealerHand, ...communityCards])

    let winAmount = 0
    let resultMessage = ""

    if (playerBestHand.rank > dealerBestHand.rank) {
      resultMessage = `¡Ganaste con ${playerBestHand.name}!`
      winAmount = pot
    } else if (playerBestHand.rank < dealerBestHand.rank) {
      resultMessage = `Dealer gana con ${dealerBestHand.name}`
      winAmount = 0
    } else {
      resultMessage = "Empate"
      winAmount = pot / 2
    }

    setMessage(resultMessage)
    updateBalance(winAmount)
    setPot(0)

    addGameResult({
      game: "Poker",
      bet,
      win: winAmount,
    })

    setTimeout(() => {
      setGameState("betting")
      setPlayerHand([])
      setDealerHand([])
      setCommunityCards([])
      setPlayerAction("")
      initializeDeck()
    }, 5000)
  }

  const newGame = () => {
    setPlayerHand([])
    setDealerHand([])
    setCommunityCards([])
    setGameState("betting")
    setMessage("")
    setPlayerAction("")
    setPot(0)
    initializeDeck()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Inicia sesión para jugar</h1>
        </div>
      </div>
    )
  }

  const playerBestHand =
    playerHand.length > 0 && communityCards.length >= 3 ? evaluateHand([...playerHand, ...communityCards]) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/games">
            <Button variant="ghost" className="text-white hover:text-yellow-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Juegos
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">♠️ Texas Hold'em</h1>
          <p className="text-xl text-gray-300">El poker más popular del mundo</p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mesa de poker */}
          <Card className="bg-gradient-to-br from-green-700 to-green-900 border-4 border-yellow-400 text-white mb-6">
            <CardContent className="p-8">
              {/* Cartas del dealer */}
              <div className="mb-6">
                <div className="flex justify-center items-center mb-4">
                  <h3 className="text-xl font-bold mr-4">Dealer</h3>
                  {gameState === "showdown" && dealerHand.length > 0 && (
                    <Badge className="bg-red-500">{evaluateHand([...dealerHand, ...communityCards]).name}</Badge>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  {dealerHand.map((card, index) => (
                    <div
                      key={index}
                      className={`w-16 h-24 rounded-lg border-2 border-white flex flex-col items-center justify-center text-sm font-bold ${
                        gameState === "showdown"
                          ? card.suit === "♥️" || card.suit === "♦️"
                            ? "bg-white text-red-500"
                            : "bg-white text-black"
                          : "bg-blue-800 text-white"
                      }`}
                    >
                      {gameState === "showdown" ? (
                        <>
                          <div>{card.value}</div>
                          <div className="text-lg">{card.suit}</div>
                        </>
                      ) : (
                        <div className="text-xl">🂠</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cartas comunitarias */}
              {communityCards.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-center mb-4">Mesa</h3>
                  <div className="flex gap-2 justify-center">
                    {communityCards.map((card, index) => (
                      <div
                        key={index}
                        className={`w-16 h-24 rounded-lg border-2 border-yellow-400 flex flex-col items-center justify-center text-sm font-bold ${
                          card.suit === "♥️" || card.suit === "♦️" ? "bg-white text-red-500" : "bg-white text-black"
                        }`}
                      >
                        <div>{card.value}</div>
                        <div className="text-lg">{card.suit}</div>
                      </div>
                    ))}
                    {/* Cartas por revelar */}
                    {Array.from({ length: 5 - communityCards.length }).map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="w-16 h-24 rounded-lg border-2 border-gray-500 border-dashed flex items-center justify-center"
                      >
                        <div className="text-gray-500">?</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pot */}
              {pot > 0 && (
                <div className="text-center mb-6">
                  <Badge className="bg-yellow-500 text-black text-xl px-6 py-2">Pot: ${pot}</Badge>
                </div>
              )}

              {/* Mensaje del juego */}
              {message && (
                <div className="text-center mb-6">
                  <Badge
                    className={`text-xl px-6 py-2 ${
                      message.includes("Ganaste")
                        ? "bg-green-500"
                        : message.includes("Perdiste") || message.includes("Dealer gana")
                          ? "bg-red-500"
                          : "bg-yellow-500 text-black"
                    }`}
                  >
                    {message}
                  </Badge>
                </div>
              )}

              {/* Cartas del jugador */}
              <div>
                <div className="flex justify-center items-center mb-4">
                  <h3 className="text-xl font-bold mr-4">Tu Mano</h3>
                  {playerBestHand && <Badge className="bg-blue-500">{playerBestHand.name}</Badge>}
                </div>
                <div className="flex gap-2 justify-center">
                  {playerHand.map((card, index) => (
                    <div
                      key={index}
                      className={`w-16 h-24 rounded-lg border-2 border-white flex flex-col items-center justify-center text-sm font-bold ${
                        card.suit === "♥️" || card.suit === "♦️" ? "bg-white text-red-500" : "bg-white text-black"
                      }`}
                    >
                      <div>{card.value}</div>
                      <div className="text-lg">{card.suit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle>Controles de Juego</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameState === "betting" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Apuesta Inicial</label>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setBet(Math.max(100, bet - 50))}
                          size="sm"
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={bet}
                          onChange={(e) => setBet(Math.max(100, Number.parseInt(e.target.value) || 100))}
                          className="bg-white/10 border-white/20 text-white text-center"
                          min="100"
                          max={user.balance}
                        />
                        <Button
                          onClick={() => setBet(Math.min(user.balance, bet + 50))}
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
                      REPARTIR - ${bet}
                    </Button>
                  </>
                )}

                {(gameState === "preflop" || gameState === "flop" || gameState === "turn" || gameState === "river") && (
                  <div className="space-y-3">
                    <Button onClick={playerCall} className="w-full bg-green-600 hover:bg-green-700 text-lg py-4">
                      IGUALAR
                    </Button>
                    <Button
                      onClick={playerRaise}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-4"
                      disabled={user.balance < bet}
                    >
                      SUBIR ${bet}
                    </Button>
                    <Button onClick={playerFold} className="w-full bg-red-600 hover:bg-red-700 text-lg py-4">
                      RETIRARSE
                    </Button>
                  </div>
                )}

                {gameState === "showdown" && (
                  <Button onClick={newGame} className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-4">
                    NUEVA PARTIDA
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Saldo:</span>
                  <span className="font-bold text-yellow-400">${user.balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Apuesta:</span>
                  <span className="font-bold">${bet}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pot:</span>
                  <span className="font-bold text-green-400">${pot}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ronda:</span>
                  <Badge className="bg-blue-500 capitalize">
                    {gameState === "betting"
                      ? "Apostando"
                      : gameState === "preflop"
                        ? "Pre-Flop"
                        : gameState === "flop"
                          ? "Flop"
                          : gameState === "turn"
                            ? "Turn"
                            : gameState === "river"
                              ? "River"
                              : "Showdown"}
                  </Badge>
                </div>

                <div className="mt-6 p-4 bg-purple-500/20 rounded-lg">
                  <h4 className="font-bold mb-2">Ranking de Manos:</h4>
                  <div className="text-xs space-y-1 text-purple-200">
                    {HAND_RANKINGS.slice()
                      .reverse()
                      .map((hand, index) => (
                        <div key={hand} className="flex justify-between">
                          <span>{hand}</span>
                          <span className="text-yellow-400">{10 - index}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
