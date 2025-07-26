"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  email: string
  balance: number
  cryptoBalances: {
    BTC: number
    ETH: number
    LTC: number
    USDT: number
  }
  transactions: Transaction[]
  gameHistory: GameResult[]
  level: number
  xp: number
  vipStatus: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond"
  achievements: string[]
  lastLogin: Date
}

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus"
  amount: number
  crypto: string
  timestamp: Date
  status: "pending" | "completed" | "failed"
  description?: string
}

interface GameResult {
  id: string
  game: string
  bet: number
  win: number
  timestamp: Date
  multiplier?: number
  details?: any
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateBalance: (amount: number, description?: string) => void
  addTransaction: (transaction: Omit<Transaction, "id" | "timestamp">) => void
  addGameResult: (result: Omit<GameResult, "id" | "timestamp">) => void
  addXP: (amount: number) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario desde localStorage
    const savedUser = localStorage.getItem("casino-user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        // Convertir fechas de string a Date
        if (parsedUser.transactions) {
          parsedUser.transactions = parsedUser.transactions.map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp),
          }))
        }
        if (parsedUser.gameHistory) {
          parsedUser.gameHistory = parsedUser.gameHistory.map((g: any) => ({
            ...g,
            timestamp: new Date(g.timestamp),
          }))
        }
        if (parsedUser.lastLogin) {
          parsedUser.lastLogin = new Date(parsedUser.lastLogin)
        }
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("casino-user")
      }
    }
    setIsLoading(false)
  }, [])

  const saveUser = (userData: User) => {
    setUser(userData)
    localStorage.setItem("casino-user", JSON.stringify(userData))

    // También actualizar en la lista de usuarios
    const users = JSON.parse(localStorage.getItem("casino-users") || "[]")
    const userIndex = users.findIndex((u: any) => u.id === userData.id)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData, password: users[userIndex].password }
      localStorage.setItem("casino-users", JSON.stringify(users))
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulación de delay de red
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const users = JSON.parse(localStorage.getItem("casino-users") || "[]")
      const foundUser = users.find((u: any) => u.email === email && u.password === password)

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser
        const updatedUser = {
          ...userWithoutPassword,
          lastLogin: new Date(),
          // Asegurar que todas las propiedades existan
          level: userWithoutPassword.level || 1,
          xp: userWithoutPassword.xp || 0,
          vipStatus: userWithoutPassword.vipStatus || "Bronze",
          achievements: userWithoutPassword.achievements || [],
          transactions: userWithoutPassword.transactions || [],
          gameHistory: userWithoutPassword.gameHistory || [],
        }

        saveUser(updatedUser)
        setIsLoading(false)
        return true
      }
      setIsLoading(false)
      return false
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulación de delay de red
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const users = JSON.parse(localStorage.getItem("casino-users") || "[]")

      if (users.find((u: any) => u.email === email)) {
        setIsLoading(false)
        return false // Usuario ya existe
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        email,
        balance: 25000, // Bono de bienvenida mejorado
        cryptoBalances: {
          BTC: 0.25,
          ETH: 5,
          LTC: 25,
          USDT: 2500,
        },
        transactions: [
          {
            id: Date.now().toString(),
            type: "bonus",
            amount: 25000,
            crypto: "USD",
            timestamp: new Date(),
            status: "completed",
            description: "Bono de bienvenida",
          },
        ],
        gameHistory: [],
        level: 1,
        xp: 0,
        vipStatus: "Bronze",
        achievements: ["Nuevo Jugador"],
        lastLogin: new Date(),
      }

      users.push({ ...newUser, password })
      localStorage.setItem("casino-users", JSON.stringify(users))
      saveUser(newUser)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Register error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("casino-user")
  }

  const updateBalance = (amount: number, description?: string) => {
    if (user) {
      const newBalance = Math.max(0, user.balance + amount)
      const updatedUser = { ...user, balance: newBalance }

      // Agregar transacción automáticamente
      if (amount !== 0) {
        const transaction: Transaction = {
          id: Date.now().toString(),
          type: amount > 0 ? "win" : "bet",
          amount: Math.abs(amount),
          crypto: "USD",
          timestamp: new Date(),
          status: "completed",
          description: description || (amount > 0 ? "Ganancia del juego" : "Apuesta del juego"),
        }

        updatedUser.transactions = [transaction, ...updatedUser.transactions.slice(0, 99)] // Mantener solo 100 transacciones
      }

      saveUser(updatedUser)
    }
  }

  const addTransaction = (transaction: Omit<Transaction, "id" | "timestamp">) => {
    if (user) {
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        timestamp: new Date(),
      }

      const updatedUser = {
        ...user,
        transactions: [newTransaction, ...user.transactions.slice(0, 99)],
      }

      saveUser(updatedUser)
    }
  }

  const addGameResult = (result: Omit<GameResult, "id" | "timestamp">) => {
    if (user) {
      const newResult: GameResult = {
        ...result,
        id: Date.now().toString(),
        timestamp: new Date(),
      }

      const updatedUser = {
        ...user,
        gameHistory: [newResult, ...user.gameHistory.slice(0, 99)],
      }

      // Agregar XP basado en la apuesta
      const xpGained = Math.floor(result.bet / 10)
      addXP(xpGained)

      saveUser(updatedUser)
    }
  }

  const addXP = (amount: number) => {
    if (user) {
      const newXP = user.xp + amount
      let newLevel = user.level

      // Sistema de niveles: cada 1000 XP = 1 nivel
      const requiredXP = newLevel * 1000
      if (newXP >= requiredXP) {
        newLevel = Math.floor(newXP / 1000) + 1
      }

      // Actualizar VIP status basado en nivel
      let vipStatus = user.vipStatus
      if (newLevel >= 50) vipStatus = "Diamond"
      else if (newLevel >= 25) vipStatus = "Platinum"
      else if (newLevel >= 15) vipStatus = "Gold"
      else if (newLevel >= 8) vipStatus = "Silver"
      else vipStatus = "Bronze"

      const updatedUser = {
        ...user,
        xp: newXP,
        level: newLevel,
        vipStatus,
      }

      saveUser(updatedUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateBalance,
        addTransaction,
        addGameResult,
        addXP,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
