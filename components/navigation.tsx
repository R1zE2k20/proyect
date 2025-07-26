"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Wallet, User, Home, Gamepad2, Gift, LogOut, Bell, Crown, Zap } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, logout } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-yellow-400/30 sticky top-0 z-50 shadow-2xl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center neon-border text-black font-bold text-xl group-hover:scale-110 transition-transform">
                🎰
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-orbitron font-bold neon-text text-yellow-400">CRYPTO CASINO</h1>
              <p className="text-xs text-gray-400 font-rajdhani">Los Santos Premium</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="nav-link group">
              <Home className="inline w-4 h-4 mr-2 group-hover:text-yellow-400 transition-colors" />
              <span className="font-rajdhani font-medium">Inicio</span>
            </Link>
            <Link href="/games" className="nav-link group">
              <Gamepad2 className="inline w-4 h-4 mr-2 group-hover:text-yellow-400 transition-colors" />
              <span className="font-rajdhani font-medium">Juegos</span>
            </Link>
            <Link href="/wallet" className="nav-link group">
              <Wallet className="inline w-4 h-4 mr-2 group-hover:text-yellow-400 transition-colors" />
              <span className="font-rajdhani font-medium">Wallet</span>
            </Link>
            <Link href="/promotions" className="nav-link group">
              <Gift className="inline w-4 h-4 mr-2 group-hover:text-yellow-400 transition-colors" />
              <span className="font-rajdhani font-medium">Promociones</span>
              <Badge className="ml-2 bg-red-500 text-white text-xs animate-pulse">HOT</Badge>
            </Link>
            <Link href="/vip" className="nav-link group">
              <Crown className="inline w-4 h-4 mr-2 group-hover:text-yellow-400 transition-colors" />
              <span className="font-rajdhani font-medium">VIP Club</span>
            </Link>
          </div>

          {/* User Section */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Live Time */}
            <div className="text-center">
              <div className="text-xs text-gray-400 font-rajdhani">Los Santos</div>
              <div className="text-sm font-orbitron text-yellow-400">{currentTime.toLocaleTimeString()}</div>
            </div>

            {user ? (
              <>
                {/* Balance Display */}
                <div className="glass-effect rounded-lg px-4 py-2 border border-yellow-400/30">
                  <div className="text-xs text-gray-400 font-rajdhani">Saldo Total</div>
                  <div className="text-lg font-orbitron font-bold text-yellow-400 neon-text">
                    ${user.balance.toLocaleString()}
                  </div>
                </div>

                {/* Notifications */}
                <Button variant="ghost" className="relative text-white hover:text-yellow-400 p-2">
                  <Bell className="w-5 h-5" />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center">
                      {notifications}
                    </Badge>
                  )}
                </Button>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="status-indicator">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-rajdhani font-medium text-white">{user.username}</div>
                    <div className="text-xs text-gray-400">Nivel: Premium</div>
                  </div>
                  <Button variant="ghost" onClick={logout} className="text-white hover:text-red-400 p-2">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-x-3">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent font-rajdhani font-medium"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-600 hover:to-orange-600 font-rajdhani font-medium">
                    <Zap className="w-4 h-4 mr-2" />
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-white hover:text-yellow-400 p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-yellow-400/30 glass-effect rounded-b-lg">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-white hover:text-yellow-400 font-rajdhani font-medium px-4 py-2">
                <Home className="inline w-4 h-4 mr-3" />
                Inicio
              </Link>
              <Link href="/games" className="text-white hover:text-yellow-400 font-rajdhani font-medium px-4 py-2">
                <Gamepad2 className="inline w-4 h-4 mr-3" />
                Juegos
              </Link>
              <Link href="/wallet" className="text-white hover:text-yellow-400 font-rajdhani font-medium px-4 py-2">
                <Wallet className="inline w-4 h-4 mr-3" />
                Wallet
              </Link>
              <Link href="/promotions" className="text-white hover:text-yellow-400 font-rajdhani font-medium px-4 py-2">
                <Gift className="inline w-4 h-4 mr-3" />
                Promociones
              </Link>

              {user ? (
                <>
                  <div className="px-4 py-3 glass-effect rounded-lg mx-4 border border-yellow-400/30">
                    <div className="text-sm text-gray-400">Saldo: </div>
                    <div className="text-xl font-orbitron font-bold text-yellow-400">
                      ${user.balance.toLocaleString()}
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="text-white hover:text-yellow-400 font-rajdhani font-medium px-4 py-2"
                  >
                    <User className="inline w-4 h-4 mr-3" />
                    Perfil
                  </Link>
                  <button
                    onClick={logout}
                    className="text-left text-white hover:text-red-400 font-rajdhani font-medium px-4 py-2"
                  >
                    <LogOut className="inline w-4 h-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <div className="px-4 space-y-3">
                  <Link href="/login" className="block">
                    <Button className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
;<style jsx>{`
  .nav-link {
    @apply text-white hover:text-yellow-400 transition-all duration-300 font-rajdhani font-medium relative;
  }
  
  .nav-link::after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -4px;
    left: 50%;
    background: linear-gradient(90deg, #FFD700, #FFA500);
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }
  
  .nav-link:hover::after {
    width: 100%;
  }
`}</style>
