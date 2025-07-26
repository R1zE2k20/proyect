"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Play, DollarSign, Bomb, Gem } from "lucide-react"
import Link from "next/link"

interface Cell {
  id: number
  revealed: boolean
  isMine: boolean
  isGem: boolean
}

interface GameState {
  board: Cell[]
  gameActive: boolean
  gameWon: boolean
  gameLost: boolean
  currentMultiplier: number
  gemsFound: number
}

export default function MinesPage() {
  const { user, updateBalance, addGameResult } = useAuth()
  const [bet, setBet] = useState(100)
  const [mineCount, setMineCount] = useState(3)
  const [boardSize] = useState(25) // 5x5 grid
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    gameActive: false,
    gameWon: false,
    gameLost: false,
    currentMultiplier: 1,
    gemsFound: 0,
  })
  const [gameHistory, setGameHistory] = useState<
    {
      bet: number
      mines: number
      gemsFound: number
      payout: number
      multiplier: number
    }[]
  >([])
  const [statistics, setStatistics] = useState({
    totalGames: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0,
    bestMultiplier: 0,
    averageGemsFound: 0,
  })

  // Calculate multipliers based on mines and gems found
  const calculateMultiplier = (gemsFound: number, totalMines: number) => {
    if (gemsFound === 0) return 1

    const totalCells = boardSize
    const safeCells = totalCells - totalMines
    let multiplier = 1

    for (let i = 0; i < gemsFound; i++) {
      const remaining = safeCells - i
      const total = totalCells - i
      multiplier *= total / remaining
    }

    return multiplier * 0.97 // 3% house edge
  }

  const initializeBoard = () => {
    const newBoard: Cell[] = Array.from({ length: boardSize }, (_, index) => ({
      id: index,
      revealed: false,
      isMine: false,
      isGem: false,
    }))

    // Place mines randomly
    const minePositions = new Set<number>()
    while (minePositions.size < mineCount) {
      const position = Math.floor(Math.random() * boardSize)
      minePositions.add(position)
    }

    // Set mines and gems
    newBoard.forEach((cell, index) => {
      if (minePositions.has(index)) {
        cell.isMine = true
      } else {
        cell.isGem = true
      }
    })

    return newBoard
  }

  const startGame = () => {
    if (!user || user.balance < bet) return

    updateBalance(-bet)

    const newBoard = initializeBoard()
    setGameState({
      board: newBoard,
      gameActive: true,
      gameWon: false,
      gameLost: false,
      currentMultiplier: 1,
      gemsFound: 0,
    })

    setStatistics((prev) => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      totalWagered: prev.totalWagered + bet,
    }))
  }

  const revealCell = (cellId: number) => {
    if (!gameState.gameActive || gameState.board[cellId].revealed) return

    const newBoard = [...gameState.board]
    const cell = newBoard[cellId]
    cell.revealed = true

    if (cell.isMine) {
      // Game over - hit a mine
      setGameState((prev) => ({
        ...prev,
        board: newBoard.map((c) => ({ ...c, revealed: true })), // Reveal all cells
        gameActive: false,
        gameLost: true,
      }))

      // Add to history
      setGameHistory((prev) => [
        {
          bet,
          mines: mineCount,
          gemsFound: gameState.gemsFound,
          payout: 0,
          multiplier: 0,
        },
        ...prev.slice(0, 9),
      ])

      // Record game result
      addGameResult({
        game: "Mines",
        bet,
        win: 0,
        details: { mines: mineCount, gemsFound: gameState.gemsFound },
      })
    } else {
      // Found a gem
      const newGemsFound = gameState.gemsFound + 1
      const newMultiplier = calculateMultiplier(newGemsFound, mineCount)

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        gemsFound: newGemsFound,
        currentMultiplier: newMultiplier,
      }))

      // Check if all gems found (won the game)
      const totalGems = boardSize - mineCount
      if (newGemsFound === totalGems) {
        const finalPayout = bet * newMultiplier
        updateBalance(finalPayout)

        setGameState((prev) => ({
          ...prev,
          gameActive: false,
          gameWon: true,
        }))

        // Update statistics
        setStatistics((prev) => ({
          ...prev,
          totalWon: prev.totalWon + finalPayout,
          biggestWin: Math.max(prev.biggestWin, finalPayout),
          bestMultiplier: Math.max(prev.bestMultiplier, newMultiplier),
          averageGemsFound: (prev.averageGemsFound * (prev.totalGames - 1) + newGemsFound) / prev.totalGames,
        }))

        // Add to history
        setGameHistory((prev) => [
          {
            bet,
            mines: mineCount,
            gemsFound: newGemsFound,
            payout: finalPayout,
            multiplier: newMultiplier,
          },
          ...prev.slice(0, 9),
        ])

        // Record game result
        addGameResult({
          game: "Mines",
          bet,
          win: finalPayout,
          multiplier: newMultiplier,
          details: { mines: mineCount, gemsFound: newGemsFound },
        })
      }
    }
  }

  const cashOut = () => {
    if (!gameState.gameActive || gameState.gemsFound === 0) return

    const payout = bet * gameState.currentMultiplier
    updateBalance(payout)

    setGameState((prev) => ({
      ...prev,
      gameActive: false,
      gameWon: true,
    }))

    // Update statistics
    setStatistics((prev) => ({
      ...prev,
      totalWon: prev.totalWon + payout,
      biggestWin: Math.max(prev.biggestWin, payout),
      bestMultiplier: Math.max(prev.bestMultiplier, gameState.currentMultiplier),
      averageGemsFound: (prev.averageGemsFound * (prev.totalGames - 1) + gameState.gemsFound) / prev.totalGames,
    }))

    // Add to history
    setGameHistory((prev) => [
      {
        bet,
        mines: mineCount,
        gemsFound: gameState.gemsFound,
        payout,
        multiplier: gameState.currentMultiplier,
      },
      ...prev.slice(0, 9),
    ])

    // Record game result
    addGameResult({
      game: "Mines",
      bet,
      win: payout,
      multiplier: gameState.currentMultiplier,
      details: { mines: mineCount, gemsFound: gameState.gemsFound, cashedOut: true },
    })
  }

  const resetGame = () => {
    setGameState({
      board: [],
      gameActive: false,
      gameWon: false,
      gameLost: false,
      currentMultiplier: 1,
      gemsFound: 0,
    })
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

  const nextMultiplier = gameState.gameActive ? calculateMultiplier(gameState.gemsFound + 1, mineCount) : 1

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
          <h1 className="text-6xl font-bold text-white mb-4">💣 MINES</h1>
          <p className="text-xl text-gray-300">Find the gems, avoid the mines!</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Game Board */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-2 border-yellow-400">
                <CardContent className="p-6">
                  {/* Game Status */}
                  <div className="text-center mb-6">
                    {gameState.gameActive && (
                      <div className="space-y-2">
                        <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                          GAME ACTIVE - {gameState.gemsFound} gems found
                        </Badge>
                        <div className="text-2xl font-bold text-yellow-400">
                          Current: {gameState.currentMultiplier.toFixed(4)}x
                        </div>
                        {gameState.gemsFound > 0 && (
                          <div className="text-lg text-green-400">Next: {nextMultiplier.toFixed(4)}x</div>
                        )}
                      </div>
                    )}

                    {gameState.gameWon && (
                      <Badge className="bg-green-500 text-white text-2xl px-6 py-3">🎉 YOU WON! 🎉</Badge>
                    )}

                    {gameState.gameLost && (
                      <Badge className="bg-red-500 text-white text-2xl px-6 py-3">💥 BOOM! GAME OVER 💥</Badge>
                    )}
                  </div>

                  {/* Game Board */}
                  <div className="grid grid-cols-5 gap-2 max-w-md mx-auto mb-6">
                    {gameState.board.map((cell) => (
                      <button
                        key={cell.id}
                        onClick={() => revealCell(cell.id)}
                        disabled={!gameState.gameActive || cell.revealed}
                        className={`
                          aspect-square rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200
                          ${
                            cell.revealed
                              ? cell.isMine
                                ? "bg-red-500 border-red-400"
                                : "bg-green-500 border-green-400"
                              : "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                          }
                          ${!gameState.gameActive && !cell.revealed ? "opacity-50" : ""}
                        `}
                      >
                        {cell.revealed ? cell.isMine ? <Bomb className="w-6 h-6" /> : <Gem className="w-6 h-6" /> : ""}
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center">
                    {!gameState.gameActive && !gameState.gameWon && !gameState.gameLost && (
                      <Button
                        onClick={startGame}
                        disabled={user.balance < bet}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-8 py-4"
                      >
                        <Play className="w-6 h-6 mr-2" />
                        START GAME - ${bet}
                      </Button>
                    )}

                    {gameState.gameActive && gameState.gemsFound > 0 && (
                      <Button
                        onClick={cashOut}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-8 py-4"
                      >
                        <DollarSign className="w-6 h-6 mr-2" />
                        CASH OUT ${(bet * gameState.currentMultiplier).toFixed(2)}
                      </Button>
                    )}

                    {(gameState.gameWon || gameState.gameLost) && (
                      <Button
                        onClick={resetGame}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-8 py-4"
                      >
                        NEW GAME
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Game Settings */}
              <Card className="bg-gray-900 border border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-yellow-400">GAME SETTINGS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bet Amount</label>
                    <Input
                      type="number"
                      value={bet}
                      onChange={(e) => setBet(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      min="1"
                      max={user.balance}
                      className="bg-gray-800 border-gray-600 text-white"
                      disabled={gameState.gameActive}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Mines</label>
                    <Select
                      value={mineCount.toString()}
                      onValueChange={(value) => setMineCount(Number.parseInt(value))}
                      disabled={gameState.gameActive}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Mine{num > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-gray-800 rounded">
                    <div className="text-sm text-gray-400 mb-1">Gems to find:</div>
                    <div className="text-lg font-bold text-green-400">{boardSize - mineCount}</div>
                  </div>

                  <div className="p-3 bg-gray-800 rounded">
                    <div className="text-sm text-gray-400 mb-1">Max possible win:</div>
                    <div className="text-lg font-bold text-yellow-400">
                      ${(bet * calculateMultiplier(boardSize - mineCount, mineCount)).toFixed(2)}
                    </div>
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
                    <span>Biggest Win:</span>
                    <span className="text-purple-400">${statistics.biggestWin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Multiplier:</span>
                    <span className="text-orange-400">{statistics.bestMultiplier.toFixed(4)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Gems Found:</span>
                    <span className="text-cyan-400">{statistics.averageGemsFound.toFixed(1)}</span>
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
                          <Badge className={game.payout > 0 ? "bg-green-500" : "bg-red-500"}>{game.mines}💣</Badge>
                          <span className="text-sm">{game.gemsFound}💎</span>
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
