"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, Crown } from "lucide-react"
import Link from "next/link"

interface BaccaratCard {
  suit: string
  value: string
  numValue: number
}

const SUITS = ["♠️", "♥️", "♦️", "♣️"]
const VALUES = [
  { value: "A", numValue: 1 },
  { value: "2", numValue: 2 },
  { value: "3", numValue: 3 },
  { value: "4", numValue: 4 },
  { value: "5", numValue: 5 },
  { value: "6", numValue: 6 },
  { value: "7", numValue: 7 },
  { value: "8", numValue: 8 },
  { value: "9", numValue: 9 },
  { value: "10", numValue: 0 },
  { value: "J", numValue: 0 },
  { value: "Q", numValue: 0 },
  { value: "K", numValue: 0 },
]

export default function BaccaratPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [deck, setDeck] = useState<BaccaratCard[]>([])
  const [playerHand, setPlayerHand] = useState<BaccaratCard[]>([])
  const [bankerHand, setBankerHand] = useState<BaccaratCard[]>([])
  const [bets, setBets] = useState({ player: 0, banker: 0, tie: 0 })
  const [gameState, setGameState] = useState<"betting" | "dealing" | "finished">("betting")
  const [message, setMessage] = useState("")
  const [gameHistory, setGameHistory] = useState<string[]>([])

  useEffect(() => {
    initializeDeck()
    // Generar historial inicial
    const history = Array.from({ length: 20 }, () => {
      const rand = Math.random()
      return rand < 0.45 ? "P" : rand < 0.9 ? "B" : "T"
    })
    setGameHistory(history)
  }, [])

  const initializeDeck = () => {
    const newDeck: BaccaratCard[] = []
    for (let i = 0; i < 8; i++) {
      // 8 mazos
      SUITS.forEach((suit) => {
        VALUES.forEach(({ value, numValue }) => {
          newDeck.push({ suit, value, numValue })
        })
      })
    }
    // Mezclar el mazo
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }
    setDeck(newDeck)
  }

  const calculateHandValue = (hand: BaccaratCard[]) => {
    const total = hand.reduce((sum, card) => sum + card.numValue, 0)
    return total % 10
  }

  const dealCard = (currentDeck: BaccaratCard[]) => {
    if (currentDeck.length === 0) {
      initializeDeck()
      return { card: deck[0], newDeck: deck.slice(1) }
    }
    return { card: currentDeck[0], newDeck: currentDeck.slice(1) }
  }

  const placeBet = (betType: "player" | "banker" | "tie", amount: number) => {
    if (!user || user.balance < amount) return

    setBets((prev) => ({
      ...prev,
      [betType]: prev[betType] + amount,
    }))
    updateBalance(-amount)
  }

  const clearBets = () => {
    const totalBets = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
    setBets({ player: 0, banker: 0, tie: 0 })
    updateBalance(totalBets)
  }

  const deal = async () => {
    if (gameState !== "betting" || Object.values(bets).every((bet) => bet === 0)) return

    setGameState("dealing")
    setMessage("")

    let currentDeck = [...deck]
    const newPlayerHand: BaccaratCard[] = []
    const newBankerHand: BaccaratCard[] = []

    // Repartir cartas iniciales (2 a cada uno)
    for (let i = 0; i < 2; i++) {
      const { card: playerCard, newDeck: deckAfterPlayer } = dealCard(currentDeck)
      newPlayerHand.push(playerCard)
      currentDeck = deckAfterPlayer

      const { card: bankerCard, newDeck: deckAfterBanker } = dealCard(currentDeck)
      newBankerHand.push(bankerCard)
      currentDeck = deckAfterBanker
    }

    setPlayerHand(newPlayerHand)
    setBankerHand(newBankerHand)
    setDeck(currentDeck)

    // Esperar un momento para mostrar las cartas
    setTimeout(() => {
      const playerValue = calculateHandValue(newPlayerHand)
      const bankerValue = calculateHandValue(newBankerHand)

      // Verificar natural (8 o 9)
      if (playerValue >= 8 || bankerValue >= 8) {
        finishGame(newPlayerHand, newBankerHand, currentDeck)
        return
      }

      // Reglas de tercera carta
      const finalPlayerHand = [...newPlayerHand]
      const finalBankerHand = [...newBankerHand]
      let finalDeck = currentDeck

      // Jugador pide tercera carta si tiene 0-5
      if (playerValue <= 5) {
        const { card: playerThirdCard, newDeck: deckAfterPlayerThird } = dealCard(finalDeck)
        finalPlayerHand.push(playerThirdCard)
        finalDeck = deckAfterPlayerThird
        setPlayerHand([...finalPlayerHand])
      }

      setTimeout(() => {
        const playerFinalValue = calculateHandValue(finalPlayerHand)
        const playerThirdCardValue = finalPlayerHand.length === 3 ? finalPlayerHand[2].numValue : null

        // Reglas complejas para la tercera carta del banker
        let bankerDraws = false

        if (bankerValue <= 2) {
          bankerDraws = true
        } else if (bankerValue === 3 && playerThirdCardValue !== 8) {
          bankerDraws = true
        } else if (
          bankerValue === 4 &&
          playerThirdCardValue !== null &&
          [2, 3, 4, 5, 6, 7].includes(playerThirdCardValue)
        ) {
          bankerDraws = true
        } else if (bankerValue === 5 && playerThirdCardValue !== null && [4, 5, 6, 7].includes(playerThirdCardValue)) {
          bankerDraws = true
        } else if (bankerValue === 6 && playerThirdCardValue !== null && [6, 7].includes(playerThirdCardValue)) {
          bankerDraws = true
        } else if (bankerValue <= 5 && finalPlayerHand.length === 2) {
          bankerDraws = true
        }

        if (bankerDraws) {
          const { card: bankerThirdCard, newDeck: deckAfterBankerThird } = dealCard(finalDeck)
          finalBankerHand.push(bankerThirdCard)
          finalDeck = deckAfterBankerThird
          setBankerHand([...finalBankerHand])
        }

        setTimeout(() => {
          finishGame(finalPlayerHand, finalBankerHand, finalDeck)
        }, 1000)
      }, 1000)
    }, 1000)
  }

  const finishGame = (finalPlayerHand: BaccaratCard[], finalBankerHand: BaccaratCard[], finalDeck: BaccaratCard[]) => {
    const playerValue = calculateHandValue(finalPlayerHand)
    const bankerValue = calculateHandValue(finalBankerHand)

    let winner = ""
    let winAmount = 0

    if (playerValue > bankerValue) {
      winner = "P"
      setMessage(`Jugador gana ${playerValue} vs ${bankerValue}`)
      winAmount += bets.player * 2 // 1:1 payout
    } else if (bankerValue > playerValue) {
      winner = "B"
      setMessage(`Banker gana ${bankerValue} vs ${playerValue}`)
      winAmount += bets.banker * 1.95 // 1:1 minus 5% commission
    } else {
      winner = "T"
      setMessage(`Empate ${playerValue} vs ${bankerValue}`)
      winAmount += bets.tie * 9 // 8:1 payout
      winAmount += bets.player + bets.banker // Return player and banker bets on tie
    }

    updateBalance(winAmount)
    setGameHistory((prev) => [winner, ...prev.slice(0, 19)])

    const totalBet = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
    addGameResult({
      game: "Baccarat",
      bet: totalBet,
      win: winAmount,
    })

    setDeck(finalDeck)
    setGameState("finished")
  }

  const newGame = () => {
    setPlayerHand([])
    setBankerHand([])
    setBets({ player: 0, banker: 0, tie: 0 })
    setGameState("betting")
    setMessage("")
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

  const totalBets = Object.values(bets).reduce((sum, bet) => sum + bet, 0)
  const playerValue = calculateHandValue(playerHand)
  const bankerValue = calculateHandValue(bankerHand)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
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
          <h1 className="text-5xl font-bold text-white mb-4">
            <Crown className="inline w-12 h-12 mr-4" />💎 Baccarat
          </h1>
          <p className="text-xl text-gray-300">El juego favorito de los high rollers</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Mesa principal */}
            <div className="lg:col-span-3">
              <Card className="bg-gradient-to-br from-indigo-600 to-purple-800 border-4 border-gold text-white mb-6">
                <CardContent className="p-8">
                  {/* Banker Hand */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold">BANKER</h3>
                      {bankerHand.length > 0 && (
                        <Badge className="bg-red-500 text-white text-xl px-4 py-2">{bankerValue}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center min-h-[120px] items-center">
                      {bankerHand.length === 0 ? (
                        <div className="text-gray-400 text-lg">Esperando cartas...</div>
                      ) : (
                        bankerHand.map((card, index) => (
                          <div
                            key={index}
                            className={`w-20 h-28 rounded-lg border-2 border-white flex flex-col items-center justify-center text-lg font-bold ${
                              card.suit === "♥️" || card.suit === "♦️" ? "bg-white text-red-500" : "bg-white text-black"
                            }`}
                          >
                            <div>{card.value}</div>
                            <div className="text-2xl">{card.suit}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mensaje del juego */}
                  {message && (
                    <div className="text-center mb-6">
                      <Badge className="bg-yellow-500 text-black text-xl px-6 py-2">{message}</Badge>
                    </div>
                  )}

                  {/* Player Hand */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold">PLAYER</h3>
                      {playerHand.length > 0 && (
                        <Badge className="bg-blue-500 text-white text-xl px-4 py-2">{playerValue}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center min-h-[120px] items-center">
                      {playerHand.length === 0 ? (
                        <div className="text-gray-400 text-lg">Esperando cartas...</div>
                      ) : (
                        playerHand.map((card, index) => (
                          <div
                            key={index}
                            className={`w-20 h-28 rounded-lg border-2 border-white flex flex-col items-center justify-center text-lg font-bold ${
                              card.suit === "♥️" || card.suit === "♦️" ? "bg-white text-red-500" : "bg-white text-black"
                            }`}
                          >
                            <div>{card.value}</div>
                            <div className="text-2xl">{card.suit}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Controles de apuesta */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-600/80 border-2 border-blue-400 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">PLAYER</CardTitle>
                    <div className="text-center text-sm">Paga 1:1</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {bets.player > 0 && (
                      <Badge className="w-full justify-center bg-white text-blue-600">${bets.player}</Badge>
                    )}
                    <div className="grid grid-cols-3 gap-1">
                      {[100, 500, 1000].map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => placeBet("player", amount)}
                          className="bg-blue-700 hover:bg-blue-800 text-xs p-2"
                          disabled={gameState !== "betting" || user.balance < amount}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-600/80 border-2 border-yellow-400 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">TIE</CardTitle>
                    <div className="text-center text-sm">Paga 8:1</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {bets.tie > 0 && (
                      <Badge className="w-full justify-center bg-white text-yellow-600">${bets.tie}</Badge>
                    )}
                    <div className="grid grid-cols-3 gap-1">
                      {[50, 250, 500].map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => placeBet("tie", amount)}
                          className="bg-yellow-700 hover:bg-yellow-800 text-xs p-2"
                          disabled={gameState !== "betting" || user.balance < amount}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-600/80 border-2 border-red-400 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">BANKER</CardTitle>
                    <div className="text-center text-sm">Paga 0.95:1</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {bets.banker > 0 && (
                      <Badge className="w-full justify-center bg-white text-red-600">${bets.banker}</Badge>
                    )}
                    <div className="grid grid-cols-3 gap-1">
                      {[100, 500, 1000].map((amount) => (
                        <Button
                          key={amount}
                          onClick={() => placeBet("banker", amount)}
                          className="bg-red-700 hover:bg-red-800 text-xs p-2"
                          disabled={gameState !== "betting" || user.balance < amount}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex gap-4 justify-center">
                {gameState === "betting" && (
                  <>
                    <Button
                      onClick={deal}
                      className="bg-green-600 hover:bg-green-700 text-xl px-8 py-4"
                      disabled={totalBets === 0}
                    >
                      <Play className="w-6 h-6 mr-2" />
                      REPARTIR
                    </Button>
                    <Button
                      onClick={clearBets}
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black bg-transparent px-8 py-4"
                      disabled={totalBets === 0}
                    >
                      LIMPIAR
                    </Button>
                  </>
                )}

                {gameState === "finished" && (
                  <Button onClick={newGame} className="bg-purple-600 hover:bg-purple-700 text-xl px-8 py-4">
                    NUEVA PARTIDA
                  </Button>
                )}
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-4">
              {/* Información del jugador */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Tu Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Saldo:</span>
                    <span className="font-bold text-yellow-400">${user.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total apostado:</span>
                    <span className="font-bold">${totalBets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <Badge className="bg-blue-500 capitalize">
                      {gameState === "betting" ? "Apostando" : gameState === "dealing" ? "Repartiendo" : "Finalizado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Historial */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Historial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-10 gap-1">
                    {gameHistory.map((result, index) => (
                      <Badge
                        key={index}
                        className={`text-center text-xs ${
                          result === "P" ? "bg-blue-500" : result === "B" ? "bg-red-500" : "bg-yellow-500 text-black"
                        }`}
                      >
                        {result}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">P = Player, B = Banker, T = Tie</div>
                </CardContent>
              </Card>

              {/* Reglas */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Reglas Básicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-gray-300">
                    <li>• Objetivo: Llegar lo más cerca de 9</li>
                    <li>• As = 1, 2-9 = valor facial</li>
                    <li>• 10, J, Q, K = 0</li>
                    <li>• Solo cuenta el último dígito</li>
                    <li>• Natural: 8 o 9 con 2 cartas</li>
                    <li>• Banker paga comisión del 5%</li>
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
