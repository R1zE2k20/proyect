"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, RotateCcw } from "lucide-react"
import Link from "next/link"

const KENO_PAYOUTS = {
  1: { 1: 3 },
  2: { 2: 12 },
  3: { 2: 2, 3: 42 },
  4: { 2: 1, 3: 4, 4: 100 },
  5: { 3: 2, 4: 12, 5: 800 },
  6: { 3: 1, 4: 3, 5: 23, 6: 1600 },
  7: { 4: 2, 5: 6, 6: 100, 7: 7000 },
  8: { 5: 2, 6: 12, 7: 500, 8: 25000 },
  9: { 5: 1, 6: 4, 7: 40, 8: 2000, 9: 40000 },
  10: { 5: 1, 6: 2, 7: 12, 8: 200, 9: 4000, 10: 100000 },
}

export default function KenoPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [bet, setBet] = useState(100)
  const [gameState, setGameState] = useState<"selecting" | "drawing" | "finished">("selecting")
  const [matches, setMatches] = useState(0)
  const [winAmount, setWinAmount] = useState(0)
  const [drawingAnimation, setDrawingAnimation] = useState<number[]>([])

  const selectNumber = (number: number) => {
    if (gameState !== "selecting") return

    if (selectedNumbers.includes(number)) {
      setSelectedNumbers((prev) => prev.filter((n) => n !== number))
    } else if (selectedNumbers.length < 10) {
      setSelectedNumbers((prev) => [...prev, number])
    }
  }

  const clearSelection = () => {
    if (gameState !== "selecting") return
    setSelectedNumbers([])
  }

  const quickPick = () => {
    if (gameState !== "selecting") return

    const numbers: number[] = []
    while (numbers.length < 10) {
      const num = Math.floor(Math.random() * 80) + 1
      if (!numbers.includes(num)) {
        numbers.push(num)
      }
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b))
  }

  const playGame = async () => {
    if (gameState !== "selecting" || selectedNumbers.length === 0 || !user || user.balance < bet) return

    updateBalance(-bet)
    setGameState("drawing")
    setDrawnNumbers([])
    setDrawingAnimation([])
    setMatches(0)
    setWinAmount(0)

    // Generar números ganadores
    const winningNumbers: number[] = []
    while (winningNumbers.length < 20) {
      const num = Math.floor(Math.random() * 80) + 1
      if (!winningNumbers.includes(num)) {
        winningNumbers.push(num)
      }
    }

    // Animación de sorteo
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setDrawingAnimation((prev) => [...prev, winningNumbers[i]])
    }

    setDrawnNumbers(winningNumbers)

    // Calcular coincidencias
    const matchCount = selectedNumbers.filter((num) => winningNumbers.includes(num)).length
    setMatches(matchCount)

    // Calcular ganancia
    const spots = selectedNumbers.length
    const payoutTable = KENO_PAYOUTS[spots as keyof typeof KENO_PAYOUTS]
    const multiplier = payoutTable?.[matchCount as keyof typeof payoutTable] || 0
    const prize = bet * multiplier

    setWinAmount(prize)
    if (prize > 0) {
      updateBalance(prize)
    }

    addGameResult({
      game: "Keno",
      bet,
      win: prize,
    })

    setGameState("finished")
  }

  const newGame = () => {
    setSelectedNumbers([])
    setDrawnNumbers([])
    setDrawingAnimation([])
    setGameState("selecting")
    setMatches(0)
    setWinAmount(0)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900">
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
          <h1 className="text-5xl font-bold text-white mb-4">🔢 Keno</h1>
          <p className="text-xl text-gray-300">Elige tus números de la suerte</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Tablero principal */}
            <div className="lg:col-span-3">
              <Card className="bg-gradient-to-br from-pink-600 to-purple-800 border-4 border-yellow-400 text-white mb-6">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">Selecciona del 1 al 80 (máximo 10 números)</CardTitle>
                  <div className="text-center">
                    <Badge className="bg-yellow-500 text-black text-lg px-4 py-2">
                      Seleccionados: {selectedNumbers.length}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-10 gap-2 mb-6">
                    {Array.from({ length: 80 }, (_, i) => i + 1).map((number) => {
                      const isSelected = selectedNumbers.includes(number)
                      const isDrawn = drawnNumbers.includes(number) || drawingAnimation.includes(number)
                      const isMatch = isSelected && isDrawn

                      return (
                        <button
                          key={number}
                          onClick={() => selectNumber(number)}
                          className={`
                            w-12 h-12 rounded-lg border-2 font-bold text-sm transition-all duration-200
                            ${
                              isMatch
                                ? "bg-green-500 border-green-300 text-white animate-pulse"
                                : isSelected
                                  ? "bg-yellow-500 border-yellow-300 text-black"
                                  : isDrawn
                                    ? "bg-red-500 border-red-300 text-white"
                                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                            }
                          `}
                          disabled={gameState !== "selecting"}
                        >
                          {number}
                        </button>
                      )
                    })}
                  </div>

                  {/* Controles */}
                  <div className="flex gap-4 justify-center flex-wrap">
                    {gameState === "selecting" && (
                      <>
                        <Button
                          onClick={clearSelection}
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-black bg-transparent"
                          disabled={selectedNumbers.length === 0}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Limpiar
                        </Button>
                        <Button onClick={quickPick} className="bg-purple-600 hover:bg-purple-700">
                          Selección Rápida
                        </Button>
                        <div className="flex items-center gap-2">
                          <label className="text-white">Apuesta:</label>
                          <Input
                            type="number"
                            value={bet}
                            onChange={(e) => setBet(Math.max(10, Number.parseInt(e.target.value) || 10))}
                            className="bg-white/10 border-white/20 text-white w-24"
                            min="10"
                            max={user.balance}
                          />
                        </div>
                        <Button
                          onClick={playGame}
                          className="bg-green-600 hover:bg-green-700 text-xl px-8 py-3"
                          disabled={selectedNumbers.length === 0 || user.balance < bet}
                        >
                          <Play className="w-6 h-6 mr-2" />
                          JUGAR ${bet}
                        </Button>
                      </>
                    )}

                    {gameState === "drawing" && (
                      <div className="text-center">
                        <Badge className="bg-blue-500 text-white text-xl px-6 py-3 animate-pulse">
                          Sorteando números... {drawingAnimation.length}/20
                        </Badge>
                      </div>
                    )}

                    {gameState === "finished" && (
                      <div className="text-center space-y-4">
                        <div className="space-y-2">
                          <Badge className="bg-yellow-500 text-black text-xl px-6 py-3">
                            Coincidencias: {matches}/{selectedNumbers.length}
                          </Badge>
                          {winAmount > 0 ? (
                            <Badge className="bg-green-500 text-white text-2xl px-8 py-4">
                              ¡GANASTE ${winAmount.toLocaleString()}!
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500 text-white text-xl px-6 py-3">Sin premio esta vez</Badge>
                          )}
                        </div>
                        <Button onClick={newGame} className="bg-blue-600 hover:bg-blue-700 text-xl px-8 py-3">
                          NUEVO JUEGO
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Números sorteados */}
              {(drawnNumbers.length > 0 || drawingAnimation.length > 0) && (
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Números Sorteados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(drawnNumbers.length > 0 ? drawnNumbers : drawingAnimation)
                        .sort((a, b) => a - b)
                        .map((number) => (
                          <Badge
                            key={number}
                            className={`text-lg px-3 py-2 ${
                              selectedNumbers.includes(number) ? "bg-green-500 text-white" : "bg-red-500 text-white"
                            }`}
                          >
                            {number}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                    <span>Apuesta:</span>
                    <span className="font-bold">${bet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Números elegidos:</span>
                    <span className="font-bold">{selectedNumbers.length}</span>
                  </div>
                  {gameState === "finished" && (
                    <>
                      <div className="flex justify-between">
                        <span>Coincidencias:</span>
                        <span className="font-bold text-green-400">{matches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Premio:</span>
                        <span className="font-bold text-yellow-400">${winAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Tus números */}
              {selectedNumbers.length > 0 && (
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Tus Números</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedNumbers
                        .sort((a, b) => a - b)
                        .map((number) => (
                          <Badge
                            key={number}
                            className={`text-lg px-3 py-2 ${
                              drawnNumbers.includes(number) || drawingAnimation.includes(number)
                                ? "bg-green-500 text-white"
                                : "bg-yellow-500 text-black"
                            }`}
                          >
                            {number}
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabla de pagos */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Tabla de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-1">
                    <div className="font-bold border-b border-white/20 pb-1 mb-2">
                      Spots: {selectedNumbers.length || 1}
                    </div>
                    {selectedNumbers.length > 0 &&
                      KENO_PAYOUTS[selectedNumbers.length as keyof typeof KENO_PAYOUTS] &&
                      Object.entries(KENO_PAYOUTS[selectedNumbers.length as keyof typeof KENO_PAYOUTS]).map(
                        ([hits, payout]) => (
                          <div key={hits} className="flex justify-between">
                            <span>{hits} aciertos:</span>
                            <span className="text-yellow-400">{payout}:1</span>
                          </div>
                        ),
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Reglas */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Cómo Jugar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-gray-300">
                    <li>• Elige de 1 a 10 números del 1 al 80</li>
                    <li>• Se sortean 20 números al azar</li>
                    <li>• Ganas según tus aciertos</li>
                    <li>• Más números = mayores premios</li>
                    <li>• Usa "Selección Rápida" para elegir automáticamente</li>
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
