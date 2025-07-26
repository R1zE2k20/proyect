"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Gamepad2, TrendingUp, Users } from "lucide-react"

export default function GamesPage() {
  const { user } = useAuth()

  const games = [
    {
      id: "slots",
      name: "Máquinas Tragamonedas",
      description: "Gira y gana con nuestras máquinas de última generación",
      icon: "🎰",
      minBet: 10,
      maxBet: 10000,
      players: 1247,
      jackpot: 125000,
      color: "from-red-600 to-red-800",
    },
    {
      id: "lightning-roulette",
      name: "XXXtreme Lightning Roulette",
      description: "Ruleta europea con multiplicadores Lightning hasta 500x",
      icon: "⚡",
      minBet: 25,
      maxBet: 50000,
      players: 892,
      jackpot: null,
      color: "from-yellow-600 to-orange-800",
    },
    {
      id: "roulette",
      name: "Ruleta Europea",
      description: "La clásica ruleta con las mejores probabilidades",
      icon: "🎯",
      minBet: 25,
      maxBet: 50000,
      players: 634,
      jackpot: null,
      color: "from-green-600 to-green-800",
    },
    {
      id: "blackjack",
      name: "Blackjack",
      description: "Vence al dealer sin pasarte de 21",
      icon: "🃏",
      minBet: 50,
      maxBet: 25000,
      players: 423,
      jackpot: null,
      color: "from-blue-600 to-blue-800",
    },
    {
      id: "crash",
      name: "Crash Game",
      description: "Retira antes del crash y multiplica",
      icon: "🚀",
      minBet: 10,
      maxBet: 50000,
      players: 1156,
      jackpot: null,
      color: "from-yellow-600 to-yellow-800",
    },
    {
      id: "plinko",
      name: "Plinko",
      description: "Deja caer la bola y observa cómo rebota hacia la fortuna",
      icon: "🟡",
      minBet: 10,
      maxBet: 5000,
      players: 789,
      jackpot: null,
      color: "from-orange-600 to-red-800",
    },
    {
      id: "dice",
      name: "Dice Game",
      description: "Predice si el resultado será mayor o menor",
      icon: "🎲",
      minBet: 1,
      maxBet: 100000,
      players: 567,
      jackpot: null,
      color: "from-purple-600 to-pink-800",
    },
    {
      id: "mines",
      name: "Mines",
      description: "Encuentra las gemas, evita las minas",
      icon: "💣",
      minBet: 10,
      maxBet: 10000,
      players: 445,
      jackpot: null,
      color: "from-gray-600 to-gray-800",
    },
    {
      id: "hi-lo",
      name: "Hi-Lo Cards",
      description: "Adivina si la próxima carta será mayor o menor",
      icon: "🧠",
      minBet: 10,
      maxBet: 5000,
      players: 334,
      jackpot: null,
      color: "from-indigo-600 to-purple-800",
    },
    {
      id: "keno",
      name: "Keno",
      description: "Elige tus números de la suerte del 1 al 80",
      icon: "🔢",
      minBet: 10,
      maxBet: 1000,
      players: 345,
      jackpot: 75000,
      color: "from-pink-600 to-pink-800",
    },
    {
      id: "wheel-fortune",
      name: "Wheel of Fortune",
      description: "Gira la rueda de la fortuna y gana grandes premios",
      icon: "🎯",
      minBet: 25,
      maxBet: 2500,
      players: 278,
      jackpot: null,
      color: "from-cyan-600 to-blue-800",
    },
    {
      id: "color-game",
      name: "Color Game",
      description: "Apuesta a rojo, verde o azul - Juego rápido",
      icon: "🎱",
      minBet: 5,
      maxBet: 1000,
      players: 456,
      jackpot: null,
      color: "from-emerald-600 to-teal-800",
    },
    {
      id: "coin-flip",
      name: "Coin Flip",
      description: "Cara o cruz - El juego más simple y rápido",
      icon: "🎇",
      minBet: 1,
      maxBet: 10000,
      players: 623,
      jackpot: null,
      color: "from-amber-600 to-yellow-800",
    },
    {
      id: "limbo",
      name: "Limbo",
      description: "Elige tu multiplicador objetivo y cruza los dedos",
      icon: "🧮",
      minBet: 1,
      maxBet: 50000,
      players: 389,
      jackpot: null,
      color: "from-violet-600 to-purple-800",
    },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Inicia sesión para jugar</h1>
          <Link href="/login">
            <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-600">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            <Gamepad2 className="inline w-12 h-12 mr-4" />
            Sala de Juegos
          </h1>
          <p className="text-xl text-gray-300">Elige tu juego favorito y comienza a ganar</p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-8 mb-12">
          {games.map((game) => (
            <Card
              key={game.id}
              className={`bg-gradient-to-br ${game.color} border-0 text-white hover:scale-105 transition-transform`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl flex items-center">
                      <span className="text-3xl mr-2">{game.icon}</span>
                      {game.name}
                    </CardTitle>
                    <CardDescription className="text-white/80 mt-2">{game.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-white/20">
                    <Users className="w-3 h-3 mr-1" />
                    {game.players}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Apuesta mínima:</span>
                    <span className="font-bold">${game.minBet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Apuesta máxima:</span>
                    <span className="font-bold">${game.maxBet.toLocaleString()}</span>
                  </div>
                  {game.jackpot && (
                    <div className="flex justify-between">
                      <span>Jackpot:</span>
                      <span className="font-bold text-yellow-300">
                        <TrendingUp className="inline w-4 h-4 mr-1" />${game.jackpot.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <Link href={`/games/${game.id}`}>
                  <Button className="w-full bg-white/20 hover:bg-white/30 border border-white/30">Jugar Ahora</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Estadísticas del jugador */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Tus Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">${user.balance.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Saldo Actual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{user.gameHistory.length}</div>
                <div className="text-sm text-gray-300">Juegos Jugados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {user.gameHistory.filter((g) => g.win > g.bet).length}
                </div>
                <div className="text-sm text-gray-300">Victorias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  ${user.gameHistory.reduce((acc, g) => acc + (g.win - g.bet), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Ganancia Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
