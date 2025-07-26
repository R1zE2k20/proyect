"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, TrendingUp, Users, Shield, Gamepad2, Zap, Crown, Trophy } from "lucide-react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const { user } = useAuth()
  const [cryptoPrices, setCryptoPrices] = useState({
    BTC: 67420,
    ETH: 3850,
    LTC: 195,
    USDT: 1,
  })
  const [jackpotAmount, setJackpotAmount] = useState(2847392)
  const [onlineUsers, setOnlineUsers] = useState(8247)

  useEffect(() => {
    // Simular fluctuaciones de precios de criptomonedas
    const priceInterval = setInterval(() => {
      setCryptoPrices((prev) => ({
        BTC: prev.BTC + (Math.random() - 0.5) * 2000,
        ETH: prev.ETH + (Math.random() - 0.5) * 200,
        LTC: prev.LTC + (Math.random() - 0.5) * 20,
        USDT: 1,
      }))
    }, 3000)

    // Simular incremento del jackpot
    const jackpotInterval = setInterval(() => {
      setJackpotAmount((prev) => prev + Math.floor(Math.random() * 500) + 100)
    }, 2000)

    // Simular usuarios online
    const usersInterval = setInterval(() => {
      setOnlineUsers((prev) => prev + Math.floor(Math.random() * 20) - 10)
    }, 5000)

    return () => {
      clearInterval(priceInterval)
      clearInterval(jackpotInterval)
      clearInterval(usersInterval)
    }
  }, [])

  const featuredGames = [
    {
      id: "slots",
      name: "Mega Slots",
      description: "Jackpots progresivos millonarios",
      icon: "🎰",
      gradient: "from-red-600 via-red-500 to-orange-500",
      players: 2847,
      jackpot: jackpotAmount,
      hot: true,
    },
    {
      id: "roulette",
      name: "European Roulette",
      description: "La ruleta más auténtica",
      icon: "🎯",
      gradient: "from-green-600 via-green-500 to-emerald-500",
      players: 1923,
      jackpot: null,
      hot: false,
    },
    {
      id: "blackjack",
      name: "Blackjack VIP",
      description: "Mesas de alto límite",
      icon: "🃏",
      gradient: "from-blue-600 via-blue-500 to-cyan-500",
      players: 1456,
      jackpot: null,
      hot: false,
    },
    {
      id: "crash",
      name: "Rocket Crash",
      description: "Multiplica hasta 1000x",
      icon: "🚀",
      gradient: "from-yellow-600 via-orange-500 to-red-500",
      players: 3241,
      jackpot: null,
      hot: true,
    },
  ]

  return (
    <div className="min-h-screen dopamine-gradient">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden particle-effect">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center text-white">
            <div className="mb-8">
              <Badge className="bg-red-500 text-white px-4 py-2 text-sm font-rajdhani font-bold animate-pulse mb-4">
                🔥 LIVE NOW - {onlineUsers.toLocaleString()} JUGADORES ONLINE
              </Badge>
            </div>

            <h1 className="text-7xl md:text-8xl font-orbitron font-black mb-6 neon-text text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
              CRYPTO CASINO
            </h1>

            <div className="text-2xl md:text-3xl font-rajdhani font-bold mb-4 rainbow-text">LOS SANTOS PREMIUM</div>

            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-gray-200 font-rajdhani">
              🎲 El casino más exclusivo de Los Santos 🎲<br />
              <span className="text-yellow-400 font-bold">Juega con criptomonedas reales</span> y vive la experiencia
              más auténtica del roleplay
            </p>

            {/* Jackpot Counter */}
            <div className="mb-12">
              <div className="glass-effect rounded-2xl p-8 max-w-2xl mx-auto border-2 border-yellow-400/50">
                <div className="text-lg font-rajdhani text-gray-300 mb-2">🏆 MEGA JACKPOT PROGRESIVO 🏆</div>
                <div className="text-6xl md:text-7xl font-orbitron font-black jackpot-counter mb-2">
                  ${jackpotAmount.toLocaleString()}
                </div>
                <div className="text-sm font-rajdhani text-gray-400">Próximo ganador podrías ser TÚ</div>
              </div>
            </div>

            <div className="flex gap-6 justify-center flex-wrap">
              <Link href="/games">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-black font-rajdhani font-bold text-xl px-8 py-4 rounded-xl shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <Gamepad2 className="mr-3 h-6 w-6" />
                  JUGAR AHORA
                </Button>
              </Link>
              <Link href="/wallet">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent font-rajdhani font-bold text-xl px-8 py-4 rounded-xl shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <Coins className="mr-3 h-6 w-6" />
                  MI WALLET
                </Button>
              </Link>
              {!user && (
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-rajdhani font-bold text-xl px-8 py-4 rounded-xl shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <Zap className="mr-3 h-6 w-6" />
                    REGISTRARSE GRATIS
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Crypto Prices Ticker */}
      <section className="py-6 bg-black/60 backdrop-blur-sm border-y border-yellow-400/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 overflow-x-auto">
            <div className="flex items-center space-x-2 text-white font-rajdhani">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">PRECIOS EN VIVO:</span>
            </div>
            {Object.entries(cryptoPrices).map(([crypto, price]) => (
              <div key={crypto} className="flex items-center space-x-2 whitespace-nowrap">
                <Badge className="bg-yellow-500 text-black font-orbitron font-bold">{crypto}</Badge>
                <span className="text-white font-rajdhani font-bold">${price.toLocaleString()}</span>
                <Badge className="bg-green-500 text-white text-xs">+{(Math.random() * 5 + 1).toFixed(1)}%</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-orbitron font-black text-white mb-4 neon-text">
              JUEGOS DESTACADOS
            </h2>
            <p className="text-xl text-gray-300 font-rajdhani">Los favoritos de Los Santos</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredGames.map((game) => (
              <Card
                key={game.id}
                className={`casino-card border-0 text-white hover:scale-105 transition-all duration-500 relative overflow-hidden group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-90`}></div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>

                {game.hot && (
                  <Badge className="absolute top-4 right-4 bg-red-500 text-white font-rajdhani font-bold animate-pulse z-10">
                    🔥 HOT
                  </Badge>
                )}

                <CardHeader className="relative z-10">
                  <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
                    {game.icon}
                  </div>
                  <CardTitle className="text-2xl font-orbitron font-bold text-center">{game.name}</CardTitle>
                  <CardDescription className="text-white/90 text-center font-rajdhani">
                    {game.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-rajdhani">Jugadores:</span>
                      <Badge className="bg-white/20 text-white">
                        <Users className="w-3 h-3 mr-1" />
                        {game.players.toLocaleString()}
                      </Badge>
                    </div>

                    {game.jackpot && (
                      <div className="flex justify-between items-center">
                        <span className="font-rajdhani">Jackpot:</span>
                        <Badge className="bg-yellow-500 text-black font-orbitron font-bold">
                          <Trophy className="w-3 h-3 mr-1" />${game.jackpot.toLocaleString()}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Link href={`/games/${game.id}`}>
                    <Button className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-rajdhani font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105">
                      JUGAR AHORA
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-orbitron font-black text-white mb-4 neon-text">¿POR QUÉ ELEGIRNOS?</h2>
            <p className="text-xl text-gray-300 font-rajdhani">La experiencia de casino más auténtica</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center text-white group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-orbitron font-bold mb-3">100% SEGURO</h3>
              <p className="text-gray-300 font-rajdhani">Encriptación militar y wallets seguros</p>
            </div>

            <div className="text-center text-white group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-orbitron font-bold mb-3">RETIROS INSTANTÁNEOS</h3>
              <p className="text-gray-300 font-rajdhani">Cobra tus ganancias al instante</p>
            </div>

            <div className="text-center text-white group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-orbitron font-bold mb-3">COMUNIDAD ACTIVA</h3>
              <p className="text-gray-300 font-rajdhani">Miles de jugadores conectados 24/7</p>
            </div>

            <div className="text-center text-white group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Crown className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-orbitron font-bold mb-3">PROGRAMA VIP</h3>
              <p className="text-gray-300 font-rajdhani">Beneficios exclusivos y cashback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-orbitron font-black text-white mb-4 neon-text">PROMOCIONES ACTIVAS</h2>
            <p className="text-xl text-gray-300 font-rajdhani">Ofertas limitadas - ¡No te las pierdas!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="casino-card border-2 border-yellow-400 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-sm font-bold transform rotate-12 translate-x-2 -translate-y-1">
                HOT
              </div>
              <CardHeader>
                <div className="text-4xl text-center mb-4">🎁</div>
                <CardTitle className="text-2xl font-orbitron font-bold text-center text-yellow-400">
                  BONO DE BIENVENIDA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-orbitron font-bold text-green-400 mb-2">200% + 50 GIROS</div>
                <p className="text-gray-300 font-rajdhani mb-4">Hasta $50,000 + giros gratis en slots</p>
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-rajdhani font-bold">
                  RECLAMAR AHORA
                </Button>
              </CardContent>
            </Card>

            <Card className="casino-card border-2 border-purple-400 text-white">
              <CardHeader>
                <div className="text-4xl text-center mb-4">💎</div>
                <CardTitle className="text-2xl font-orbitron font-bold text-center text-purple-400">
                  CASHBACK VIP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-orbitron font-bold text-purple-400 mb-2">15% SEMANAL</div>
                <p className="text-gray-300 font-rajdhani mb-4">Recupera parte de tus pérdidas cada semana</p>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-rajdhani font-bold">
                  MÁS INFO
                </Button>
              </CardContent>
            </Card>

            <Card className="casino-card border-2 border-green-400 text-white">
              <CardHeader>
                <div className="text-4xl text-center mb-4">🏆</div>
                <CardTitle className="text-2xl font-orbitron font-bold text-center text-green-400">
                  TORNEO DIARIO
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-orbitron font-bold text-green-400 mb-2">$100,000</div>
                <p className="text-gray-300 font-rajdhani mb-4">Premio pool - Compite con otros jugadores</p>
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-rajdhani font-bold">
                  PARTICIPAR
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {user && (
        <section className="py-16 bg-black/40 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <Card className="casino-card text-white max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-3xl font-orbitron font-bold text-center text-yellow-400">
                  TUS ESTADÍSTICAS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-orbitron font-bold text-yellow-400 mb-2">
                      ${user.balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-300 font-rajdhani">Saldo Actual</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-orbitron font-bold text-green-400 mb-2">
                      {user.gameHistory.length}
                    </div>
                    <div className="text-sm text-gray-300 font-rajdhani">Juegos Jugados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-orbitron font-bold text-blue-400 mb-2">{user.level}</div>
                    <div className="text-sm text-gray-300 font-rajdhani">Nivel Actual</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-orbitron font-bold text-purple-400 mb-2">{user.vipStatus}</div>
                    <div className="text-sm text-gray-300 font-rajdhani">Estado VIP</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-sm py-12 border-t border-yellow-400/30">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">
            <div className="mb-6">
              <div className="text-3xl font-orbitron font-bold text-yellow-400 mb-2">CRYPTO CASINO LOS SANTOS</div>
              <p className="font-rajdhani">La experiencia de casino más auténtica del roleplay</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-orbitron font-bold text-white mb-3">JUEGOS</h4>
                <div className="space-y-2 font-rajdhani">
                  <div>Slots • Ruleta • Blackjack</div>
                  <div>Poker • Baccarat • Crash</div>
                  <div>Keno • Video Poker</div>
                </div>
              </div>
              <div>
                <h4 className="font-orbitron font-bold text-white mb-3">SOPORTE</h4>
                <div className="space-y-2 font-rajdhani">
                  <div>Chat en Vivo 24/7</div>
                  <div>Soporte Técnico</div>
                  <div>Guías de Juego</div>
                </div>
              </div>
              <div>
                <h4 className="font-orbitron font-bold text-white mb-3">SEGURIDAD</h4>
                <div className="space-y-2 font-rajdhani">
                  <div>Encriptación SSL</div>
                  <div>Juego Responsable</div>
                  <div>Verificación KYC</div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8">
              <p className="font-rajdhani text-lg mb-2">
                &copy; 2024 Crypto Casino Los Santos - Servidor de Roleplay GTA V
              </p>
              <p className="font-rajdhani text-sm text-gray-500">
                🎮 Solo para entretenimiento en el servidor • Dinero ficticio únicamente • Juega responsablemente 🎮
              </p>
              <div className="mt-4 flex justify-center space-x-6">
                <Badge className="bg-green-500 text-white font-rajdhani">✅ Licenciado</Badge>
                <Badge className="bg-blue-500 text-white font-rajdhani">🔒 Seguro</Badge>
                <Badge className="bg-purple-500 text-white font-rajdhani">⚡ Rápido</Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
